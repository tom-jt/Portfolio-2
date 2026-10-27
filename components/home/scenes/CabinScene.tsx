"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * A log cabin on a snowy night, a fire going in the stone hearth. Two
 * canvases and a glow between them:
 *
 *  back  — the room: log walls and floorboards lit from the fire, the stone
 *          chimney and its mantel, the sooty firebox, a braided wool rug,
 *          and the window, an armchair drawn up under it with a mug beside
 *          it: pines outside, snow piled on the sill. Drawn once.
 *  glow  — the firelight on the room, a gradient whose opacity flickers, so
 *          the room seems to move with the flames without being redrawn.
 *  front — the flames, then the logs and andirons in front of them (a sprite
 *          made once), sparks, snow falling past the window with frost on
 *          the glass over it, and steam off the mug.
 */

interface Layout {
  /** Where the wall meets the floor. */
  floor: number;
  /** The fireplace: its centre, width, and the top of its mantel. */
  fire: { x: number; w: number; mantel: number };
  /** The firebox, the opening the fire burns in. */
  box: { x: number; y: number; w: number; h: number };
  win: { x: number; y: number; w: number; h: number };
  chair: { x: number; s: number } | null;
  mug: { x: number; y: number; s: number } | null;
}

function layout(w: number, h: number): Layout {
  const portrait = w < h;
  const floor = h * (portrait ? 0.76 : 0.78);
  const fw = portrait ? Math.min(w * 0.66, h * 0.36) : Math.min(h * 0.5, w * 0.34);
  const fx = w * (portrait ? 0.4 : 0.38);
  const mantel = floor - fw * 0.82;
  const bw = fw * 0.56;
  const bh = fw * 0.5;
  const box = { x: fx - bw / 2, y: floor - fw * 0.05 - bh, w: bw, h: bh };
  // On a phone the greeting covers the top, so the window sits below it.
  const ww = portrait ? w * 0.25 : Math.min(w * 0.2, h * 0.36);
  const win = portrait
    ? { x: w * 0.7, y: h * 0.25, w: ww, h: ww * 1.35 }
    : { x: w * 0.68, y: h * 0.14, w: ww, h: Math.min(ww * 1.3, floor - h * 0.3) };
  const s = fw / 400;
  const chair = { x: win.x + win.w / 2, s: portrait ? s * 0.75 : s };
  const side = chair.x + 170 * s < w - 30 * s ? 1 : -1;
  return {
    floor,
    fire: { x: fx, w: fw, mantel },
    box,
    win,
    chair,
    mug: portrait ? null : { x: chair.x + side * 150 * s, y: floor + (h - floor) * 0.18, s },
  };
}

