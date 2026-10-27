"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * A reading room at night. Two canvases:
 *
 *  back  — the room: shelves of books up to the ceiling, an arched window
 *          on the night sky, a grandfather clock, and the desk in front with
 *          its green-shaded lamp and the pool of light under it. Drawn once.
 *  front — rain on the window, the clock's pendulum, the lamp's glow
 *          breathing, and dust turning slowly in its light.
 */

interface Layout {
  /** The arched window: its box, the arch being the top `w / 2` of it. */
  win: { x: number; y: number; w: number; h: number };
  /** Where the floor meets the wall, and where the desk's top begins. */
  floor: number;
  desk: number;
  /** The bookcases' spans across the wall. */
  shelves: [number, number][];
  clock: { x: number; w: number; top: number };
  lamp: { x: number; y: number; s: number };
}

function layout(w: number, h: number): Layout {
  const portrait = w < h;
  const s = Math.min(w, h) / 800;
  if (portrait) {
    // On a phone the greeting covers the top, so the window starts below it.
    const ww = w * 0.46;
    const x = (w - ww) / 2;
    const floor = h * 0.74;
    return {
      win: { x, y: h * 0.24, w: ww, h: h * 0.36 },
      floor,
      desk: h * 0.8,
      shelves: [
        [0, x - 10],
        [x + ww + 10, w],
      ],
      clock: { x: w * 0.87, w: Math.max(34, 44 * s), top: h * 0.4 },
      lamp: { x: w * 0.3, y: h * 0.86, s: Math.max(0.62, s) },
    };
  }
  const ww = Math.min(w * 0.24, h * 0.42);
  const x = (w - ww) / 2;
  const gap = Math.max(ww * 0.5, 90 * s);
  const floor = h * 0.76;
  return {
    win: { x, y: h * 0.1, w: ww, h: h * 0.54 },
    floor,
    desk: h * 0.82,
    shelves: [
      [0, x - gap * 0.45],
      [x + ww + gap, w],
    ],
    clock: { x: x + ww + gap * 0.5, w: Math.min(gap * 0.62, 64 * s), top: h * 0.2 },
    lamp: { x: w * 0.3, y: h * 0.89, s: Math.max(0.7, s) * 1.2 },
  };
}

/** The window's outline: a rectangle with a round arch on top. */
function arch(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, 0);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
}

const SPINES = ["#5a2a24", "#2f4a3a", "#6b5230", "#3a3550", "#7a4a2a", "#2a3a4a", "#6a3a3a", "#4a5a3a", "#8a6a3a", "#3d2b20", "#5b4a6a", "#2e2a24"];

/**
 * One book on a shelf, standing on `base`. It pivots on a bottom corner at
 * `x`: leaning right (`angle` > 0) on its right corner, left on its left
 * one, and upright with `x` at its right edge.
 */
function drawBook(ctx: CanvasRenderingContext2D, x: number, base: number, bw: number, bh: number, angle: number, color: string, s: number) {
  ctx.save();
  ctx.translate(x, base);
  if (angle) ctx.rotate(angle);
  const left = angle < 0 ? 0 : -bw;
  ctx.fillStyle = color;
  ctx.fillRect(left, -bh, bw, bh);
  // Gilt bands near the head and tail, and a darker edge for roundness.
  if (bw > 5) {
    ctx.fillStyle = "rgba(214,170,90,0.35)";
    ctx.fillRect(left + 1, -bh * 0.88, bw - 2, Math.max(1, 1.4 * s));
    ctx.fillRect(left + 1, -bh * 0.14, bw - 2, Math.max(1, 1.4 * s));
  }
  const edge = Math.max(1, bw * 0.18);
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.fillRect(left + bw - edge, -bh, edge, bh);
  ctx.restore();
}

