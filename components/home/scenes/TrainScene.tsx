"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * A night train: the view from a carriage window. The carriage wall, the
 * sky and the moon are drawn once to the back canvas; the window's frame,
 * the blind, the table with its lamp and cup, and the seat once to the canvas
 * in front. Between them, clipped to the glass, the middle canvas moves the
 * country going by (far hills slowly, near bushes fast, each a tile that
 * loops), telegraph poles and now and then a lamp sweeping past, the rain
 * blown back across the glass, and the steam off the cup. The view outside
 * rocks a little with the carriage.
 */

type Rand = () => number;
type Layout = ReturnType<typeof layout>;

/** Where everything sits, in CSS px. A single wide window, its sill a table. */
function layout(w: number, h: number) {
  const s = Math.min(w, h) / 900;
  const portrait = h > w;
  const x = w * (portrait ? 0.06 : 0.07);
  const y = h * (portrait ? 0.15 : 0.14);
  const ww = w - x * 2;
  const wh = h * (portrait ? 0.48 : 0.52);
  const sill = y + wh;
  return {
    s,
    portrait,
    win: { x, y, w: ww, h: wh, r: 26 * s + 8, frame: 16 * s + 4 },
    sill,
    horizon: y + wh * 0.6,
    lamp: { x: x + ww * (portrait ? 0.8 : 0.86), y: sill + 28 * s },
    cup: { x: x + ww * (portrait ? 0.5 : 0.7), y: sill + 38 * s },
  };
}

/** An offscreen canvas, `width` × `height` CSS px at `scale`, drawn in CSS px. */
function sprite(width: number, height: number, scale: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.ceil(width * scale));
  c.height = Math.max(1, Math.ceil(height * scale));
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  draw(g);
  return c;
}

/**
 * A skyline that repeats every `period` px: sines with whole numbers of
 * cycles across it, so a tile of it loops without a seam.
 */
function ridge(rand: Rand, period: number, waves: [cycles: number, amp: number][]) {
  const phases = waves.map(() => rand() * Math.PI * 2);
  return (x: number) =>
    waves.reduce((y, [k, a], i) => y + a * Math.sin((x / period) * Math.PI * 2 * k + phases[i]), 0);
}

/** Fills under a skyline across a tile, down to `bottom`. */
function fillRidge(g: CanvasRenderingContext2D, width: number, bottom: number, top: (x: number) => number) {
  g.beginPath();
  g.moveTo(0, bottom);
  for (let x = 0; ; x = Math.min(width, x + 4)) {
    g.lineTo(x, top(x));
    if (x === width) break;
  }
  g.lineTo(width, bottom);
  g.fill();
}

/** Draws something at x and again a tile's width either side, so whatever
 *  straddles an edge of the tile is whole where the tiles meet. */
const wrapped = (width: number, x: number, draw: (x: number) => void) => {
  draw(x);
  draw(x - width);
  draw(x + width);
};