/** Rows of logs, each rounded by its light and shade, chinked between. */
function drawWall(ctx: CanvasRenderingContext2D, w: number, floor: number, rand: () => number) {
  const row = Math.max(20, floor / 15);
  for (let y = floor; y > -row; y -= row) {
    const top = y - row;
    const log = ctx.createLinearGradient(0, top, 0, y);
    log.addColorStop(0, "#5e3822");
    log.addColorStop(0.3, "#74472b");
    log.addColorStop(0.75, "#4a2a18");
    log.addColorStop(1, "#2a170d");
    ctx.fillStyle = log;
    ctx.fillRect(0, top, w, row);
    // Grain and knots along it.
    ctx.strokeStyle = "rgba(30,15,8,0.35)";
    ctx.lineWidth = 1;
    for (let i = 0; i < w / 90; i++) {
      const x = rand() * w;
      const gy = top + lerp(0.3, 0.7, rand()) * row;
      ctx.beginPath();
      ctx.moveTo(x, gy);
      ctx.lineTo(x + lerp(40, 160, rand()), gy + lerp(-1.5, 1.5, rand()));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(35,18,9,0.5)";
    for (let i = 0; i < w / 260; i++) {
      ctx.beginPath();
      ctx.ellipse(rand() * w, top + row * 0.5, row * 0.16, row * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // The chinking between this log and the one below.
    ctx.fillStyle = "#8c7a64";
    ctx.fillRect(0, y - 1.5, w, 2);
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, y + 0.5, w, 1);
  }
}

/** The floorboards, running back towards the hearth. */
function drawFloor(ctx: CanvasRenderingContext2D, w: number, h: number, l: Layout) {
  const { floor } = l;
  const boards = ctx.createLinearGradient(0, floor, 0, h);
  boards.addColorStop(0, "#4a2b18");
  boards.addColorStop(1, "#24130a");
  ctx.fillStyle = boards;
  ctx.fillRect(0, floor, w, h - floor);
  const vx = l.fire.x;
  const vy = floor - (h - floor) * 3;
  ctx.strokeStyle = "rgba(15,8,4,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -w; x < w * 2; x += Math.max(28, w / 30)) {
    // From the far edge of the floor to the bottom, along the lines to the vanishing point.
    const t = (floor - vy) / (h - vy);
    ctx.moveTo(vx + (x - vx) * t, floor);
    ctx.lineTo(x, h);
  }
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(0, floor, w, 3);
}

function drawRug(ctx: CanvasRenderingContext2D, h: number, l: Layout) {
  const cx = l.fire.x;
  const cy = l.floor + (h - l.floor) * 0.48;
  const rx = l.fire.w * 0.7;
  const ry = (h - l.floor) * 0.26;
  const rings = ["#4a1a14", "#7a2a20", "#8a7458", "#8e3326", "#6a241c", "#7e6a52", "#8a3024", "#6e261d"];
  rings.forEach((color, i) => {
    const k = 1 - i / rings.length;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx * k, ry * k, 0, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Fieldstone, laid in rough courses over dark mortar, inside a rect. */
function stones(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, rand: () => number) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = "#211b17";
  ctx.fillRect(x, y, w, h);
  const colors = ["#5e544a", "#4f463e", "#6a5e52", "#433b34", "#71634f", "#574a3e"];
  const course = Math.max(14, w / 9);
  for (let cy = y + h; cy > y - course; cy -= course * lerp(0.75, 1.05, rand())) {
    let cx = x - rand() * course;
    while (cx < x + w) {
      const sw = course * lerp(1, 2.1, rand());
      const sh = course * lerp(0.72, 0.92, rand());
      const r = sh * 0.35;
      ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
      ctx.beginPath();
      ctx.roundRect(cx + 1.5, cy - sh, sw - 3, sh - 2, r);
      ctx.fill();
      // Lit along the top, shaded along the bottom.
      ctx.fillStyle = "rgba(255,230,200,0.12)";
      ctx.fillRect(cx + r, cy - sh + 1, sw - 3 - r * 2, sh * 0.18);
      ctx.fillStyle = "rgba(0,0,0,0.2)";
      ctx.fillRect(cx + r, cy - sh * 0.28, sw - 3 - r * 2, sh * 0.2);
      cx += sw;
    }
  }
  ctx.restore();
}

function drawFireplace(ctx: CanvasRenderingContext2D, l: Layout, rand: () => number) {
  const { fire, box, floor } = l;
  const cw = fire.w * 0.72;
  const mt = fire.w * 0.075;
  // The chimney breast, up through the ceiling, then the surround below the mantel.
  stones(ctx, fire.x - cw / 2, 0, cw, fire.mantel, rand);
  stones(ctx, fire.x - fire.w / 2, fire.mantel + mt, fire.w, floor - fire.mantel - mt, rand);
  // The chimney goes up into the dark.
  const up = ctx.createLinearGradient(0, 0, 0, fire.mantel);
  up.addColorStop(0, "rgba(14,7,4,0.85)");
  up.addColorStop(1, "rgba(14,7,4,0.15)");
  ctx.fillStyle = up;
  ctx.fillRect(fire.x - cw / 2, 0, cw, fire.mantel);

  // The firebox: an arched opening, sooty black, glowing at its floor.
  const r = box.w * 0.22;
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + box.h);
  ctx.lineTo(box.x, box.y + r);
  ctx.quadraticCurveTo(box.x, box.y, box.x + r, box.y);
  ctx.lineTo(box.x + box.w - r, box.y);
  ctx.quadraticCurveTo(box.x + box.w, box.y, box.x + box.w, box.y + r);
  ctx.lineTo(box.x + box.w, box.y + box.h);
  ctx.closePath();
  const soot = ctx.createLinearGradient(0, box.y, 0, box.y + box.h);
  soot.addColorStop(0, "#0c0705");
  soot.addColorStop(0.6, "#1c0d07");
  soot.addColorStop(1, "#4a1f0c");
  ctx.fillStyle = soot;
  ctx.fill();
  ctx.save();
  ctx.clip();
  // Firebrick at the back, lit from the fire below and blackened above.
  const brick = box.h * 0.09;
  ctx.fillStyle = "rgba(130,55,28,0.22)";
  for (let row = 0, by = box.y + box.h; by > box.y; row++, by -= brick) {
    for (let bx = box.x - (row % 2) * brick; bx < box.x + box.w; bx += brick * 2) {
      ctx.fillRect(bx + 1, by - brick + 1, brick * 2 - 2, brick - 2);
    }
  }
  const embers = ctx.createRadialGradient(box.x + box.w / 2, box.y + box.h * 0.9, 0, box.x + box.w / 2, box.y + box.h * 0.9, box.w * 0.55);
  embers.addColorStop(0, "rgba(255,150,60,0.5)");
  embers.addColorStop(1, "rgba(255,90,30,0)");
  ctx.fillStyle = embers;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  // The throat: soot so thick the flames die away into it, under the lintel.
  const throat = ctx.createLinearGradient(0, box.y, 0, box.y + box.h * 0.55);
  throat.addColorStop(0, "rgba(4,2,1,1)");
  throat.addColorStop(0.45, "rgba(4,2,1,0.85)");
  throat.addColorStop(1, "rgba(4,2,1,0)");
  ctx.fillStyle = throat;
  ctx.fillRect(box.x, box.y, box.w, box.h * 0.55);
  ctx.restore();
  ctx.strokeStyle = "#3a3029";
  ctx.lineWidth = Math.max(3, box.w * 0.03);
  ctx.stroke();
  // An iron lintel across the top of the opening, and smoke staining the
  // stones above it.
  const lintel = Math.max(4, box.h * 0.05);
  ctx.fillStyle = "#16110e";
  ctx.fillRect(box.x + r * 0.35, box.y + r * 0.35, box.w - r * 0.7, lintel);
  ctx.fillStyle = "rgba(255,150,80,0.12)";
  ctx.fillRect(box.x + r * 0.35, box.y + r * 0.35 + lintel - 1.5, box.w - r * 0.7, 1.5);
  const smoke = ctx.createRadialGradient(box.x + box.w / 2, box.y, 0, box.x + box.w / 2, box.y, box.w * 0.55);
  smoke.addColorStop(0, "rgba(12,8,6,0.55)");
  smoke.addColorStop(1, "rgba(12,8,6,0)");
  ctx.fillStyle = smoke;
  ctx.fillRect(box.x - box.w * 0.1, box.y - box.w * 0.55, box.w * 1.2, box.w * 0.6);

  // The hearthstone, and the mantel beam across the top.
  const hw = fire.w * 1.12;
  const hh = fire.w * 0.05;
  ctx.fillStyle = "#5a524b";
  ctx.fillRect(fire.x - hw / 2, floor - hh, hw, hh + 3);
  ctx.fillStyle = "rgba(255,200,150,0.25)";
  ctx.fillRect(fire.x - hw / 2, floor - hh, hw, 2);
  const beamW = fire.w * 1.16;
  const beam = ctx.createLinearGradient(0, fire.mantel, 0, fire.mantel + mt);
  beam.addColorStop(0, "#7a4a2a");
  beam.addColorStop(1, "#3e2414");
  ctx.fillStyle = beam;
  ctx.fillRect(fire.x - beamW / 2, fire.mantel, beamW, mt);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(fire.x - cw / 2, fire.mantel + mt, cw, mt * 0.5);

  // On the mantel: a few books, a candle, and a jar of pine sprigs.
  const s = fire.w / 400;
  const shelf = fire.mantel;
  const books: [dx: number, bw: number, bh: number, color: string][] = [
    [-150, 11, 34, "#7a2620"],
    [-139, 9, 30, "#2f4a3a"],
    [-130, 12, 36, "#b08a4a"],
    [-118, 10, 28, "#3a3a5a"],
  ];
  for (const [dx, bw, bh, color] of books) {
    ctx.fillStyle = color;
    ctx.fillRect(fire.x + dx * s, shelf - bh * s, bw * s, bh * s);
  }
  ctx.fillStyle = "#efe3c8";
  ctx.fillRect(fire.x + 120 * s, shelf - 26 * s, 8 * s, 26 * s);
  ctx.fillStyle = "#ffd28a";
  ctx.beginPath();
  ctx.ellipse(fire.x + 124 * s, shelf - 31 * s, 2.4 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const candle = ctx.createRadialGradient(fire.x + 124 * s, shelf - 31 * s, 0, fire.x + 124 * s, shelf - 31 * s, 40 * s);
  candle.addColorStop(0, "rgba(255,200,120,0.35)");
  candle.addColorStop(1, "rgba(255,200,120,0)");
  ctx.fillStyle = candle;
  ctx.fillRect(fire.x + 84 * s, shelf - 71 * s, 80 * s, 80 * s);
  ctx.fillStyle = "rgba(200,220,230,0.35)";
  ctx.fillRect(fire.x + 92 * s, shelf - 22 * s, 14 * s, 22 * s);
  ctx.strokeStyle = "#2f5a3a";
  ctx.lineWidth = 2 * s;
  ctx.beginPath();
  for (const a of [-0.5, -0.15, 0.2, 0.55]) {
    ctx.moveTo(fire.x + 99 * s, shelf - 20 * s);
    ctx.lineTo(fire.x + 99 * s + Math.sin(a) * 22 * s, shelf - 20 * s - Math.cos(a) * 26 * s);
  }
  ctx.stroke();
}

/** The night outside the window: sky, pines in the snow, and the pane's frame. */
function drawWindow(ctx: CanvasRenderingContext2D, l: Layout, rand: () => number) {
  const { x, y, w, h } = l.win;
  const f = Math.max(6, w * 0.06);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, "#0a1430");
  sky.addColorStop(0.65, "#1d2e52");
  sky.addColorStop(1, "#33476e");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);
  const moon = ctx.createRadialGradient(x + w * 0.75, y + h * 0.18, 0, x + w * 0.75, y + h * 0.18, w * 0.6);
  moon.addColorStop(0, "rgba(210,225,255,0.4)");
  moon.addColorStop(1, "rgba(210,225,255,0)");
  ctx.fillStyle = moon;
  ctx.fillRect(x, y, w, h);
  // The snowy ground, and pines standing in it, far ones paler.
  const ground = y + h * 0.72;
  for (const [count, scale, color] of [
    [7, 0.6, "#2a3d5e"],
    [5, 1, "#132239"],
  ] as const) {
    for (let i = 0; i < count; i++) {
      const px = x + rand() * w;
      const ph = h * 0.32 * scale * lerp(0.7, 1.2, rand());
      const pw = ph * 0.42;
      const py = ground + h * 0.03 * scale;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(px, py - ph);
      ctx.lineTo(px + pw / 2, py);
      ctx.lineTo(px - pw / 2, py);
      ctx.fill();
      // Snow caught on its tiers.
      ctx.fillStyle = "rgba(220,232,250,0.35)";
      for (let k = 1; k <= 3; k++) {
        const ty = py - ph + (ph * k) / 4;
        const tw = (pw * k) / 4;
        ctx.beginPath();
        ctx.moveTo(px - tw / 2, ty);
        ctx.lineTo(px, ty - ph * 0.08);
        ctx.lineTo(px + tw / 2, ty);
        ctx.fill();
      }
    }
  }
  const snow = ctx.createLinearGradient(0, ground, 0, y + h);
  snow.addColorStop(0, "#8ea4c4");
  snow.addColorStop(1, "#c2d0e4");
  ctx.fillStyle = snow;
  ctx.fillRect(x, ground, w, y + h - ground);
  // Snow banked up against the glass, outside.
  ctx.fillStyle = "#e4ecf6";
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  for (let k = 0; k <= 8; k++) {
    const px = x + (w * k) / 8;
    ctx.lineTo(px, y + h - h * lerp(0.05, 0.09, rand()));
  }
  ctx.lineTo(x + w, y + h);
  ctx.fill();
  // Firelight reflected faintly in the glass.
  const warm = ctx.createLinearGradient(x, 0, x + w, 0);
  warm.addColorStop(0, "rgba(255,150,70,0.12)");
  warm.addColorStop(1, "rgba(255,150,70,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  // The frame and its cross of glazing bars.
  ctx.fillStyle = "#1e1209";
  ctx.fillRect(x - f, y - f, w + f * 2, f);
  ctx.fillRect(x - f, y, f, h);
  ctx.fillRect(x + w, y, f, h);
  ctx.fillRect(x + w / 2 - f * 0.3, y, f * 0.6, h);
  ctx.fillRect(x, y + h * 0.48 - f * 0.3, w, f * 0.6);
  ctx.fillStyle = "rgba(255,170,100,0.1)";
  ctx.fillRect(x - f, y - f, f * 0.35, h + f);
  // The sill inside, deep in the log wall.
  ctx.fillStyle = "#2a190e";
  ctx.fillRect(x - f * 1.8, y + h, w + f * 3.6, f * 1.2);
  ctx.fillStyle = "rgba(255,200,150,0.12)";
  ctx.fillRect(x - f * 1.8, y + h, w + f * 3.6, 1.5);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fillRect(x - f * 1.8, y + h + f * 1.2, w + f * 3.6, f * 0.5);
}

/** Frost in the corners of each pane, laid over the snow as it falls. */
function frostSprite(win: Layout["win"], rand: () => number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(win.w);
  c.height = Math.ceil(win.h);
  const g = c.getContext("2d")!;
  const panes = [
    [0, 0],
    [win.w / 2, 0],
    [0, win.h * 0.48],
    [win.w / 2, win.h * 0.48],
  ];
  const pw = win.w / 2;
  const ph = win.h * 0.48;
  for (const [px, py] of panes) {
    for (const [cx, cy] of [
      [px, py],
      [px + pw, py],
      [px, py + ph],
      [px + pw, py + ph],
    ]) {
      // Thickest at the window's own corners, faint where the bars cross.
      const outerCorner = (cx === 0 || cx === win.w) && (cy === 0 || cy === win.h * 0.48 + ph);
      const r = pw * (outerCorner ? 0.5 : 0.25);
      const frost = g.createRadialGradient(cx, cy, 0, cx, cy, r);
      frost.addColorStop(0, `rgba(225,238,255,${outerCorner ? 0.4 : 0.18})`);
      frost.addColorStop(0.5, "rgba(225,238,255,0.08)");
      frost.addColorStop(1, "rgba(225,238,255,0)");
      g.fillStyle = frost;
      g.fillRect(cx - r, cy - r, r * 2, r * 2);
      // Fronds of ice crystal reaching in from the corner.
      g.strokeStyle = `rgba(240,248,255,${outerCorner ? 0.4 : 0.15})`;
      g.lineWidth = 0.7;
      g.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = Math.atan2(py + ph / 2 - cy, px + pw / 2 - cx) + lerp(-0.7, 0.7, rand());
        const len = r * lerp(0.3, 0.8, rand());
        const ex = cx + Math.cos(a) * len;
        const ey = cy + Math.sin(a) * len;
        g.moveTo(cx, cy);
        g.lineTo(ex, ey);
        for (let k = 1; k <= 3; k++) {
          const bx = cx + (ex - cx) * (k / 4);
          const by = cy + (ey - cy) * (k / 4);
          const bl = len * 0.18 * (1 - k / 5);
          g.moveTo(bx, by);
          g.lineTo(bx + Math.cos(a + 0.7) * bl, by + Math.sin(a + 0.7) * bl);
          g.moveTo(bx, by);
          g.lineTo(bx + Math.cos(a - 0.7) * bl, by + Math.sin(a - 0.7) * bl);
        }
      }
      g.stroke();
    }
  }
  return c;
}

/** A wingback armchair turned to the fire, its near side catching the light. */
function drawChair(ctx: CanvasRenderingContext2D, floor: number, chair: { x: number; s: number }) {
  const { x, s } = chair;
  const y = floor + 60 * s;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x, y + 4 * s, 120 * s, 14 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const wool = ctx.createLinearGradient(x - 110 * s, 0, x + 110 * s, 0);
  wool.addColorStop(0, "#8a2c22");
  wool.addColorStop(0.35, "#5a1c16");
  wool.addColorStop(1, "#2a0d0a");
  ctx.fillStyle = wool;
  // The back and its wings.
  ctx.beginPath();
  ctx.moveTo(x - 70 * s, y - 40 * s);
  ctx.lineTo(x - 78 * s, y - 190 * s);
  ctx.quadraticCurveTo(x - 76 * s, y - 228 * s, x - 30 * s, y - 232 * s);
  ctx.lineTo(x + 40 * s, y - 232 * s);
  ctx.quadraticCurveTo(x + 84 * s, y - 228 * s, x + 82 * s, y - 190 * s);
  ctx.lineTo(x + 76 * s, y - 40 * s);
  ctx.closePath();
  ctx.fill();
  // The arms, rolled over at the top.
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.roundRect(x + (side < 0 ? -108 : 70) * s, y - 112 * s, 38 * s, 98 * s, 14 * s);
    ctx.fill();
  }
  ctx.fillStyle = "#2a0d0a";
  ctx.fillRect(x - 96 * s, y - 20 * s, 192 * s, 18 * s);
  ctx.fillStyle = "#24140b";
  for (const lx of [-90, 84]) ctx.fillRect(x + lx * s, y - 4 * s, 8 * s, 10 * s);
  // Firelight along the edge facing the hearth.
  ctx.strokeStyle = "rgba(255,160,80,0.5)";
  ctx.lineWidth = 2.5 * s;
  ctx.beginPath();
  ctx.moveTo(x - 107 * s, y - 20 * s);
  ctx.lineTo(x - 107 * s, y - 100 * s);
  ctx.moveTo(x - 72 * s, y - 120 * s);
  ctx.lineTo(x - 78 * s, y - 190 * s);
  ctx.quadraticCurveTo(x - 76 * s, y - 228 * s, x - 30 * s, y - 232 * s);
  ctx.stroke();
  // A knitted throw over the back.
  ctx.fillStyle = "#e6d6bc";
  ctx.beginPath();
  ctx.moveTo(x + 4 * s, y - 232 * s);
  ctx.lineTo(x + 46 * s, y - 232 * s);
  ctx.quadraticCurveTo(x + 54 * s, y - 190 * s, x + 50 * s, y - 166 * s);
  ctx.lineTo(x + 10 * s, y - 160 * s);
  ctx.quadraticCurveTo(x + 12 * s, y - 200 * s, x + 4 * s, y - 232 * s);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(122,38,32,0.7)";
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  for (const k of [0.35, 0.7]) {
    ctx.moveTo(x + lerp(4, 10, k) * s, y + lerp(-232, -160, k) * s);
    ctx.lineTo(x + lerp(46, 50, k) * s, y + lerp(-232, -166, k) * s);
  }
  ctx.stroke();
}