/** A bookcase from the ceiling to the floor, its shelves full of books. */
function drawShelves(ctx: CanvasRenderingContext2D, x0: number, x1: number, floor: number, s: number, rand: () => number) {
  if (x1 - x0 < 10) return;
  const side = 10 * s + 4;
  ctx.fillStyle = "#24170f";
  ctx.fillRect(x0, 0, x1 - x0, floor);
  const row = Math.max(48, 92 * s);
  const board = Math.max(4, 7 * s);
  for (let top = floor - row; top > -row; top -= row) {
    // The back of the shelf, darker under the board above.
    const back = ctx.createLinearGradient(0, top, 0, top + row);
    back.addColorStop(0, "#0d0806");
    back.addColorStop(1, "#1d120b");
    ctx.fillStyle = back;
    ctx.fillRect(x0 + side, top, x1 - x0 - side * 2, row - board);
    // Books standing shoulder to shoulder, now and then one leaning: resting
    // on its bottom corner, its top against the next book or the previous
    // one, or against the end of the case where a row runs short.
    const base = top + row - board;
    const clear = row - board;
    const end = x1 - side;
    const thin = 6 * (s + 0.3);
    let bx = x0 + side;
    // The height of what stands just to the left (the case's side is tall),
    // and how tall the next book must be for one to lean on it.
    let prev = Infinity;
    let atLeast = 0;
    while (end - bx >= 3) {
      const room = end - bx;
      let bw = lerp(6, 15, rand()) * (s + 0.3);
      let bh = lerp(0.58, 0.88, rand()) * clear;
      const color = SPINES[Math.floor(rand() * SPINES.length)];
      const lean = lerp(0.14, 0.34, rand());
      const roll = rand();
      // Kept clear of the board above, however it tilts.
      bh = Math.min(bh, (clear * 0.94 - bw * Math.sin(lean)) / Math.cos(lean));
      const footprint = bw * Math.cos(lean) + bh * Math.sin(lean);

      if (!atLeast && roll < 0.05 && room >= footprint + thin * 1.5) {
        // Leaning right, on the next book, which stands tall enough to take it.
        const pivot = bx + bw * Math.cos(lean);
        drawBook(ctx, pivot, base, bw, bh, lean, color, s);
        bx = pivot + bh * Math.sin(lean);
        atLeast = Math.min(clear * 0.9, bh * Math.cos(lean) + 3);
        prev = 0;
        continue;
      }
      if (!atLeast && roll < 0.09 && prev >= bh * Math.cos(lean) + 2 && room >= footprint + thin) {
        // Leaning left, on the book before it.
        const pivot = bx + bh * Math.sin(lean);
        drawBook(ctx, pivot, base, bw, bh, -lean, color, s);
        bx = pivot + bw * Math.cos(lean);
        prev = 0;
        continue;
      }
      if (room < bw + thin && room > bw * 0.6) {
        // The row's end: too narrow for one more upright, so the last one
        // leans into the gap against the case's side, tilted just enough to
        // fill it.
        const fit = (a: number) => bw * Math.cos(a) + bh * Math.sin(a) - room;
        if (!atLeast && fit(0) < 0 && fit(0.4) > 0) {
          let lo = 0;
          let hi = 0.4;
          for (let k = 0; k < 16; k++) {
            const mid = (lo + hi) / 2;
            if (fit(mid) < 0) lo = mid;
            else hi = mid;
          }
          const a = lo;
          bh = Math.min(bh, (clear * 0.94 - bw * Math.sin(a)) / Math.cos(a));
          drawBook(ctx, end - bh * Math.sin(a), base, bw, bh, a, color, s);
          break;
        }
        bw = room;
      }
      bw = Math.min(bw, room);
      bh = Math.max(bh, atLeast);
      drawBook(ctx, bx + bw, base, bw, bh, 0, color, s);
      bx += bw;
      prev = bh;
      atLeast = 0;
    }
    // The board itself, lit along its front edge.
    ctx.fillStyle = "#3a2516";
    ctx.fillRect(x0, top + row - board, x1 - x0, board);
    ctx.fillStyle = "rgba(255,200,140,0.12)";
    ctx.fillRect(x0, top + row - board, x1 - x0, 1);
  }
  // The uprights at either end.
  ctx.fillStyle = "#2e1d12";
  ctx.fillRect(x0, 0, side, floor);
  ctx.fillRect(x1 - side, 0, side, floor);
}