/** A soft round light, for lamps going by. */
function glow(radius: number, scale: number, rgb: string, alpha: number) {
  return sprite(radius * 2, radius * 2, scale, (g) => {
    const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grad.addColorStop(0, `rgba(${rgb},${alpha})`);
    grad.addColorStop(0.25, `rgba(${rgb},${alpha * 0.35})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, radius * 2, radius * 2);
  });
}

function drawBack(ctx: CanvasRenderingContext2D, w: number, h: number, L: Layout) {
  const { s, win } = L;

  // The carriage wall: dark panelling, warmer low down near the lamp.
  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, "#080b16");
  wall.addColorStop(0.5, "#120f1a");
  wall.addColorStop(1, "#160f14");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);
  drawLower(ctx, w, h, L);
  const lampGlow = ctx.createRadialGradient(L.lamp.x, L.lamp.y - 70 * s, 0, L.lamp.x, L.lamp.y - 70 * s, Math.max(w, h) * 0.55);
  lampGlow.addColorStop(0, "rgba(255,170,90,0.32)");
  lampGlow.addColorStop(0.35, "rgba(255,150,80,0.1)");
  lampGlow.addColorStop(1, "rgba(255,150,80,0)");
  ctx.fillStyle = lampGlow;
  ctx.fillRect(0, 0, w, h);

  // The night through the glass.
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(win.x, win.y, win.w, win.h, win.r);
  ctx.clip();
  const sky = ctx.createLinearGradient(0, win.y, 0, L.horizon);
  sky.addColorStop(0, "#060a1c");
  sky.addColorStop(0.6, "#101c42");
  sky.addColorStop(1, "#24345e");
  ctx.fillStyle = sky;
  ctx.fillRect(win.x, win.y, win.w, win.h);

  const rand = seeded(31);
  for (let i = 0; i < Math.round((win.w * win.h) / 5000); i++) {
    const x = win.x + rand() * win.w;
    const y = lerp(win.y, L.horizon - win.h * 0.12, rand() ** 1.4);
    ctx.fillStyle = `rgba(225,232,255,${lerp(0.25, 0.8, rand()).toFixed(2)})`;
    ctx.fillRect(x, y, lerp(0.8, 1.7, rand()), lerp(0.8, 1.7, rand()));
  }

  // The moon, up to the right, and the haze it lights.
  const mx = win.x + win.w * (L.portrait ? 0.7 : 0.74);
  const my = win.y + win.h * 0.22;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, 150 * s + 40);
  halo.addColorStop(0, "rgba(205,218,255,0.32)");
  halo.addColorStop(0.3, "rgba(170,190,240,0.1)");
  halo.addColorStop(1, "rgba(170,190,240,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(win.x, win.y, win.w, win.h);
  ctx.fillStyle = "#edf1fc";
  ctx.beginPath();
  ctx.arc(mx, my, 15 * s + 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(160,172,205,0.35)";
  for (const [dx, dy, r] of [
    [-4, -3, 3.2],
    [5, 4, 2.4],
    [-2, 7, 1.8],
  ]) {
    ctx.beginPath();
    ctx.arc(mx + dx * (s + 0.3), my + dy * (s + 0.3), r * (s + 0.3), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

/**
 * The wall under the window: a rail, the heater along it, the skirting, a
 * strip of carpet, and a suitcase stood on the floor.
 */
function drawLower(ctx: CanvasRenderingContext2D, w: number, h: number, L: Layout) {
  const { s, win } = L;
  const rail = L.sill + 92 * s + 10;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(0, rail, w, 6 * s + 2);
  ctx.fillStyle = "rgba(255,205,160,0.07)";
  ctx.fillRect(0, rail, w, 1);

  // The carpet, and the skirting it meets.
  const floor = h - 70 * s - 10;
  const carpet = ctx.createLinearGradient(0, floor, 0, h);
  carpet.addColorStop(0, "#1c1020");
  carpet.addColorStop(1, "#120a14");
  ctx.fillStyle = carpet;
  ctx.fillRect(0, floor, w, h - floor);
  ctx.fillStyle = "rgba(150,90,120,0.08)";
  const step = 26 * s + 6;
  for (let y = floor + step / 2, row = 0; y < h; y += step / 2, row++) {
    for (let x = (row % 2) * (step / 2); x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, y - 3 * s - 1);
      ctx.lineTo(x + 4 * s + 1, y);
      ctx.lineTo(x, y + 3 * s + 1);
      ctx.lineTo(x - 4 * s - 1, y);
      ctx.fill();
    }
  }
  ctx.fillStyle = "#1b1113";
  ctx.fillRect(0, floor - 12 * s - 3, w, 12 * s + 3);
  ctx.fillStyle = "rgba(255,205,160,0.08)";
  ctx.fillRect(0, floor - 12 * s - 3, w, 1);

  // The heater: a long low cabinet, louvred.
  const hw = Math.min(win.w * 0.5, 560 * s + 60);
  const hx = win.x + win.w * 0.47 - hw / 2;
  const hy = rail + 34 * s + 4;
  const hh = Math.min(48 * s + 8, floor - 12 * s - hy - 10 * s);
  if (hh > 12) {
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.beginPath();
    ctx.roundRect(hx + 3, hy + 4, hw, hh, 6 * s + 2);
    ctx.fill();
    const body = ctx.createLinearGradient(0, hy, 0, hy + hh);
    body.addColorStop(0, "#2a2124");
    body.addColorStop(1, "#191315");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.roundRect(hx, hy, hw, hh, 6 * s + 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,210,170,0.12)";
    ctx.fillRect(hx + 6 * s, hy, hw - 12 * s, 1);
    const pad = 12 * s + 3;
    for (let y = hy + pad * 0.7; y < hy + hh - pad * 0.5; y += 6 * s + 2) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(hx + pad, y, hw - pad * 2, 2 * s + 1);
      ctx.fillStyle = "rgba(255,210,170,0.06)";
      ctx.fillRect(hx + pad, y + 2 * s + 1, hw - pad * 2, 1);
    }
  }

  // A suitcase stood on the floor, strapped, with a label.
  const cw = 118 * s + 14;
  const ch = 80 * s + 10;
  const cx = w * (L.portrait ? 0.56 : 0.5) - cw / 2;
  const cy = floor + 16 * s - ch;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(cx + cw / 2 + 6 * s, floor + 16 * s, cw * 0.56, 7 * s + 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#3a2516";
  ctx.lineWidth = 4 * s + 1;
  ctx.beginPath();
  ctx.moveTo(cx + cw * 0.38, cy);
  ctx.quadraticCurveTo(cx + cw / 2, cy - 18 * s, cx + cw * 0.62, cy);
  ctx.stroke();
  const leather = ctx.createLinearGradient(cx, cy, cx + cw, cy + ch);
  leather.addColorStop(0, "#6e4126");
  leather.addColorStop(1, "#432612");
  ctx.fillStyle = leather;
  ctx.beginPath();
  ctx.roundRect(cx, cy, cw, ch, 9 * s + 2);
  ctx.fill();
  ctx.fillStyle = "rgba(0,0,0,0.25)";
  ctx.fillRect(cx, cy + ch * 0.18, cw, 2 * s + 1);
  ctx.fillStyle = "#2c180c";
  for (const f of [0.22, 0.78]) ctx.fillRect(cx + cw * f - 5 * s, cy, 10 * s + 1, ch);
  ctx.fillStyle = "#c9a35e";
  for (const f of [0.22, 0.78]) ctx.fillRect(cx + cw * f - 4 * s, cy + ch * 0.12, 8 * s + 1, 6 * s + 1);
  ctx.fillStyle = "#e6d6b4";
  ctx.beginPath();
  ctx.ellipse(cx + cw * 0.5, cy + ch * 0.55, 13 * s + 2, 9 * s + 2, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b8452f";
  ctx.fillRect(cx + cw * 0.5 - 8 * s, cy + ch * 0.55 - 1.5 * s, 16 * s, 3 * s + 0.5);
  ctx.fillStyle = "rgba(255,205,160,0.12)";
  ctx.fillRect(cx + 9 * s, cy + 1, cw - 18 * s, 1);
}

/**
 * The seat at the left: a high padded back curving over at the top, fluted
 * in a patterned moquette, a lace cloth over the headrest, and the armrest
 * at its end with a coat thrown over it.
 */
function drawSeat(ctx: CanvasRenderingContext2D, w: number, h: number, L: Layout) {
  const { s, sill } = L;
  const u = s * 1.1 + 0.15;
  const x0 = -12;
  const x1 = L.portrait ? w * 0.24 : Math.min(w * 0.17, 280 * s + 20);
  const top = sill - (L.portrait ? 80 : 120) * s;
  const r = 26 * u;
  /** The back's top edge, falling away in a curve to its shoulder. */
  const topY = (x: number) => top + 46 * u * Math.max(0, (x - x0) / (x1 - x0)) ** 2.2;
  const shoulder = topY(x1 - r);
  const arm = sill + 24 * s;
  const end = 50 * u;

  const back = new Path2D();
  back.moveTo(x0, h + 10);
  for (let x = x0; x < x1 - r; x += 4) back.lineTo(x, topY(x));
  back.lineTo(x1 - r, shoulder);
  back.quadraticCurveTo(x1, shoulder, x1, shoulder + r);
  back.lineTo(x1, h + 10);
  back.closePath();

  // Its shadow on the wall, then the back itself.
  ctx.save();
  ctx.translate(8 * u, 6 * u);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.fill(back);
  ctx.restore();
  const velvet = ctx.createLinearGradient(x0, 0, x1, 0);
  velvet.addColorStop(0, "#1e0814");
  velvet.addColorStop(1, "#46162d");
  ctx.fillStyle = velvet;
  ctx.fill(back);

  ctx.save();
  ctx.clip(back);
  // Moquette: a small diamond woven all over.
  const tile = 12 * u;
  const weave = document.createElement("canvas");
  weave.width = weave.height = Math.max(4, Math.round(tile * 2));
  const g = weave.getContext("2d")!;
  g.scale(2, 2);
  g.fillStyle = "rgba(255,170,200,0.08)";
  g.beginPath();
  g.moveTo(tile / 2, 1);
  g.lineTo(tile - 1, tile / 2);
  g.lineTo(tile / 2, tile - 1);
  g.lineTo(1, tile / 2);
  g.fill();
  const pattern = ctx.createPattern(weave, "repeat");
  if (pattern) {
    pattern.setTransform(new DOMMatrix().scale(0.5));
    ctx.fillStyle = pattern;
    ctx.fillRect(x0, top, x1 - x0, h - top);
  }
  // Fluted channels, padded between their seams.
  const bolster = 24 * u;
  const flute = 36 * u;
  for (let x = x1 - bolster - flute; x > x0 - flute; x -= flute) {
    const pad = ctx.createLinearGradient(x, 0, x + flute, 0);
    pad.addColorStop(0, "rgba(0,0,0,0.38)");
    pad.addColorStop(0.18, "rgba(0,0,0,0)");
    pad.addColorStop(0.5, "rgba(255,190,215,0.06)");
    pad.addColorStop(0.82, "rgba(0,0,0,0)");
    pad.addColorStop(1, "rgba(0,0,0,0.38)");
    ctx.fillStyle = pad;
    ctx.fillRect(x, top, flute, h - top);
  }
  // A welt across, below the headrest, buttoned where the flutes meet it.
  const welt = (x: number) => topY(Math.min(x, x1 - r)) + 70 * u;
  ctx.strokeStyle = "rgba(0,0,0,0.45)";
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  for (let x = x0; x <= x1; x += 4) ctx.lineTo(x, welt(x));
  ctx.stroke();
  ctx.fillStyle = "#24091a";
  for (let x = x1 - bolster - flute; x > x0; x -= flute) {
    ctx.beginPath();
    ctx.arc(x, welt(x) + 1, 2.4 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  // The bolster down its end, rounder and catching the lamp.
  const side = ctx.createLinearGradient(x1 - bolster, 0, x1, 0);
  side.addColorStop(0, "rgba(0,0,0,0.3)");
  side.addColorStop(0.45, "rgba(255,170,190,0.1)");
  side.addColorStop(1, "rgba(255,180,130,0.2)");
  ctx.fillStyle = side;
  ctx.fillRect(x1 - bolster, top, bolster, h - top);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,190,140,0.3)";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1 - r * 0.6, shoulder + 2);
  ctx.quadraticCurveTo(x1 - 1, shoulder + 1, x1 - 1, shoulder + r);
  ctx.lineTo(x1 - 1, h);
  ctx.stroke();

  // The cloth over the headrest, following its curve, a lace edge below.
  const cl = x1 - r * 0.7;
  const drop = 50 * u;
  const scallop = 11 * u;
  const cloth = new Path2D();
  cloth.moveTo(x0, topY(x0) - 2 * u);
  for (let x = x0; x <= cl; x += 4) cloth.lineTo(x, topY(x) - 2 * u);
  cloth.lineTo(cl, topY(cl) + drop);
  for (let x = cl; x > x0; x -= scallop) {
    cloth.quadraticCurveTo(x - scallop / 2, topY(x - scallop / 2) + drop + 7 * u, x - scallop, topY(x - scallop) + drop);
  }
  cloth.closePath();
  ctx.save();
  ctx.translate(2 * u, 4 * u);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill(cloth);
  ctx.restore();
  const linen = ctx.createLinearGradient(0, top, 0, top + drop + 46 * u);
  linen.addColorStop(0, "#f1e8d6");
  linen.addColorStop(1, "#c9bba1");
  ctx.fillStyle = linen;
  ctx.fill(cloth);
  ctx.save();
  ctx.clip(cloth);
  // Where it bends over the top, and the lace holes along its edge.
  ctx.strokeStyle = "rgba(90,70,50,0.25)";
  ctx.lineWidth = 1.5 * u;
  ctx.beginPath();
  for (let x = x0; x <= cl; x += 4) ctx.lineTo(x, topY(x) + 8 * u);
  ctx.stroke();
  ctx.fillStyle = "rgba(90,70,50,0.28)";
  for (let x = cl - scallop / 2; x > x0; x -= scallop / 2) {
    ctx.beginPath();
    ctx.arc(x, topY(x) + drop - 6 * u, 1.3 * u, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // The seat's end: a panel under the armrest, and the armrest on it.
  const ex = x1 - 30 * u;
  ctx.fillStyle = "#2a0b19";
  ctx.beginPath();
  ctx.roundRect(ex, arm + 16 * u, end + 30 * u, h - arm, 8 * u);
  ctx.fill();
  ctx.fillStyle = "rgba(255,180,130,0.14)";
  ctx.fillRect(ex + end + 30 * u - 2, arm + 22 * u, 1.5, h - arm);
  const pad = ctx.createLinearGradient(0, arm, 0, arm + 26 * u);
  pad.addColorStop(0, "#64233f");
  pad.addColorStop(1, "#2e0d1e");
  ctx.fillStyle = pad;
  ctx.beginPath();
  ctx.roundRect(ex - 6 * u, arm, end + 42 * u, 26 * u, 13 * u);
  ctx.fill();
  ctx.fillStyle = "rgba(255,200,170,0.3)";
  ctx.fillRect(ex + 6 * u, arm + 2 * u, end + 18 * u, 1.5);

  // A camel coat thrown over it, hanging down the end.
  const cx = ex + end + 36 * u;
  const coat = new Path2D();
  coat.moveTo(ex + 30 * u, arm - 3 * u);
  coat.quadraticCurveTo(ex + 50 * u, arm - 8 * u, cx - 4 * u, arm - 2 * u);
  coat.quadraticCurveTo(cx + 6 * u, arm + 6 * u, cx + 4 * u, arm + 40 * u);
  coat.lineTo(cx + 8 * u, arm + 92 * u);
  coat.quadraticCurveTo(cx - 14 * u, arm + 100 * u, cx - 34 * u, arm + 94 * u);
  coat.lineTo(cx - 30 * u, arm + 30 * u);
  coat.quadraticCurveTo(ex + 32 * u, arm + 18 * u, ex + 30 * u, arm - 3 * u);
  const wool = ctx.createLinearGradient(ex, arm, cx + 8 * u, arm + 90 * u);
  wool.addColorStop(0, "#a07a50");
  wool.addColorStop(1, "#6a4a2c");
  ctx.fillStyle = wool;
  ctx.fill(coat);
  ctx.save();
  ctx.clip(coat);
  ctx.strokeStyle = "rgba(40,24,10,0.35)";
  ctx.lineWidth = 2 * u;
  ctx.beginPath();
  ctx.moveTo(cx - 12 * u, arm + 8 * u);
  ctx.quadraticCurveTo(cx - 8 * u, arm + 50 * u, cx - 16 * u, arm + 96 * u);
  ctx.moveTo(cx - 24 * u, arm + 24 * u);
  ctx.quadraticCurveTo(cx - 28 * u, arm + 60 * u, cx - 22 * u, arm + 96 * u);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,210,170,0.12)";
  ctx.fillRect(cx - 2 * u, arm + 4 * u, 2 * u, 90 * u);
  ctx.restore();
}

/** What's in the carriage, in front of the glass. */
function drawOver(ctx: CanvasRenderingContext2D, w: number, h: number, L: Layout) {
  const { s, win } = L;
  const f = win.frame;

  // The window's frame: dark wood, a pale bead where it meets the glass.
  ctx.lineWidth = f;
  ctx.strokeStyle = "#21171a";
  ctx.beginPath();
  ctx.roundRect(win.x, win.y, win.w, win.h, win.r);
  ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(255,214,170,0.22)";
  ctx.beginPath();
  ctx.roundRect(win.x + f / 2, win.y + f / 2, win.w - f, win.h - f, Math.max(2, win.r - f / 2));
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.55)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(win.x - f / 2, win.y - f / 2, win.w + f, win.h + f, win.r + f / 2);
  ctx.stroke();

  // The blind, rolled up at the top, its cord hanging.
  const bx = win.x + f / 2;
  const bw = win.w - f;
  const by = win.y + f / 2;
  const bh = 14 * s + 4;
  const blind = ctx.createLinearGradient(0, by, 0, by + bh);
  blind.addColorStop(0, "#6e5c48");
  blind.addColorStop(0.5, "#a8916f");
  blind.addColorStop(1, "#5e4c3a");
  ctx.fillStyle = blind;
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = "#8a6a3a";
  ctx.fillRect(bx, by + bh, bw, 2);
  ctx.strokeStyle = "#8a7558";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bx + bw / 2, by + bh);
  ctx.lineTo(bx + bw / 2, by + bh + 26 * s);
  ctx.stroke();
  ctx.fillStyle = "#b08a52";
  ctx.beginPath();
  ctx.ellipse(bx + bw / 2, by + bh + 28 * s, 2.5 * s + 1, 4 * s + 1, 0, 0, Math.PI * 2);
  ctx.fill();

  // The sill, and the little table it runs into.
  const sill = L.sill;
  ctx.fillStyle = "#3e281d";
  ctx.fillRect(win.x - f, sill - 2, win.w + f * 2, 12 * s + 4);
  ctx.fillStyle = "#6a4834";
  ctx.fillRect(win.x - f, sill - 2, win.w + f * 2, 1.5);
  const tl = L.cup.x - 120 * s;
  const tr = win.x + win.w + f;
  const back = sill + 10 * s + 2;
  const front = sill + 58 * s;
  const top = ctx.createLinearGradient(0, back, 0, front);
  top.addColorStop(0, "#3a2419");
  top.addColorStop(1, "#4e3122");
  ctx.fillStyle = top;
  ctx.beginPath();
  ctx.moveTo(tl, back);
  ctx.lineTo(tr, back);
  ctx.lineTo(tr + 24 * s, front);
  ctx.lineTo(tl - 34 * s, front);
  ctx.fill();
  ctx.fillStyle = "#22140d";
  ctx.fillRect(tl - 34 * s, front, tr - tl + 58 * s, 9 * s + 2);
  ctx.fillStyle = "rgba(255,200,150,0.18)";
  ctx.fillRect(tl - 34 * s, front, tr - tl + 58 * s, 1);

  // The cup on its saucer, and the lamp: drawn a little larger than life,
  // so they read as what they are on a small screen.
  const k = s * 1.3;
  const { x: cx, y: cy } = L.cup;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(cx + 4 * k, cy + 2 * k, 23 * k, 5 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ddd2c0";
  ctx.beginPath();
  ctx.ellipse(cx, cy, 21 * k, 5.5 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  // The handle first, its ends tucked under the body so it joins it.
  ctx.strokeStyle = "#e8dccb";
  ctx.lineWidth = 2.5 * k + 0.5;
  ctx.beginPath();
  ctx.moveTo(cx + 9 * k, cy - 18.5 * k);
  ctx.bezierCurveTo(cx + 20 * k, cy - 20 * k, cx + 19 * k, cy - 6 * k, cx + 7 * k, cy - 7 * k);
  ctx.stroke();
  const body = ctx.createLinearGradient(cx - 12 * k, 0, cx + 12 * k, 0);
  body.addColorStop(0, "#b9ab97");
  body.addColorStop(0.6, "#efe6d8");
  body.addColorStop(1, "#fff6e6");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(cx - 12 * k, cy - 22 * k);
  ctx.lineTo(cx + 12 * k, cy - 22 * k);
  ctx.quadraticCurveTo(cx + 11 * k, cy - 3 * k, cx + 7 * k, cy - 2 * k);
  ctx.lineTo(cx - 7 * k, cy - 2 * k);
  ctx.quadraticCurveTo(cx - 11 * k, cy - 3 * k, cx - 12 * k, cy - 22 * k);
  ctx.fill();
  ctx.fillStyle = "#5a3018";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 22 * k, 12 * k, 3.2 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#fbf3e6";
  ctx.lineWidth = 1;
  ctx.stroke();

  // The reading lamp: a brass stem, a silk shade lit from inside.
  const { x: lx, y: ly } = L.lamp;
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.beginPath();
  ctx.ellipse(lx - 6 * k, ly + 2 * k, 20 * k, 5 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a6a3a";
  ctx.beginPath();
  ctx.ellipse(lx, ly, 16 * k, 5 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c9a35e";
  ctx.beginPath();
  ctx.ellipse(lx, ly - 1.5 * k, 12 * k, 3 * k, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#a07c42";
  ctx.fillRect(lx - 2 * k, ly - 58 * k, 4 * k, 58 * k);
  const shade = ctx.createLinearGradient(0, ly - 98 * k, 0, ly - 58 * k);
  shade.addColorStop(0, "#f6c27a");
  shade.addColorStop(1, "#dc8c40");
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.moveTo(lx - 18 * k, ly - 98 * k);
  ctx.lineTo(lx + 18 * k, ly - 98 * k);
  ctx.lineTo(lx + 33 * k, ly - 58 * k);
  ctx.lineTo(lx - 33 * k, ly - 58 * k);
  ctx.fill();
  ctx.fillStyle = "#ffe9b8";
  ctx.beginPath();
  ctx.ellipse(lx, ly - 58 * k, 33 * k, 4 * k, 0, 0, Math.PI * 2);
  ctx.fill();

  drawSeat(ctx, w, h, L);

  // The lamp's light, on all of it near enough to catch it.
  ctx.globalCompositeOperation = "source-atop";
  const light = ctx.createRadialGradient(lx, ly - 60 * s, 0, lx, ly - 60 * s, 460 * s + 80);
  light.addColorStop(0, "rgba(255,180,100,0.45)");
  light.addColorStop(0.4, "rgba(255,160,90,0.12)");
  light.addColorStop(1, "rgba(255,160,90,0)");
  ctx.fillStyle = light;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = "source-over";
}

/** The country going by, layer by layer, each a tile that loops. */
function landscape(L: Layout, scale: number) {
  const { s, win, horizon } = L;
  const H = win.h;
  const rand = seeded(47);

  // Thin cloud drifting high up, lit by the moon.
  const cloudW = Math.ceil(Math.max(win.w, 700) * 1.6);
  const cloudTop = win.y + H * 0.04;
  const clouds = sprite(cloudW, H * 0.4, scale, (g) => {
    for (let i = 0; i < 7; i++) {
      const x = rand() * cloudW;
      const y = lerp(0.1, 0.7, rand()) * H * 0.4;
      const len = lerp(120, 260, rand()) * (s + 0.3);
      wrapped(cloudW, x, (x) => {
        for (let k = 0; k < 5; k++) {
          const px = x + (k - 2) * len * 0.22;
          const r = len * lerp(0.18, 0.3, rand());
          const puff = g.createRadialGradient(px, y, 0, px, y, r);
          puff.addColorStop(0, "rgba(150,168,215,0.18)");
          puff.addColorStop(1, "rgba(150,168,215,0)");
          g.fillStyle = puff;
          g.save();
          g.translate(px, y);
          g.scale(1, 0.32);
          g.translate(-px, -y);
          g.fillRect(px - r, y - r, r * 2, r * 2);
          g.restore();
        }
      });
    }
  });

  // Far hills, a town's lights scattered along them.
  const farW = Math.ceil(Math.max(win.w, 600) * 1.4);
  const farTop = horizon - H * 0.16;
  const farH = H * 0.32;
  const farLine = ridge(rand, farW, [
    [2, H * 0.03],
    [5, H * 0.014],
    [11, H * 0.006],
  ]);
  const farY = (x: number) => H * 0.12 + farLine(x);
  const far = sprite(farW, farH, scale, (g) => {
    const fill = g.createLinearGradient(0, H * 0.08, 0, farH);
    fill.addColorStop(0, "#1a2850");
    fill.addColorStop(1, "#0e1735");
    g.fillStyle = fill;
    fillRidge(g, farW, farH, farY);
    g.strokeStyle = "rgba(165,185,240,0.22)";
    g.lineWidth = 1;
    g.beginPath();
    for (let x = 0; x <= farW; x += 4) g.lineTo(x, farY(x) + 0.5);
    g.stroke();
    for (let c = 0; c < 3; c++) {
      const cx = rand() * farW;
      const spread = lerp(40, 90, rand()) * (s + 0.3);
      for (let i = 0; i < 22; i++) {
        const x = cx + (rand() + rand() + rand() - 1.5) * spread;
        const lx = ((x % farW) + farW) % farW;
        const y = lerp(farY(lx) + 3, farH * 0.75, rand() ** 0.7);
        g.fillStyle = rand() < 0.75 ? "rgba(255,212,140,0.85)" : "rgba(255,244,214,0.75)";
        const size = lerp(0.8, 1.7, rand()) * (s + 0.4);
        wrapped(farW, lx, (x) => g.fillRect(x, y, size, size));
      }
    }
  });

  // Fields and hedgerows, trees and a farmhouse or two.
  const midW = Math.ceil(Math.max(win.w, 600) * 1.3);
  // Starting well above the fields, so the tallest trees aren't cut off.
  const midTop = horizon - H * 0.22;
  const midH = win.y + H - midTop + 8;
  const midLine = ridge(rand, midW, [
    [3, H * 0.008],
    [7, H * 0.005],
  ]);
  const ground = (x: number) => H * 0.22 + midLine(x);
  const mid = sprite(midW, midH, scale, (g) => {
    const fill = g.createLinearGradient(0, H * 0.22, 0, midH);
    fill.addColorStop(0, "#0e1733");
    fill.addColorStop(1, "#060a19");
    g.fillStyle = fill;
    fillRidge(g, midW, midH, ground);
    // Furrows catching the moon.
    g.strokeStyle = "rgba(130,150,210,0.05)";
    for (let k = 1; k < 6; k++) {
      g.beginPath();
      for (let x = 0; x <= midW; x += 8) g.lineTo(x, ground(x) + k * k * H * 0.008 + 4);
      g.stroke();
    }
    g.fillStyle = "#080d20";
    for (let x = 0; x < midW; x += 6) {
      const r = lerp(3, 7, rand()) * (s + 0.4);
      wrapped(midW, x, (x) => {
        g.beginPath();
        g.arc(x, ground(x) + H * 0.05, r, 0, Math.PI * 2);
        g.fill();
      });
    }
    const trees = Math.round(midW / (110 * (s + 0.3)));
    for (let i = 0; i < trees; i++) {
      const x = rand() * midW;
      const base = ground(x) + rand() * H * 0.04;
      const th = lerp(24, 60, rand()) * (s + 0.3);
      wrapped(midW, x, (x) => {
        g.fillStyle = "#070b1c";
        g.fillRect(x - 1.5 * (s + 0.3), base - th * 0.5, 3 * (s + 0.3), th * 0.5);
        for (const [dx, dy, r] of [
          [0, -0.75, 0.32],
          [-0.18, -0.55, 0.26],
          [0.2, -0.58, 0.24],
        ]) {
          g.beginPath();
          g.arc(x + dx * th, base + dy * th, r * th, 0, Math.PI * 2);
          g.fill();
        }
        g.strokeStyle = "rgba(150,170,230,0.14)";
        g.lineWidth = 1;
        g.beginPath();
        g.arc(x, base - 0.75 * th, 0.32 * th, -1.4, -0.3);
        g.stroke();
      });
    }
    for (let i = 0; i < 2; i++) {
      const x = (i + rand() * 0.5) * (midW / 2);
      const base = ground(x) + H * 0.035;
      const u = s + 0.3;
      wrapped(midW, x, (x) => {
        g.fillStyle = "#0a0f22";
        g.fillRect(x, base - 20 * u, 38 * u, 20 * u);
        g.beginPath();
        g.moveTo(x - 4 * u, base - 20 * u);
        g.lineTo(x + 19 * u, base - 34 * u);
        g.lineTo(x + 42 * u, base - 20 * u);
        g.fill();
        g.fillStyle = "rgba(255,200,120,0.9)";
        g.fillRect(x + 8 * u, base - 14 * u, 5 * u, 5 * u);
        if (i === 0) g.fillRect(x + 25 * u, base - 14 * u, 5 * u, 5 * u);
      });
    }
  });

  // The embankment's bushes, rushing by just outside.
  const nearW = Math.ceil(Math.max(win.w, 600) * 1.2);
  const nearTop = win.y + H * 0.7;
  const nearH = H * 0.3 + 8;
  const nearLine = ridge(rand, nearW, [
    [3, H * 0.04],
    [9, H * 0.022],
    [23, H * 0.01],
  ]);
  const bank = (x: number) => H * 0.12 + nearLine(x);
  const near = sprite(nearW, nearH, scale, (g) => {
    g.fillStyle = "#03050d";
    fillRidge(g, nearW, nearH, bank);
    for (let x = 0; x < nearW; x += 10 * (s + 0.4)) {
      const r = lerp(6, 16, rand()) * (s + 0.4);
      wrapped(nearW, x, (x) => {
        g.beginPath();
        g.arc(x, bank(((x % nearW) + nearW) % nearW) + r * 0.5, r, 0, Math.PI * 2);
        g.fill();
      });
    }
  });

  return [
    { tile: clouds, top: cloudTop, speed: 4 * s, bob: 0 },
    { tile: far, top: farTop, speed: 14 * s, bob: 0.4 },
    { tile: mid, top: midTop, speed: 55 * s, bob: 0.8 },
    { tile: near, top: nearTop, speed: 260 * s, bob: 1 },
  ];
}

/** Drops on the glass, and the lamp's reflection in it: one image, drawn once. */
function glass(L: Layout, scale: number) {
  const { s, win } = L;
  return sprite(win.w, win.h, scale, (g) => {
    const rand = seeded(53);
    for (let i = 0; i < Math.round((win.w * win.h) / 2600); i++) {
      const x = rand() * win.w;
      const y = rand() * win.h;
      const r = (0.6 + rand() ** 2 * 2) * (s + 0.4);
      g.fillStyle = "rgba(200,215,250,0.16)";
      g.beginPath();
      g.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.32)";
      g.fillRect(x - r * 0.4, y - r * 0.5, Math.max(0.6, r * 0.35), Math.max(0.6, r * 0.35));
    }
    const rx = L.lamp.x - win.x - 40 * s;
    const ry = L.lamp.y - win.y - 120 * s;
    const ref = g.createRadialGradient(rx, ry, 0, rx, ry, 130 * s + 30);
    ref.addColorStop(0, "rgba(255,190,120,0.16)");
    ref.addColorStop(1, "rgba(255,190,120,0)");
    g.fillStyle = ref;
    g.fillRect(0, 0, win.w, win.h);
    const mist = g.createLinearGradient(0, win.h * 0.82, 0, win.h);
    mist.addColorStop(0, "rgba(180,192,225,0)");
    mist.addColorStop(1, "rgba(180,192,225,0.07)");
    g.fillStyle = mist;
    g.fillRect(0, win.h * 0.82, win.w, win.h * 0.18);
  });
}

/** Telegraph poles go by about this far apart, at this speed (× scale). */
const POLE_GAP = 1000;
const POLE_SPEED = 420;
/** Which way rain runs on the glass: blown back, and down. */
const RUN = { x: -0.82, y: 0.57 };

const TrainScene = () => {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const overRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    const over = overRef.current;
    if (!back || !front || !over) return;
    let stop = () => {};

    const setup = () => {
      stop();
      const dpr = cappedDpr(1.5);
      const b = fitCanvas(back, dpr);
      const L = layout(b.w, b.h);
      drawBack(b.ctx, b.w, b.h, L);
      const o = fitCanvas(over, dpr);
      drawOver(o.ctx, o.w, o.h, L);

      const { ctx, w, h } = fitCanvas(front, dpr);
      const { s, win } = L;
      const layers = landscape(L, dpr);
      const beads = glass(L, dpr);
      const lampGlow = glow(150 * s + 30, dpr, "255,214,150", 0.7);
      const redGlow = glow(90 * s + 20, dpr, "255,70,60", 0.75);
      const puff = glow(9 * s + 3, dpr, "255,246,234", 0.16);
      const gap = POLE_GAP * s;
      const speed = POLE_SPEED * s;
      const armY = win.y + win.h * 0.16;
      const right = win.x + win.w;
      const bottom = win.y + win.h;

      const runs = Array.from({ length: Math.min(140, Math.max(40, Math.round((win.w * win.h) / 6000))) }, () => ({
        x: win.x + Math.random() * win.w,
        y: win.y + Math.random() * win.h,
        len: lerp(10, 28, Math.random()) * (s + 0.4),
        speed: lerp(70, 150, Math.random()) * (s + 0.4),
      }));

      // A lamp at a crossing or a halt, sweeping by now and then.
      const passing = { x: -Infinity, kind: "lamp" as "lamp" | "crossing", wait: 4 };

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);
        // The carriage rocking on its springs, and a jolt at each rail joint.
        const joint = (t % 0.95) / 0.95;
        const rock = (Math.sin(t * 2.1) * 0.9 + Math.exp(-joint * 9) * 1.4) * (s + 0.3);

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(win.x, win.y, win.w, win.h, win.r);
        ctx.clip();

        for (const layer of layers) {
          const tw = layer.tile.width / dpr;
          const th = layer.tile.height / dpr;
          const off = (t * layer.speed) % tw;
          for (let x = win.x - off; x < right; x += tw) {
            ctx.drawImage(layer.tile, x, layer.top + rock * layer.bob, tw, th);
          }
        }

        // Telegraph poles, and the wires between them rising and dipping.
        const first = win.x - ((t * speed) % gap) - gap;
        ctx.fillStyle = "#04060e";
        ctx.strokeStyle = "rgba(4,6,14,0.9)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = first; x < right + gap; x += gap) {
          ctx.fillRect(x - 3 * s - 1, win.y - 4, 6 * s + 2, win.h + 8);
          ctx.fillRect(x - 28 * s, armY + rock, 56 * s, 4 * s + 1);
          for (const [dx, dy] of [
            [-24, 0],
            [24, 0],
            [-12, 22],
          ]) {
            const y = armY + rock + dy * s;
            ctx.moveTo(x + dx * s, y);
            ctx.quadraticCurveTo(x + gap / 2 + dx * s, y + 60 * s, x + gap + dx * s, y);
          }
        }
        ctx.stroke();

        if (passing.x > win.x - 300 * s) {
          passing.x -= speed * dt;
          const top = win.y + win.h * (passing.kind === "lamp" ? 0.36 : 0.56) + rock;
          ctx.fillRect(passing.x - 2.5 * s - 1, top, 5 * s + 2, bottom - top);
          const near = Math.max(0, 1 - Math.abs(passing.x - (win.x + win.w / 2)) / (win.w * 0.7));
          if (passing.kind === "lamp") {
            ctx.fillRect(passing.x - 10 * s, top - 6 * s, 20 * s, 7 * s);
            const r = lampGlow.width / dpr / 2;
            ctx.drawImage(lampGlow, passing.x - r, top - r, r * 2, r * 2);
            ctx.fillStyle = `rgba(255,205,140,${(near * 0.1).toFixed(3)})`;
          } else {
            ctx.strokeStyle = "rgba(200,200,210,0.55)";
            ctx.lineWidth = 3 * s + 1;
            ctx.beginPath();
            ctx.moveTo(passing.x - 18 * s, top - 18 * s);
            ctx.lineTo(passing.x + 18 * s, top + 4 * s);
            ctx.moveTo(passing.x + 18 * s, top - 18 * s);
            ctx.lineTo(passing.x - 18 * s, top + 4 * s);
            ctx.stroke();
            const on = Math.floor(t * 2.4) % 2 ? 1 : -1;
            const r = redGlow.width / dpr / 2;
            ctx.fillStyle = "#ff5a48";
            ctx.beginPath();
            ctx.arc(passing.x + on * 12 * s, top + 16 * s, 4 * s + 1, 0, Math.PI * 2);
            ctx.fill();
            ctx.drawImage(redGlow, passing.x + on * 12 * s - r, top + 16 * s - r, r * 2, r * 2);
            ctx.fillStyle = `rgba(255,80,70,${(near * 0.06).toFixed(3)})`;
          }
          ctx.fillRect(win.x, win.y, win.w, win.h);
        } else {
          passing.wait -= dt;
          if (passing.wait <= 0) {
            passing.x = right + 80 * s;
            passing.kind = Math.random() < 0.6 ? "lamp" : "crossing";
            passing.wait = lerp(9, 22, Math.random());
          }
        }

        // Rain on the glass, blown back across it by the train's speed.
        ctx.drawImage(beads, win.x, win.y, win.w, win.h);
        ctx.strokeStyle = "rgba(210,222,255,0.3)";
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (const d of runs) {
          d.x += RUN.x * d.speed * dt;
          d.y += RUN.y * d.speed * dt;
          if (d.x < win.x || d.y > bottom) {
            if (Math.random() < 0.5) {
              d.x = win.x + Math.random() * win.w;
              d.y = win.y - d.len;
            } else {
              d.x = right + d.len;
              d.y = win.y + Math.random() * win.h;
            }
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - RUN.x * d.len, d.y - RUN.y * d.len);
        }
        ctx.stroke();
        ctx.restore();

        // Steam off the cup: soft puffs rising, swelling and fading.
        const { x: cx, y: cy } = L.cup;
        const pr = puff.width / dpr / 2;
        for (let k = 0; k < 2; k++) {
          for (let i = 0; i < 7; i++) {
            const p = (t * 0.32 + i / 7 + k * 0.5) % 1;
            const x = cx + (k ? 4 : -4) * s + Math.sin(t * 1.1 + p * 5 + k * 2) * 7 * s * p;
            const y = cy - 30 * s - p * 70 * s;
            const r = pr * (0.5 + p);
            ctx.globalAlpha = Math.sin(p * Math.PI) * 0.8;
            ctx.drawImage(puff, x - r, y - r, r * 2, r * 2);
          }
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
      <canvas ref={overRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_45%,rgb(3_5_12/0.6)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default TrainScene;