/** A stool beside the chair, a mug of something hot on it. */
function drawMug(ctx: CanvasRenderingContext2D, mug: { x: number; y: number; s: number }) {
  const { x, y, s } = mug;
  ctx.fillStyle = "#3a2214";
  ctx.fillRect(x - 6 * s, y - 70 * s, 12 * s, 70 * s);
  ctx.fillStyle = "#5e3822";
  ctx.beginPath();
  ctx.ellipse(x, y - 70 * s, 42 * s, 10 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,180,110,0.3)";
  ctx.beginPath();
  ctx.ellipse(x - 8 * s, y - 72 * s, 26 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e8dccb";
  ctx.fillRect(x - 11 * s, y - 98 * s, 22 * s, 26 * s);
  ctx.strokeStyle = "#e8dccb";
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.arc(x + 13 * s, y - 86 * s, 6 * s, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = "#7a2620";
  ctx.fillRect(x - 11 * s, y - 88 * s, 22 * s, 4 * s);
  ctx.fillStyle = "#4a2a18";
  ctx.beginPath();
  ctx.ellipse(x, y - 98 * s, 11 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawBack(ctx: CanvasRenderingContext2D, w: number, h: number, l: Layout) {
  const rand = seeded(23);
  drawWall(ctx, w, l.floor, rand);
  drawFloor(ctx, w, h, l);
  drawRug(ctx, h, l);
  drawFireplace(ctx, l, rand);
  if (l.chair) drawChair(ctx, l.floor, l.chair);
  if (l.mug) drawMug(ctx, l.mug);

  // The fire is the only light: everything falls into shadow away from it,
  // the top corners darkest.
  const fx = l.fire.x;
  const fy = l.box.y + l.box.h * 0.6;
  const reach = Math.max(w, h) * 0.8;
  const dark = ctx.createRadialGradient(fx, fy, l.fire.w * 0.25, fx, fy, reach);
  dark.addColorStop(0, "rgba(12,6,3,0)");
  dark.addColorStop(0.3, "rgba(12,6,3,0.5)");
  dark.addColorStop(1, "rgba(12,6,3,0.9)");
  ctx.fillStyle = dark;
  ctx.fillRect(0, 0, w, h);
  // The night outside has its own light, the moon on the snow, so the window
  // goes in after the shadow; its frame is drawn as dark as the wall round it.
  drawWindow(ctx, l, rand);
  // Shade the floor's near edge, under the cards.
  const near = ctx.createLinearGradient(0, h * 0.86, 0, h);
  near.addColorStop(0, "rgba(10,5,3,0)");
  near.addColorStop(1, "rgba(10,5,3,0.5)");
  ctx.fillStyle = near;
  ctx.fillRect(0, h * 0.86, w, h * 0.14);
}

/**
 * A split log lying across the grate: bark along it, charred black beneath
 * with embers glowing in its cracks, and a sawn end showing its rings.
 * Drawn about its centre, lengthways along x; `end` is which end shows.
 */
function drawLog(g: CanvasRenderingContext2D, len: number, r: number, end: 1 | -1, rand: () => number) {
  const body = g.createLinearGradient(0, -r, 0, r);
  body.addColorStop(0, "#6a4630");
  body.addColorStop(0.3, "#4a2e1c");
  body.addColorStop(0.65, "#2a170c");
  body.addColorStop(1, "#0e0705");
  g.fillStyle = body;
  g.beginPath();
  g.roundRect(-len / 2, -r, len, r * 2, r * 0.35);
  g.fill();
  // Bark: ridges running along it, broken here and there.
  g.lineWidth = Math.max(0.8, r * 0.07);
  for (let i = 0; i < 9; i++) {
    const y = lerp(-0.85, 0.5, rand()) * r;
    const x0 = lerp(-0.5, 0.2, rand()) * len;
    const x1 = x0 + lerp(0.2, 0.55, rand()) * len;
    g.strokeStyle = i % 3 ? "rgba(18,9,4,0.6)" : "rgba(150,105,70,0.35)";
    g.beginPath();
    g.moveTo(x0, y);
    for (let x = x0; x < x1; x += r * 0.6) g.lineTo(x, y + lerp(-0.08, 0.08, rand()) * r);
    g.stroke();
  }
  // Charred patches, and embers in the cracks underneath.
  g.fillStyle = "rgba(8,4,2,0.75)";
  for (let i = 0; i < 6; i++) {
    g.beginPath();
    g.ellipse(lerp(-0.45, 0.45, rand()) * len, lerp(0.3, 0.8, rand()) * r, lerp(0.15, 0.4, rand()) * r * 2, r * 0.22, 0, 0, Math.PI * 2);
    g.fill();
  }
  const ember = g.createLinearGradient(0, r * 0.3, 0, r);
  ember.addColorStop(0, "rgba(255,110,30,0)");
  ember.addColorStop(1, "rgba(255,110,30,0.55)");
  g.fillStyle = ember;
  g.fillRect(-len / 2 + r * 0.3, r * 0.3, len - r * 0.6, r * 0.7);
  g.strokeStyle = "rgba(255,150,60,0.9)";
  g.lineWidth = Math.max(0.8, r * 0.06);
  g.beginPath();
  for (let i = 0; i < 7; i++) {
    const x = lerp(-0.42, 0.42, rand()) * len;
    const y = lerp(0.45, 0.85, rand()) * r;
    g.moveTo(x, y);
    g.lineTo(x + lerp(0.3, 0.9, rand()) * r, y + lerp(-0.1, 0.1, rand()) * r);
  }
  g.stroke();
  // The sawn end: pale wood, its rings, a split, and a charred rim.
  const ex = (end * len) / 2;
  g.fillStyle = "#b88d5e";
  g.beginPath();
  g.ellipse(ex, 0, r * 0.42, r * 0.98, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(110,70,40,0.6)";
  g.lineWidth = Math.max(0.6, r * 0.05);
  for (const k of [0.78, 0.56, 0.34]) {
    g.beginPath();
    g.ellipse(ex + end * r * 0.03, 0, r * 0.42 * k, r * 0.98 * k, 0, 0, Math.PI * 2);
    g.stroke();
  }
  g.fillStyle = "#6e4528";
  g.beginPath();
  g.ellipse(ex + end * r * 0.04, 0, r * 0.06, r * 0.1, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.moveTo(ex, -r * 0.1);
  g.lineTo(ex - end * r * 0.05, -r * 0.8);
  g.stroke();
  g.strokeStyle = "#1a0e08";
  g.lineWidth = r * 0.12;
  g.beginPath();
  g.ellipse(ex, 0, r * 0.42, r * 0.98, 0, 0, Math.PI * 2);
  g.stroke();
}

/** The fire's logs on their grate between two andirons, made once at the
 *  firebox's size and drawn over the flames, so the flames rise from among
 *  the logs rather than in front of them. */
function logsSprite(box: Layout["box"], dpr: number, rand: () => number) {
  const c = document.createElement("canvas");
  c.width = Math.ceil(box.w * dpr);
  c.height = Math.ceil(box.h * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  const { w, h } = box;
  const gy = h * 0.9;
  const r = h * 0.085;
  // The grate's bars, under the logs.
  g.fillStyle = "#181210";
  g.fillRect(w * 0.16, gy, w * 0.68, h * 0.025);
  for (let x = w * 0.2; x < w * 0.82; x += w * 0.08) g.fillRect(x, gy, w * 0.012, h * 0.07);
  // Two logs side by side on the grate, a third laid on top across them.
  const logs: [x: number, y: number, len: number, r: number, angle: number, end: 1 | -1][] = [
    [0.43, gy - r, 0.62, r, -0.04, -1],
    [0.58, gy - r * 0.95, 0.58, r * 0.95, 0.05, 1],
    [0.5, gy - r * 2.5, 0.5, r * 0.85, -0.1, 1],
  ];
  for (const [x, y, len, lr, angle, end] of logs) {
    g.save();
    g.translate(w * x, y);
    g.rotate(angle);
    drawLog(g, w * len, lr, end, rand);
    g.restore();
  }
  // The andirons standing in front: an iron post each side, a ball on top,
  // their inner edges catching the fire.
  for (const x of [0.13, 0.87]) {
    const px = w * x;
    const pw = w * 0.032;
    g.fillStyle = "#1a1512";
    g.fillRect(px - pw / 2, gy - r * 3, pw, h * 0.1 + r * 3);
    g.beginPath();
    g.arc(px, gy - r * 3 - pw * 0.6, pw * 0.85, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(px - pw * 1.8, h);
    g.quadraticCurveTo(px, h * 0.93, px + pw * 1.8, h);
    g.fill();
    g.fillStyle = "rgba(255,150,80,0.4)";
    g.fillRect(x < 0.5 ? px + pw / 2 - 1.2 : px - pw / 2, gy - r * 3, 1.2, h * 0.1 + r * 3);
  }
  return c;
}

/** A soft round sprite, drawn once and stamped: glow, embers, steam. */
function puff(radius: number, rgb: string, core = 0.9) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(radius * 2);
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${rgb},${core})`);
  grad.addColorStop(0.35, `rgba(${rgb},${core * 0.4})`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

/** How bright the fire is at time t: a few out-of-step sines, never still. */
const flicker = (t: number) =>
  0.8 + Math.sin(t * 7.3) * 0.08 + Math.sin(t * 13.1 + 1) * 0.06 + Math.sin(t * 3.7 + 2) * 0.06;

const CabinScene = () => {
  const backRef = useRef<HTMLCanvasElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const back = backRef.current;
    const glow = glowRef.current;
    const front = frontRef.current;
    if (!back || !glow || !front) return;
    let stop = () => {};

    const setup = () => {
      stop();
      const b = fitCanvas(back, cappedDpr(1.5));
      const l = layout(b.w, b.h);
      drawBack(b.ctx, b.w, b.h, l);

      const { ctx, w, h } = fitCanvas(front, cappedDpr(1.5));
      const rand = seeded(31);
      const { box, win } = l;

      // The firelight on the room, centred on the flames.
      const fx = box.x + box.w / 2;
      const fy = box.y + box.h * 0.7;
      glow.style.background = `radial-gradient(circle at ${fx}px ${fy}px, rgb(255 150 60 / 0.36), rgb(255 120 40 / 0.12) ${Math.round(l.fire.w * 0.9)}px, transparent ${Math.round(l.fire.w * 2.2)}px)`;

      // Tongues of flame rising from among the logs, the middle ones tallest.
      // The tallest stay well under the lintel, and the gradient has faded
      // them out before their tips, so they die away into the dark.
      const base = box.y + box.h * 0.9 - box.h * 0.085 * 1.6;
      const tall = box.h * 0.6;
      const tongues = Array.from({ length: 10 }, (_, i) => {
        const u = (i + 0.5) / 10;
        return {
          x: box.x + box.w * lerp(0.3, 0.7, u + lerp(-0.03, 0.03, rand())),
          w: box.w * lerp(0.07, 0.11, rand()),
          h: tall * lerp(0.55, 0.95, 1 - Math.abs(u - 0.5) * 2) * lerp(0.85, 1.05, rand()),
          phase: rand() * Math.PI * 2,
          rate: lerp(5, 9, rand()),
        };
      });
      // One gradient for all the flames, made once: gold at the base, red and
      // then nothing towards the tips.
      const outer = ctx.createLinearGradient(0, base, 0, base - tall);
      outer.addColorStop(0, "rgba(255,210,100,0.95)");
      outer.addColorStop(0.4, "rgba(255,140,45,0.9)");
      outer.addColorStop(0.72, "rgba(225,70,25,0.4)");
      outer.addColorStop(1, "rgba(160,30,10,0)");
      const inner = ctx.createLinearGradient(0, base, 0, base - tall * 0.5);
      inner.addColorStop(0, "rgba(255,250,220,0.95)");
      inner.addColorStop(1, "rgba(255,210,110,0)");
      const logs = logsSprite(box, cappedDpr(1.5), rand);
      const bed = puff(box.w * 0.3, "255,120,40", 0.7);
      const fireGlow = puff(box.w * 0.6, "255,140,50", 0.6);

      const sparks = Array.from({ length: 14 }, () => ({ age: rand() * 2.5, x: rand(), seed: rand() * 10 }));
      const ember = puff(3, "255,180,90");

      // Snow falling past the window: far flakes small and slow, near ones bigger.
      const flakes = Array.from({ length: Math.round((win.w * win.h) / 700) }, () => ({
        x: win.x + rand() * win.w,
        y: win.y + rand() * win.h,
        r: rand() < 0.7 ? lerp(0.6, 1.2, rand()) : lerp(1.4, 2.2, rand()),
        speed: lerp(14, 40, rand()),
        sway: rand() * Math.PI * 2,
      }));
      for (const f of flakes) f.speed *= f.r;
      const frost = frostSprite(win, rand);
      const f = Math.max(6, win.w * 0.06);
      const panes = new Path2D();
      panes.rect(win.x, win.y, win.w / 2 - f * 0.3, win.h * 0.48 - f * 0.3);
      panes.rect(win.x + win.w / 2 + f * 0.3, win.y, win.w / 2 - f * 0.3, win.h * 0.48 - f * 0.3);
      panes.rect(win.x, win.y + win.h * 0.48 + f * 0.3, win.w / 2 - f * 0.3, win.h * 0.52 - f * 0.3);
      panes.rect(win.x + win.w / 2 + f * 0.3, win.y + win.h * 0.48 + f * 0.3, win.w / 2 - f * 0.3, win.h * 0.52 - f * 0.3);

      const steam = l.mug ? Array.from({ length: 10 }, () => ({ age: rand() * 3.5, seed: rand() * 10 })) : [];
      const steamPuff = puff(16, "255,245,235", 0.5);

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);
        const bright = flicker(t);
        glow.style.opacity = bright.toFixed(3);

        // The fire: its glow, then the tongues, then the hot core.
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = bright * 0.8;
        ctx.drawImage(fireGlow, fx - fireGlow.width / 2, base - fireGlow.height * 0.6);
        ctx.globalAlpha = 1;
        for (const [grad, scale] of [
          [outer, 1],
          [inner, 0.55],
        ] as const) {
          ctx.fillStyle = grad;
          ctx.beginPath();
          for (const tg of tongues) {
            const lick = 0.75 + Math.sin(t * tg.rate + tg.phase) * 0.15 + Math.sin(t * tg.rate * 1.9 + tg.phase * 2) * 0.1;
            const th = tg.h * lick * scale;
            const tw = tg.w * scale;
            const sway = Math.sin(t * 3 + tg.phase) * tw * 0.6;
            // A teardrop: full at the base, drawn out to a wavering tip.
            ctx.moveTo(tg.x - tw, base);
            ctx.bezierCurveTo(tg.x - tw * 1.3, base - th * 0.35, tg.x - tw * 0.2 + sway * 0.5, base - th * 0.6, tg.x + sway, base - th);
            ctx.bezierCurveTo(tg.x + tw * 0.2 + sway * 0.5, base - th * 0.6, tg.x + tw * 1.3, base - th * 0.35, tg.x + tw, base);
          }
          ctx.fill();
        }

        ctx.restore();

        // The logs in front of the flames, and the embers under them breathing.
        ctx.drawImage(logs, box.x, box.y, box.w, box.h);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = bright * 0.55;
        ctx.drawImage(bed, fx - bed.width / 2, box.y + box.h * 0.9 - bed.height / 2);

        // Sparks floating up off the logs, fading out in the throat.
        for (const sp of sparks) {
          sp.age += dt;
          if (sp.age > 2.5) {
            sp.age -= 2.5;
            sp.x = Math.random();
          }
          const k = sp.age / 2.5;
          const sx = box.x + box.w * lerp(0.3, 0.7, sp.x) + Math.sin(sp.age * 4 + sp.seed) * 6;
          const sy = base - k * (base - box.y - box.h * 0.2);
          ctx.globalAlpha = (1 - k) * 0.9;
          ctx.drawImage(ember, sx - 3, sy - 3);
        }
        ctx.restore();

        // Snow outside, behind the frost on the glass.
        ctx.save();
        ctx.clip(panes);
        ctx.fillStyle = "rgba(235,242,255,0.85)";
        ctx.beginPath();
        for (const fl of flakes) {
          fl.y += fl.speed * dt;
          if (fl.y > win.y + win.h) {
            fl.y = win.y - 4;
            fl.x = win.x + Math.random() * win.w;
          }
          const x = fl.x + Math.sin(t * 0.8 + fl.sway) * 6 * fl.r;
          ctx.moveTo(x + fl.r, fl.y);
          ctx.arc(x, fl.y, fl.r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.drawImage(frost, win.x, win.y);
        ctx.restore();

        // Steam off the mug.
        if (l.mug) {
          const { x: mx, y: my, s } = l.mug;
          for (const p of steam) {
            p.age += dt;
            if (p.age > 3.5) p.age -= 3.5;
            const k = p.age / 3.5;
            const size = (8 + k * 22) * s * 2;
            ctx.globalAlpha = Math.sin(k * Math.PI) * 0.35;
            ctx.drawImage(
              steamPuff,
              mx + Math.sin(p.age * 1.4 + p.seed) * 8 * s * (0.3 + k) - size / 2,
              my - 100 * s - k * 90 * s - size / 2,
              size,
              size,
            );
          }
          ctx.globalAlpha = 1;
        }
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
      <div ref={glowRef} className="absolute inset-0" />
      <canvas ref={frontRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_45%_55%,transparent_40%,rgb(10_5_2/0.55)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default CabinScene;