function drawWindow(ctx: CanvasRenderingContext2D, win: Layout["win"], s: number, rand: () => number) {
  const { x, y, w, h } = win;
  const frame = Math.max(6, 12 * s);
  // The deep reveal round the glass, and the sill.
  ctx.fillStyle = "#2a1b11";
  arch(ctx, x - frame * 1.6, y - frame * 1.6, w + frame * 3.2, h + frame * 1.6);
  ctx.fill();
  ctx.fillStyle = "#3b2617";
  ctx.fillRect(x - frame * 2.2, y + h, w + frame * 4.4, frame * 1.2);

  ctx.save();
  arch(ctx, x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, "#0a1230");
  sky.addColorStop(0.6, "#18224a");
  sky.addColorStop(1, "#2a2a4a");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  // The moon behind thin cloud, upper right of the pane.
  const mx = x + w * 0.68;
  const my = y + w * 0.38;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, w * 0.6);
  halo.addColorStop(0, "rgba(220,230,255,0.4)");
  halo.addColorStop(0.25, "rgba(180,200,250,0.12)");
  halo.addColorStop(1, "rgba(180,200,250,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#e9eefc";
  ctx.beginPath();
  ctx.arc(mx, my, Math.max(5, w * 0.07), 0, Math.PI * 2);
  ctx.fill();
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `rgba(230,236,255,${lerp(0.25, 0.7, rand())})`;
    ctx.fillRect(x + rand() * w, y + rand() * h * 0.6, 1.2, 1.2);
  }
  // Treetops and a far roof, black against the sky.
  ctx.fillStyle = "#070a16";
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (let px = x; px <= x + w + 6; px += 6) {
    const u = (px - x) / w;
    ctx.lineTo(px, y + h * (0.84 - Math.sin(u * 9 + 1) * 0.03 - Math.sin(u * 23) * 0.015 - (u > 0.55 && u < 0.8 ? 0.06 : 0)));
  }
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  ctx.restore();

  // The frame and its glazing bars: a centre bar, a transom, and spokes in
  // the arch.
  ctx.strokeStyle = "#1a100a";
  ctx.lineWidth = frame;
  arch(ctx, x, y, w, h);
  ctx.stroke();
  ctx.lineWidth = Math.max(2, 4 * s);
  const r = w / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + r, y + h);
  ctx.moveTo(x, y + r);
  ctx.lineTo(x + w, y + r);
  for (const a of [-0.75, -0.25]) {
    ctx.moveTo(x + r, y + r);
    ctx.lineTo(x + r + Math.cos(a * Math.PI) * r, y + r + Math.sin(a * Math.PI) * r);
  }
  for (let k = 1; k < 3; k++) {
    const py = y + r + ((h - r) * k) / 3;
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py);
  }
  ctx.stroke();
}

function drawClock(ctx: CanvasRenderingContext2D, c: Layout["clock"], floor: number, s: number) {
  const { x, w, top } = c;
  const hood = w * 1.15;
  const hoodH = w * 1.25;
  const trunkTop = top + hoodH;
  const baseTop = floor - w * 0.9;
  // Hood with its arched top, trunk, and plinth.
  ctx.fillStyle = "#3a2213";
  ctx.beginPath();
  ctx.moveTo(x - hood / 2, trunkTop);
  ctx.lineTo(x - hood / 2, top + hood * 0.3);
  ctx.quadraticCurveTo(x, top - hood * 0.25, x + hood / 2, top + hood * 0.3);
  ctx.lineTo(x + hood / 2, trunkTop);
  ctx.fill();
  ctx.fillStyle = "#33200f";
  ctx.fillRect(x - w * 0.42, trunkTop, w * 0.84, baseTop - trunkTop);
  ctx.fillStyle = "#3a2213";
  ctx.fillRect(x - w * 0.55, baseTop, w * 1.1, floor - baseTop);
  ctx.fillStyle = "rgba(255,200,140,0.1)";
  ctx.fillRect(x - w * 0.55, baseTop, w * 1.1, 1.5);
  // The face: brass ring, cream dial, hours, and the hands at ten to twelve.
  const fy = top + hoodH * 0.55;
  const fr = w * 0.36;
  ctx.fillStyle = "#b8893a";
  ctx.beginPath();
  ctx.arc(x, fy, fr * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8dcc0";
  ctx.beginPath();
  ctx.arc(x, fy, fr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3a2a1a";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.fillRect(x + Math.cos(a) * fr * 0.8 - 0.6, fy + Math.sin(a) * fr * 0.8 - 0.6, 1.2, 1.2);
  }
  ctx.strokeStyle = "#2a1a10";
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1, 1.6 * s);
  ctx.beginPath();
  ctx.moveTo(x, fy);
  ctx.lineTo(x + Math.cos(-Math.PI / 2 - 0.1) * fr * 0.55, fy + Math.sin(-Math.PI / 2 - 0.1) * fr * 0.55);
  ctx.moveTo(x, fy);
  ctx.lineTo(x + Math.cos(-Math.PI / 2 - 1.05) * fr * 0.78, fy + Math.sin(-Math.PI / 2 - 1.05) * fr * 0.78);
  ctx.stroke();
  // The glass door on the trunk, where the pendulum swings.
  const door = pendulumWindow(c, floor);
  ctx.fillStyle = "#120a06";
  ctx.fillRect(door.x, door.y, door.w, door.h);
  ctx.strokeStyle = "#b8893a";
  ctx.lineWidth = Math.max(1, 1.5 * s);
  ctx.strokeRect(door.x, door.y, door.w, door.h);
}

/** The clock's glass door, shared by the back and front canvases. */
function pendulumWindow(c: Layout["clock"], floor: number) {
  const trunkTop = c.top + c.w * 1.25;
  const baseTop = floor - c.w * 0.9;
  const pad = (baseTop - trunkTop) * 0.1;
  return { x: c.x - c.w * 0.26, y: trunkTop + pad, w: c.w * 0.52, h: baseTop - trunkTop - pad * 2 };
}

/**
 * An open book lying on the desk, seen from above and in front: two pages
 * rising in a curve from the spine, the page block's thickness at the near
 * edge, lines of text following the curve, and the lamp's light falling
 * across it from the left. (cx, top) is the spine at the far edge.
 */
function drawOpenBook(ctx: CanvasRenderingContext2D, cx: number, top: number, ls: number) {
  const half = 54 * ls;
  const depth = 24 * ls;
  const rise = 5 * ls;
  // A page's edge, far or near: from the spine out to the corner, bowed up
  // over the curve of the page.
  const edge = (side: number, y: number) => {
    ctx.lineTo(cx + side * half * 0.45, y - rise);
    ctx.quadraticCurveTo(cx + side * half * 0.9, y - rise * 0.8, cx + side * half, y + rise * 0.2);
  };
  const page = (side: number, lift: number) => {
    ctx.beginPath();
    ctx.moveTo(cx, top + lift);
    ctx.quadraticCurveTo(cx + side * half * 0.15, top - rise * 0.8 + lift, cx + side * half * 0.45, top - rise + lift);
    edge(side, top + lift);
    ctx.lineTo(cx + side * half, top + depth + rise * 0.2 + lift);
    ctx.quadraticCurveTo(cx + side * half * 0.9, top + depth - rise * 0.8 + lift, cx + side * half * 0.45, top + depth - rise + lift);
    ctx.quadraticCurveTo(cx + side * half * 0.15, top + depth - rise * 0.8 + lift, cx, top + depth + lift);
    ctx.closePath();
  };

  // The cover, just showing round the pages, and its shadow on the desk.
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx + 4 * ls, top + depth + 5 * ls, half * 1.08, 5 * ls, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5a2420";
  ctx.beginPath();
  ctx.moveTo(cx - half - 3 * ls, top + 2 * ls);
  ctx.lineTo(cx + half + 3 * ls, top + 2 * ls);
  ctx.lineTo(cx + half + 4 * ls, top + depth + 5 * ls);
  ctx.lineTo(cx - half - 4 * ls, top + depth + 5 * ls);
  ctx.closePath();
  ctx.fill();

  // The page block's thickness: a few pages showing under the top ones at
  // the near edge.
  for (const side of [-1, 1]) {
    for (let k = 3; k >= 1; k--) {
      ctx.fillStyle = k % 2 ? "#cdbb94" : "#ddcca6";
      page(side, k * 1.1 * ls);
      ctx.fill();
    }
  }

  // The open pages: lit from the left, where the lamp is, dimming across.
  const light = ctx.createLinearGradient(cx - half, 0, cx + half, 0);
  light.addColorStop(0, "#fff2d4");
  light.addColorStop(0.55, "#f0e2c0");
  light.addColorStop(1, "#cfbd96");
  for (const side of [-1, 1]) {
    ctx.fillStyle = light;
    page(side, 0);
    ctx.fill();
  }
  // Shade in the gutter, where the pages curve down into the spine.
  const gutter = ctx.createLinearGradient(cx - half * 0.2, 0, cx + half * 0.2, 0);
  gutter.addColorStop(0, "rgba(90,60,30,0)");
  gutter.addColorStop(0.5, "rgba(90,60,30,0.35)");
  gutter.addColorStop(1, "rgba(90,60,30,0)");
  ctx.fillStyle = gutter;
  ctx.fillRect(cx - half * 0.2, top - rise, half * 0.4, depth + rise * 1.5);
  ctx.strokeStyle = "rgba(90,60,30,0.45)";
  ctx.lineWidth = Math.max(0.6, 0.7 * ls);
  ctx.beginPath();
  ctx.moveTo(cx, top);
  ctx.lineTo(cx, top + depth);
  ctx.stroke();

  // Lines of text, following each page's curve, the last of a paragraph short.
  ctx.strokeStyle = "rgba(70,50,35,0.42)";
  ctx.lineWidth = Math.max(0.6, 0.8 * ls);
  ctx.beginPath();
  for (const side of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      const f = (k + 1.2) / 8.4;
      const y = top + depth * f;
      const short = k === 3 ? 0.55 : 1;
      const x0 = cx + side * half * 0.12;
      const x1 = cx + side * half * lerp(0.12, 0.88, short);
      ctx.moveTo(x0, y - rise * 0.55);
      ctx.quadraticCurveTo(cx + side * half * 0.4, y - rise * 1.05, x1, y - rise * (short < 1 ? 0.95 : 0.6));
    }
  }
  ctx.stroke();
}

function drawDesk(ctx: CanvasRenderingContext2D, w: number, h: number, l: Layout) {
  const { lamp } = l;
  const ls = lamp.s;
  // The desk, its top running out of the bottom of the window.
  const top = ctx.createLinearGradient(0, l.desk, 0, h);
  top.addColorStop(0, "#3d2414");
  top.addColorStop(1, "#22140b");
  ctx.fillStyle = top;
  ctx.fillRect(0, l.desk, w, h - l.desk);
  ctx.fillStyle = "rgba(255,210,150,0.16)";
  ctx.fillRect(0, l.desk, w, 1.5);
  // A green leather inlay, and the grain of the wood around it.
  ctx.fillStyle = "#1f3a2a";
  ctx.fillRect(w * 0.12, l.desk + (h - l.desk) * 0.22, w * 0.76, h);
  ctx.strokeStyle = "rgba(200,170,90,0.25)";
  ctx.lineWidth = 1;
  ctx.strokeRect(w * 0.12 + 3, l.desk + (h - l.desk) * 0.22 + 3, w * 0.76 - 6, h);

  // The lamp's pool of light on the desk, and up the wall behind.
  const sx = lamp.x;
  const sy = lamp.y - 96 * ls;
  const pool = ctx.createRadialGradient(sx, lamp.y, 0, sx, lamp.y, 260 * ls);
  pool.addColorStop(0, "rgba(255,200,120,0.4)");
  pool.addColorStop(0.5, "rgba(255,180,100,0.12)");
  pool.addColorStop(1, "rgba(255,180,100,0)");
  ctx.fillStyle = pool;
  ctx.fillRect(sx - 260 * ls, l.desk, 520 * ls, h - l.desk);

  // A stack of books to the lamp's left.
  const bx = lamp.x - 100 * ls;
  const by = lamp.y + 4 * ls;
  const stack: [color: string, width: number, dx: number][] = [
    ["#6a2c24", 64, 0],
    ["#2f5a42", 58, 4],
    ["#7a5a2c", 66, -3],
  ];
  stack.forEach(([color, bw, dx], i) => {
    const x = bx + dx * ls;
    const y = by - (i + 1) * 11 * ls;
    // The cover, with the pages showing at the fore-edge only.
    ctx.fillStyle = color;
    ctx.fillRect(x, y, bw * ls, 10 * ls);
    ctx.fillStyle = "#d9cba8";
    ctx.fillRect(x + 1 * ls, y + 2 * ls, 3 * ls, 6 * ls);
    ctx.fillStyle = "rgba(214,170,90,0.6)";
    ctx.fillRect(x + bw * ls * 0.45, y + 4.5 * ls, bw * ls * 0.4, 1);
  });

  drawOpenBook(ctx, lamp.x + 100 * ls, lamp.y - 10 * ls, ls);

  // The banker's lamp: brass base and stem, green glass shade.
  ctx.fillStyle = "#8a6424";
  ctx.beginPath();
  ctx.ellipse(lamp.x, lamp.y, 30 * ls, 7 * ls, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c79a4a";
  ctx.beginPath();
  ctx.ellipse(lamp.x, lamp.y - 2 * ls, 26 * ls, 5 * ls, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b8893a";
  ctx.fillRect(lamp.x - 2.5 * ls, sy, 5 * ls, lamp.y - sy);
  ctx.fillRect(lamp.x - 14 * ls, sy + 4 * ls, 28 * ls, 3 * ls);
  const shade = ctx.createLinearGradient(0, sy - 20 * ls, 0, sy + 6 * ls);
  shade.addColorStop(0, "#2f7a4a");
  shade.addColorStop(0.6, "#1a5a34");
  shade.addColorStop(1, "#0f3a22");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(lamp.x - 46 * ls, sy + 4 * ls);
  ctx.quadraticCurveTo(lamp.x - 44 * ls, sy - 22 * ls, lamp.x, sy - 24 * ls);
  ctx.quadraticCurveTo(lamp.x + 44 * ls, sy - 22 * ls, lamp.x + 46 * ls, sy + 4 * ls);
  ctx.closePath();
  ctx.fill();
  // Light catching the top of the glass, and the bright rim underneath.
  ctx.fillStyle = "rgba(160,240,190,0.25)";
  ctx.beginPath();
  ctx.ellipse(lamp.x - 10 * ls, sy - 15 * ls, 22 * ls, 4 * ls, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe2a8";
  ctx.beginPath();
  ctx.ellipse(lamp.x, sy + 4 * ls, 44 * ls, 3.2 * ls, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBack(ctx: CanvasRenderingContext2D, w: number, h: number, l: Layout) {
  const s = Math.min(w, h) / 800;
  const rand = seeded(17);

  // Panelled wall behind everything.
  const wall = ctx.createLinearGradient(0, 0, 0, l.floor);
  wall.addColorStop(0, "#140d09");
  wall.addColorStop(1, "#2a1a10");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, l.floor);
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 2;
  for (let px = 0; px < w; px += Math.max(60, 120 * s)) {
    ctx.strokeRect(px + 8, l.floor * 0.55, Math.max(60, 120 * s) - 16, l.floor * 0.4);
  }

  for (const [x0, x1] of l.shelves) drawShelves(ctx, x0, x1, l.floor, s, rand);
  drawWindow(ctx, l.win, s, rand);
  drawClock(ctx, l.clock, l.floor, s);

  // The floor, and a rug on it.
  ctx.fillStyle = "#1c110a";
  ctx.fillRect(0, l.floor, w, l.desk - l.floor);
  const rugTop = l.floor + (l.desk - l.floor) * 0.25;
  ctx.fillStyle = "#3e1a16";
  ctx.beginPath();
  ctx.moveTo(w * 0.3, rugTop);
  ctx.lineTo(w * 0.7, rugTop);
  ctx.lineTo(w * 0.82, l.desk);
  ctx.lineTo(w * 0.18, l.desk);
  ctx.fill();
  ctx.strokeStyle = "rgba(214,170,90,0.22)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(w * 0.31, rugTop + 3);
  ctx.lineTo(w * 0.69, rugTop + 3);
  ctx.lineTo(w * 0.8, l.desk);
  ctx.moveTo(w * 0.31, rugTop + 3);
  ctx.lineTo(w * 0.2, l.desk);
  ctx.stroke();

  // Night everywhere the lamp doesn't reach: darkest up at the ceiling and
  // out at the edges, so the greeting reads over the shelves.
  const { lamp } = l;
  const dark = ctx.createRadialGradient(lamp.x, lamp.y - 80 * lamp.s, 0, lamp.x, lamp.y - 80 * lamp.s, Math.max(w, h) * 0.95);
  dark.addColorStop(0, "rgba(6,4,2,0)");
  dark.addColorStop(0.35, "rgba(6,4,2,0.25)");
  dark.addColorStop(1, "rgba(6,4,2,0.72)");
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, w, h);
  const ceiling = ctx.createLinearGradient(0, 0, 0, h * 0.35);
  ceiling.addColorStop(0, "rgba(6,4,2,0.6)");
  ceiling.addColorStop(1, "rgba(6,4,2,0)");
  ctx.fillStyle = ceiling;
  ctx.fillRect(0, 0, w, h * 0.35);
  // The lamp's warmth on the nearer shelves and the wall.
  const warm = ctx.createRadialGradient(lamp.x, lamp.y - 100 * lamp.s, 0, lamp.x, lamp.y - 100 * lamp.s, Math.max(w, h) * 0.5);
  warm.addColorStop(0, "rgba(255,170,90,0.16)");
  warm.addColorStop(1, "rgba(255,170,90,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);

  drawDesk(ctx, w, h, l);
}

/** The pendulum's brass bob, lit from the lamp's side, rendered once. */
function bobSprite(radius: number) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(radius * 2 + 4);
  const g = c.getContext("2d")!;
  const m = c.width / 2;
  const grad = g.createRadialGradient(m - radius * 0.35, m - radius * 0.35, 0, m, m, radius);
  grad.addColorStop(0, "#fbe2a0");
  grad.addColorStop(0.5, "#c79a4a");
  grad.addColorStop(1, "#6f521f");
  g.fillStyle = grad;
  g.beginPath();
  g.arc(m, m, radius, 0, Math.PI * 2);
  g.fill();
  return c;
}

/** A soft round glow, rendered once and stamped every frame. */
function glowSprite(radius: number, rgb: string, core = 0.9) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(radius * 2);
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${rgb},${core})`);
  grad.addColorStop(0.25, `rgba(${rgb},${core * 0.35})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

const LibraryScene = () => {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) return;
    let stop = () => {};

    const setup = () => {
      stop();
      const b = fitCanvas(back, cappedDpr(1.5));
      const l = layout(b.w, b.h);
      drawBack(b.ctx, b.w, b.h, l);

      const { ctx, w, h } = fitCanvas(front, cappedDpr(1.5));
      const rand = seeded(23);
      const { win, lamp } = l;
      const ls = lamp.s;

      const rain = Array.from({ length: Math.round((win.w * win.h) / 3200) }, () => ({
        x: win.x + rand() * win.w,
        y: win.y + rand() * win.h,
        len: lerp(7, 14, rand()),
        speed: lerp(420, 700, rand()),
      }));
      const beads = Array.from({ length: Math.round((win.w * win.h) / 2600) }, () => ({
        x: win.x + rand() * win.w,
        y: win.y + rand() * win.h,
        r: lerp(0.7, 2, rand()),
      }));
      const runs = Array.from({ length: 4 }, () => ({
        x: win.x + rand() * win.w,
        y: win.y + rand() * win.h,
        r: lerp(1.6, 2.6, rand()),
        speed: lerp(20, 55, rand()),
        wobble: rand() * Math.PI * 2,
      }));

      const door = pendulumWindow(l.clock, l.floor);
      const bob = bobSprite(Math.max(3.5, door.w * 0.3));

      // The lamp's glow, centred under the shade, and the dust in its light.
      const shadeY = lamp.y - 96 * ls;
      const glowR = 220 * ls;
      const glow = glowSprite(glowR, "255,196,120", 0.32);
      const mote = glowSprite(3, "255,232,190", 1);
      const motes = Array.from({ length: 46 }, () => ({
        x: lamp.x + lerp(-170, 170, rand()) * ls,
        y: lerp(shadeY - 60 * ls, lamp.y, rand()),
        phase: rand() * Math.PI * 2,
        rate: lerp(0.05, 0.16, rand()),
        size: lerp(0.5, 1.2, rand()),
      }));

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);

        // Rain outside, and on, the window.
        ctx.save();
        arch(ctx, win.x, win.y, win.w, win.h);
        ctx.clip();
        ctx.strokeStyle = "rgba(170,195,240,0.26)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (const d of rain) {
          d.y += d.speed * dt;
          if (d.y > win.y + win.h) {
            d.y = win.y - d.len;
            d.x = win.x + Math.random() * win.w;
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * 0.05, d.y + d.len);
        }
        ctx.stroke();
        ctx.fillStyle = "rgba(210,225,255,0.16)";
        ctx.beginPath();
        for (const bd of beads) {
          ctx.moveTo(bd.x + bd.r, bd.y);
          ctx.arc(bd.x, bd.y, bd.r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.fillStyle = "rgba(220,232,255,0.16)";
        for (const r of runs) {
          r.y += r.speed * dt;
          if (r.y > win.y + win.h + 10) {
            r.y = win.y - 10;
            r.x = win.x + Math.random() * win.w;
          }
          const x = r.x + Math.sin(r.y * 0.04 + r.wobble) * 2;
          ctx.fillRect(x - r.r * 0.35, r.y - 40, r.r * 0.7, 40);
          ctx.beginPath();
          ctx.ellipse(x, r.y, r.r, r.r * 1.25, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // The pendulum, a beat a second, swinging as wide as its door allows.
        const px = door.x + door.w / 2;
        const py = door.y + 2;
        const len = door.h * 0.82;
        const angle = Math.sin(t * Math.PI) * Math.asin(Math.max(0, door.w / 2 - bob.width / 2 - 1) / len);
        const ex = px + Math.sin(angle) * len;
        const ey = py + Math.cos(angle) * len;
        ctx.save();
        ctx.beginPath();
        ctx.rect(door.x, door.y, door.w, door.h);
        ctx.clip();
        ctx.strokeStyle = "#a07a34";
        ctx.lineWidth = Math.max(1, door.w * 0.06);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.drawImage(bob, ex - bob.width / 2, ey - bob.height / 2);
        ctx.restore();

        // The lamp's glow, breathing very slightly.
        ctx.globalAlpha = 0.9 + Math.sin(t * 1.3) * 0.06 + Math.sin(t * 4.7) * 0.02;
        ctx.drawImage(glow, lamp.x - glowR, shadeY + 20 * ls - glowR);

        // Dust turning in the light: brightest under the shade.
        for (const m of motes) {
          const mx = m.x + Math.sin(t * m.rate * 2 + m.phase) * 26 * ls;
          const my = m.y + Math.cos(t * m.rate * 1.4 + m.phase * 1.7) * 18 * ls - ((t * m.rate * 14) % 40) * ls;
          const d = Math.hypot(mx - lamp.x, (my - (shadeY + 50 * ls)) * 1.3) / (190 * ls);
          const a = Math.max(0, 1 - d) * (0.55 + Math.sin(t * 0.9 + m.phase) * 0.3);
          if (a <= 0.02) continue;
          ctx.globalAlpha = a;
          const sz = 6 * m.size;
          ctx.drawImage(mote, mx - sz / 2, my - sz / 2, sz, sz);
        }
        ctx.globalAlpha = 1;
      };

      if (reduced) {
        frame(0, 0);
        return;
      }
      stop = animate(frame);
    };

    setup();
    const stopResize = onResize(setup);
    return () => {
      stop();
      stopResize();
    };
  }, [reduced]);

  return (
    <div className="absolute inset-0">
      <canvas ref={backRef} className="absolute inset-0 h-full w-full" />
      <canvas ref={frontRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_55%,transparent_40%,rgb(6_4_2/0.55)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default LibraryScene;
