"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * A desk by a bedroom window at sunrise. Two canvases:
 *
 *  back  — the room: the wall, the window with the sky going from lilac to
 *          gold over the rooftops and the blinds half up, the stripes of
 *          light they throw, and the desk with its books, plant, mug, an
 *          open notebook, a little clock and a desk lamp. Drawn once.
 *  front — the cat asleep on the sill, shafts of sunlight through the open
 *          window, the lamp's light, the clock's hands, steam off the
 *          mug, dust in the light, and clouds and now and then a few birds
 *          going by outside.
 */

interface Layout {
  win: { x: number; y: number; w: number; h: number };
  /** Where the blinds stop, and where the rooftops start. */
  blind: number;
  roofs: number;
  sill: number;
  desk: number;
  s: number;
  sun: { x: number; y: number; r: number };
  notebook: { x: number; y: number };
  clock: { x: number; y: number };
  lamp: { x: number; y: number };
  mug: { x: number; y: number };
  books: { x: number; y: number };
  cat: { x: number; y: number };
  plant: { x: number; y: number };
  portrait: boolean;
}

function layout(w: number, h: number): Layout {
  const portrait = w < h;
  // Right of centre, so the greeting in the top left stays on the dark wall.
  // On a phone the greeting covers the top, so the window starts below it.
  const ww = portrait ? w * 0.8 : Math.min(w * 0.46, h * 1.15);
  const wx = portrait ? w * 0.1 : w * 0.6 - ww / 2;
  const win = portrait ? { x: wx, y: h * 0.22, w: ww, h: h * 0.34 } : { x: wx, y: h * 0.1, w: ww, h: h * 0.5 };
  // Things on the desk sized to the room: on a phone, to its width.
  const s = portrait ? w / 520 : Math.min(w, h) / 800;
  const sill = win.y + win.h;
  const desk = h * (portrait ? 0.72 : 0.76);
  const roofs = win.y + win.h * 0.8;
  return {
    win,
    blind: win.y + win.h * 0.4,
    roofs,
    sill,
    desk,
    s,
    sun: { x: win.x + win.w * 0.64, y: roofs - win.h * 0.09, r: Math.max(10, win.h * 0.07) },
    notebook: { x: w * (portrait ? 0.36 : 0.3), y: desk },
    clock: { x: w * (portrait ? 0.36 : 0.3) - 115 * s, y: desk },
    lamp: { x: w * (portrait ? 0.36 : 0.3) + 112 * s, y: desk },
    mug: { x: w * (portrait ? 0.74 : 0.62), y: desk },
    books: { x: w * (portrait ? 0.9 : 0.8), y: desk },
    cat: { x: win.x + win.w * (portrait ? 0.3 : 0.24), y: sill },
    plant: { x: win.x + win.w * 0.86, y: sill },
    portrait,
  };
}

function drawSky(ctx: CanvasRenderingContext2D, l: Layout, rand: () => number) {
  const { x, y, w, h } = l.win;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();

  const sky = ctx.createLinearGradient(0, y, 0, l.roofs);
  sky.addColorStop(0, "#5a4a88");
  sky.addColorStop(0.3, "#9a7cb2");
  sky.addColorStop(0.6, "#f0a48e");
  sky.addColorStop(0.85, "#ffc98a");
  sky.addColorStop(1, "#ffe2a6");
  ctx.fillStyle = sky;
  ctx.fillRect(x, y, w, h);

  // The sun just clear of the rooftops, and its light spread through the haze.
  const { sun } = l;
  const glow = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, w * 0.6);
  glow.addColorStop(0, "rgba(255,240,200,0.75)");
  glow.addColorStop(0.15, "rgba(255,210,150,0.35)");
  glow.addColorStop(1, "rgba(255,190,140,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#fff4d6";
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
  ctx.fill();

  // Long thin clouds lit pink from below.
  for (let i = 0; i < 5; i++) {
    const cy = lerp(y + h * 0.1, l.roofs - h * 0.2, rand());
    const cx = x + rand() * w;
    const cw = lerp(0.2, 0.45, rand()) * w;
    const ch = lerp(3, 7, rand()) * l.s;
    ctx.fillStyle = `rgba(255,${Math.round(lerp(170, 205, rand()))},${Math.round(lerp(160, 185, rand()))},0.45)`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, cw / 2, ch, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rooftops, in front of the sun: a far row pale with the haze, then the
  // near one, dark against the light, with chimneys, aerials, and a lit
  // window or two. Both solid, so nothing shows through.
  const rows: [base: number, tall: number, color: string, near: boolean][] = [
    [l.roofs + h * 0.02, h * 0.1, "#b98a9e", false],
    [l.roofs + h * 0.06, h * 0.14, "#3a2a44", true],
  ];
  for (const [base, tall, color, near] of rows) {
    for (let bx = x - 20; bx < x + w + 20; ) {
      const bw = lerp(0.08, 0.16, rand()) * w;
      const top = base - lerp(0.35, 1, rand()) * tall;
      ctx.fillStyle = color;
      // A pitched roof on some, flat on the rest.
      ctx.beginPath();
      if (rand() < 0.5) {
        const peak = top - bw * 0.22;
        ctx.moveTo(bx, top);
        ctx.lineTo(bx + bw / 2, peak);
        ctx.lineTo(bx + bw, top);
      } else {
        ctx.moveTo(bx, top);
        ctx.lineTo(bx + bw, top);
      }
      ctx.lineTo(bx + bw, y + h);
      ctx.lineTo(bx, y + h);
      ctx.fill();
      if (rand() < 0.5) {
        const cw = bw * 0.1;
        ctx.fillRect(bx + bw * lerp(0.15, 0.75, rand()), top - bw * 0.2, cw, bw * 0.25);
      }
      if (near) {
        if (rand() < 0.35) {
          ctx.fillStyle = "#2a1f33";
          const ax = bx + bw * lerp(0.2, 0.8, rand());
          ctx.fillRect(ax, top - 22 * l.s, 1.2, 22 * l.s);
          ctx.fillRect(ax - 6 * l.s, top - 16 * l.s, 12 * l.s, 1.2);
        }
        for (let n = 0; n < 2; n++) {
          if (rand() < 0.5) continue;
          ctx.fillStyle = "rgba(255,200,130,0.7)";
          ctx.fillRect(bx + bw * lerp(0.15, 0.75, rand()), lerp(top + 8 * l.s, base, rand()), 5 * l.s, 6 * l.s);
        }
      }
      bx += bw + lerp(0, 4, rand());
    }
  }
  ctx.restore();
}

/**
 * The shadow where something stands: a soft flat ellipse tight under its
 * base, darkest at the contact and fading out, sized to its footprint and
 * nudged down and to the left, away from the window. One darkness for
 * everything, so they all sit in the same light.
 */
function contactShadow(ctx: CanvasRenderingContext2D, x: number, y: number, half: number, s: number) {
  const rx = half * 1.08;
  const ry = Math.max(2, Math.min(rx * 0.16, 6 * s));
  const cx = x - Math.min(rx * 0.08, 5 * s);
  const cy = y + ry * 0.45;
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, "rgba(16,8,20,0.72)");
  g.addColorStop(0.55, "rgba(16,8,20,0.4)");
  g.addColorStop(1, "rgba(16,8,20,0)");
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, ry / rx);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Where the window's bars are: the blinds' bottom rail, the sash's middle
 *  bar and upright, and the pull cord. */
function sash(l: Layout) {
  const { win, s } = l;
  const slat = 7 * s + 3;
  const frame = Math.max(8, win.w * 0.02);
  return {
    slat,
    frame,
    rail: { top: l.blind - slat * 0.6, bottom: l.blind + slat * 0.6 },
    bar: win.y + win.h * 0.58,
    barH: Math.max(4, frame * 0.5),
    mullion: { x: win.x + win.w / 2 - frame * 0.25, w: frame * 0.5 },
    cord: win.x + win.w * 0.95,
  };
}

/** The panes of open glass below the blinds, as rectangles: everything
 *  outside is seen only through these, never over the bars. */
function panes(l: Layout) {
  const { win } = l;
  const { rail, bar, barH, mullion } = sash(l);
  const left = { x: win.x, w: mullion.x - win.x };
  const right = { x: mullion.x + mullion.w, w: win.x + win.w - mullion.x - mullion.w };
  const rows = [
    { y: rail.bottom, h: bar - rail.bottom },
    { y: bar + barH, h: win.y + win.h - bar - barH },
  ];
  return rows.flatMap((r) => [left, right].map((c) => ({ x: c.x, y: r.y, w: c.w, h: r.h })));
}

function drawBack(ctx: CanvasRenderingContext2D, w: number, h: number, l: Layout) {
  const rand = seeded(31);
  const { s, win } = l;

  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, "#1f1828");
  wall.addColorStop(0.55, "#33263f");
  wall.addColorStop(1, "#2c2338");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);

  // The room lit warm around the window.
  const warm = ctx.createRadialGradient(l.sun.x, win.y + win.h * 0.7, 0, l.sun.x, win.y + win.h * 0.7, Math.max(w, h) * 0.6);
  warm.addColorStop(0, "rgba(255,180,140,0.22)");
  warm.addColorStop(0.5, "rgba(255,160,140,0.07)");
  warm.addColorStop(1, "rgba(255,160,140,0)");
  ctx.fillStyle = warm;
  ctx.fillRect(0, 0, w, h);

  drawSky(ctx, l, rand);

  // The blinds, pulled half up: slats tilted open, a strip of sky between
  // each, their lower edges catching the light.
  const { slat, frame, bar, barH, mullion, cord } = sash(l);
  const gap = Math.max(2, 3.2 * s);
  const slats: number[] = [];
  for (let y = win.y; y < l.blind - slat; y += slat + gap) {
    slats.push(y);
    ctx.fillStyle = "#cdb3b0";
    ctx.fillRect(win.x, y, win.w, slat);
    ctx.fillStyle = "#f6d6b8";
    ctx.fillRect(win.x, y + slat - 1.5, win.w, 1.5);
  }
  ctx.fillStyle = "#e6c8b4";
  ctx.fillRect(win.x - 2, l.blind - slat * 0.6, win.w + 4, slat * 1.2);
  // The ladder strings, and the pull cord hanging down one side.
  ctx.strokeStyle = "rgba(90,70,90,0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (const u of [0.18, 0.5, 0.82]) {
    ctx.moveTo(win.x + win.w * u, win.y);
    ctx.lineTo(win.x + win.w * u, l.blind);
  }
  const tassel = bar - 12 * s - 6;
  ctx.moveTo(cord, l.blind);
  ctx.lineTo(cord, tassel);
  ctx.stroke();
  ctx.fillStyle = "#e6c8b4";
  ctx.fillRect(cord - 2 * s, tassel, 4 * s, 9 * s);

  // The frame, painted, in the shadow of the room, over the ends of the
  // cords; a lit inner edge.
  ctx.strokeStyle = "#4a3852";
  ctx.lineWidth = frame;
  ctx.strokeRect(win.x - frame / 2, win.y - frame / 2, win.w + frame, win.h + frame);
  ctx.strokeStyle = "rgba(255,200,170,0.35)";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(win.x, win.y, win.w, win.h);
  // The sash's middle bar, below the blinds.
  ctx.fillStyle = "#4a3852";
  ctx.fillRect(win.x, bar, win.w, barH);
  ctx.fillRect(mullion.x, l.blind, mullion.w, win.h * 0.6);

  // Sill: lit along the top, deep enough for a cat.
  const sillH = Math.max(10, 16 * s);
  ctx.fillStyle = "#6a4f62";
  ctx.fillRect(win.x - frame * 2, l.sill, win.w + frame * 4, sillH);
  ctx.fillStyle = "#e8b39a";
  ctx.fillRect(win.x - frame * 2, l.sill, win.w + frame * 4, 2.5);

  drawPoster(ctx, l, w, h);

  // Stripes of light through the slats, falling down and to the left over
  // the wall, fainter the further they reach.
  const slope = 0.55;
  const reach = Math.min(win.x + win.w * 0.2, win.w * 1.1);
  for (const y of slats) {
    const y0 = y + slat;
    const band = (slat + gap) * 0.55;
    const g = ctx.createLinearGradient(win.x, 0, win.x - reach, 0);
    g.addColorStop(0, "rgba(255,200,150,0.11)");
    g.addColorStop(1, "rgba(255,200,150,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(win.x - frame, y0);
    ctx.lineTo(win.x - frame - reach, y0 + reach * slope);
    ctx.lineTo(win.x - frame - reach, y0 + reach * slope + band);
    ctx.lineTo(win.x - frame, y0 + band);
    ctx.fill();
  }

  // Desk: a warm top edge, its front falling away into shadow.
  const top = ctx.createLinearGradient(0, l.desk, 0, h);
  top.addColorStop(0, "#7a5048");
  top.addColorStop(0.06, "#5a3a3c");
  top.addColorStop(1, "#24192a");
  ctx.fillStyle = top;
  ctx.fillRect(0, l.desk, w, h - l.desk);
  ctx.fillStyle = "rgba(255,200,160,0.4)";
  ctx.fillRect(0, l.desk, w, 2);
  // The window's light lying across the desk top.
  const patch = ctx.createLinearGradient(0, l.desk, 0, l.desk + h * 0.05);
  patch.addColorStop(0, "rgba(255,200,150,0.22)");
  patch.addColorStop(1, "rgba(255,200,150,0)");
  ctx.fillStyle = patch;
  ctx.beginPath();
  ctx.moveTo(win.x + win.w * 0.1, l.desk);
  ctx.lineTo(win.x + win.w * 0.95, l.desk);
  ctx.lineTo(win.x + win.w * 0.7, l.desk + h * 0.05);
  ctx.lineTo(win.x - win.w * 0.2, l.desk + h * 0.05);
  ctx.fill();

  // The cat itself is live; its shadow, under the curl, is not.
  const catK = l.s * 1.1;
  contactShadow(ctx, l.cat.x - 8 * catK, l.sill, 40 * catK, l.s);
  drawPlant(ctx, l, rand);
  drawBooks(ctx, l);
  drawMug(ctx, l);
  drawNotebook(ctx, l);
  drawClock(ctx, l);
  drawLamp(ctx, l);
}

/** A print on the wall left of the window, when there's room for one: a
 *  sun over hills, in the room's own colours. */
function drawPoster(ctx: CanvasRenderingContext2D, l: Layout, w: number, h: number) {
  const { win } = l;
  if (l.portrait || win.x < 260) return;
  const pw = Math.min(150 * l.s, win.x * 0.36);
  const ph = pw * 1.3;
  const px = win.x * 0.42 - pw / 2;
  const py = Math.max(h * 0.28, 150);
  if (py + ph > l.desk - 60 * l.s || px < w * 0.03) return;
  ctx.fillStyle = "#1c1424";
  ctx.fillRect(px - 6, py - 6, pw + 12, ph + 12);
  ctx.fillStyle = "#efe0d2";
  ctx.fillRect(px, py, pw, ph);
  const m = pw * 0.1;
  const art = { x: px + m, y: py + m, w: pw - m * 2, h: ph - m * 2.6 };
  const sky = ctx.createLinearGradient(0, art.y, 0, art.y + art.h);
  sky.addColorStop(0, "#b49ac8");
  sky.addColorStop(1, "#f2b49a");
  ctx.fillStyle = sky;
  ctx.fillRect(art.x, art.y, art.w, art.h);
  ctx.fillStyle = "#ffe2a6";
  ctx.beginPath();
  ctx.arc(art.x + art.w * 0.6, art.y + art.h * 0.55, art.w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7a5a8a";
  ctx.beginPath();
  ctx.moveTo(art.x, art.y + art.h);
  ctx.lineTo(art.x, art.y + art.h * 0.7);
  ctx.quadraticCurveTo(art.x + art.w * 0.35, art.y + art.h * 0.5, art.x + art.w * 0.6, art.y + art.h * 0.72);
  ctx.quadraticCurveTo(art.x + art.w * 0.85, art.y + art.h * 0.62, art.x + art.w, art.y + art.h * 0.68);
  ctx.lineTo(art.x + art.w, art.y + art.h);
  ctx.fill();
  ctx.fillStyle = "#4a3852";
  ctx.fillRect(art.x + art.w * 0.25, art.y + art.h + m * 0.6, art.w * 0.5, Math.max(1.5, m * 0.18));
}

/** A point and the way a cubic curve is heading, `u` of the way along it. */
function onCurve(c: number[], u: number) {
  const [x0, y0, x1, y1, x2, y2, x3, y3] = c;
  const v = 1 - u;
  const x = v ** 3 * x0 + 3 * v * v * u * x1 + 3 * v * u * u * x2 + u ** 3 * x3;
  const y = v ** 3 * y0 + 3 * v * v * u * y1 + 3 * v * u * u * y2 + u ** 3 * y3;
  const dx = 3 * v * v * (x1 - x0) + 6 * v * u * (x2 - x1) + 3 * u * u * (x3 - x2);
  const dy = 3 * v * v * (y1 - y0) + 6 * v * u * (y2 - y1) + 3 * u * u * (y3 - y2);
  return { x, y, angle: Math.atan2(dy, dx) };
}

/**
 * A little trailing plant in a pot on the sill: a clump of leaves standing
 * up out of it, and a few stems of different lengths rising out of the
 * clump, arching over the rim and falling away to either side, so the pot
 * still shows. One trails off along the sill; one drops a little way over
 * its front edge.
 */
function drawPlant(ctx: CanvasRenderingContext2D, l: Layout, rand: () => number) {
  const { x, y } = l.plant;
  const s = l.s * 1.4;
  const rim = y - 22 * s;
  contactShadow(ctx, x, y, 9 * s, l.s);
  const leaf = (lx: number, ly: number, size: number, angle: number, color: string) => {
    ctx.fillStyle = color;
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(angle);
    // A heart-ish leaf, its point out along `angle`.
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(size * 0.3, -size * 0.7, size * 1.1, -size * 0.5, size * 1.5, 0);
    ctx.bezierCurveTo(size * 1.1, size * 0.5, size * 0.3, size * 0.7, 0, 0);
    ctx.fill();
    ctx.restore();
  };
  // The clump, behind the rim.
  for (let i = 0; i < 9; i++) {
    const a = lerp(-Math.PI * 0.95, -Math.PI * 0.05, i / 8) + lerp(-0.2, 0.2, rand());
    leaf(x + lerp(-4, 4, rand()) * s, rim + 1 * s, lerp(5, 7.5, rand()) * s, a, i % 2 ? "#6fae70" : "#559a5c");
  }
  ctx.fillStyle = "#e9a88a";
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, rim);
  ctx.lineTo(x + 12 * s, rim);
  ctx.lineTo(x + 9 * s, y);
  ctx.lineTo(x - 9 * s, y);
  ctx.fill();
  ctx.fillStyle = "rgba(90,40,40,0.25)";
  ctx.fillRect(x + 3 * s, rim, 6 * s, 22 * s);
  ctx.fillStyle = "#c98a72";
  ctx.fillRect(x - 13 * s, rim - 2 * s, 26 * s, 5 * s);

  // The trailing stems, each a curve or two, in the plant's own units from
  // the middle of the rim: out of the clump, over the rim and away.
  const sill = 22;
  const sillH = Math.max(10, 16 * l.s) / s;
  const stems: number[][][] = [
    // Long: over the left of the rim, down to the sill and off along it.
    [
      [-3, -5, -16, -14, -22, -6, -23, 6],
      [-23, 6, -24, 14, -26, sill - 1, -34, sill - 0.5],
      [-34, sill - 0.5, -42, sill, -52, sill - 1, -62, sill - 0.5],
    ],
    // Medium: over the right, falling past the pot, over the sill's edge.
    [
      [4, -6, 16, -15, 22, -6, 23, 5],
      [23, 5, 24, 13, 25, sill - 2, 26, sill],
      [26, sill, 27, sill + 2, 27, sill + sillH * 0.4, 26.5, sill + sillH * 0.75],
    ],
    // Short: just over the right of the rim, hanging in the air.
    [[6, -4, 14, -10, 19, -2, 18.5, 9]],
    // Shortest: tipping over the left of the rim.
    [[-5, -4, -11, -9, -15, -2, -15.5, 4]],
  ];
  ctx.strokeStyle = "#3f6a4a";
  ctx.lineWidth = 1.1 * s;
  ctx.lineCap = "round";
  for (const stem of stems) {
    const curves = stem.map((c) => c.map((v, i) => (i % 2 ? rim + v * s : x + v * s)));
    ctx.beginPath();
    ctx.moveTo(curves[0][0], curves[0][1]);
    for (const c of curves) ctx.bezierCurveTo(c[2], c[3], c[4], c[5], c[6], c[7]);
    ctx.stroke();
    // Leaves alternating along it, smaller towards the tip.
    const count = stem.length * 4 + 1;
    for (let i = 1; i <= count; i++) {
      const along = (i / count) * curves.length - 0.001;
      const at = onCurve(curves[Math.floor(along)], along % 1);
      const side = i % 2 ? 1 : -1;
      const size = lerp(5.5, 2.4, i / count) * lerp(0.8, 1.15, rand()) * s;
      leaf(at.x, at.y, size, at.angle + side * lerp(0.6, 1.1, rand()), rand() < 0.5 ? "#5f9a64" : "#477a50");
    }
  }
}

/** Books stacked flat, the biggest at the bottom, each a little off true. */
function drawBooks(ctx: CanvasRenderingContext2D, l: Layout) {
  const { x, y } = l.books;
  const s = l.s;
  contactShadow(ctx, x, y, 64 * s, s);
  let top = y;
  const books: [width: number, height: number, offset: number, color: string][] = [
    [128, 17, 0, "#7a4a6a"],
    [116, 14, -5, "#d99a6c"],
    [104, 15, 4, "#4f5f8a"],
    [90, 12, -2, "#b8687a"],
  ];
  for (const [bw0, bh0, off, color] of books) {
    const bw = bw0 * s;
    const bh = bh0 * s;
    const bx = x - bw / 2 + off * s;
    top -= bh;
    ctx.fillStyle = color;
    ctx.fillRect(bx, top, bw, bh);
    // Pages showing along the open edge, bands on the spine at the other,
    // a lit top and a shadow under each.
    ctx.fillStyle = "#f2e2cc";
    ctx.fillRect(bx + bw - 5 * s, top + 2 * s, 4 * s, bh - 4 * s);
    ctx.fillStyle = "rgba(255,230,190,0.35)";
    ctx.fillRect(bx + 8 * s, top + 2 * s, 2 * s, bh - 4 * s);
    ctx.fillRect(bx + 14 * s, top + 2 * s, 2 * s, bh - 4 * s);
    ctx.fillStyle = "rgba(255,220,190,0.3)";
    ctx.fillRect(bx, top, bw, 1.5);
    ctx.fillStyle = "rgba(20,10,20,0.25)";
    ctx.fillRect(bx, top + bh - 1.5, bw, 1.5);
  }
  // A ribbon marker hanging out of the top one.
  ctx.fillStyle = "#e8c48a";
  ctx.fillRect(x + 20 * s, top + 4 * s, 3 * s, 16 * s);
}

function drawMug(ctx: CanvasRenderingContext2D, l: Layout) {
  const { x, y } = l.mug;
  const s = l.s;
  contactShadow(ctx, x, y, 24 * s, s);
  ctx.strokeStyle = "#e9b9a0";
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  ctx.ellipse(x + 22 * s, y - 24 * s, 10 * s, 11 * s, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  const body = ctx.createLinearGradient(x - 22 * s, 0, x + 22 * s, 0);
  body.addColorStop(0, "#d99a86");
  body.addColorStop(0.6, "#f2c3a8");
  body.addColorStop(1, "#ffdcc2");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.roundRect(x - 22 * s, y - 46 * s, 44 * s, 46 * s, [0, 0, 6 * s, 6 * s]);
  ctx.fill();
  // A lilac band round it.
  ctx.fillStyle = "#9a7cb2";
  ctx.fillRect(x - 22 * s, y - 30 * s, 44 * s, 6 * s);
  ctx.fillStyle = "#f8e2d2";
  ctx.beginPath();
  ctx.ellipse(x, y - 46 * s, 22 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5a3424";
  ctx.beginPath();
  ctx.ellipse(x, y - 46 * s, 19 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** An open notebook lying on the desk, seen from a little above: ruled
 *  pages, a few lines written, a pen across the right-hand page. */
function drawNotebook(ctx: CanvasRenderingContext2D, l: Layout) {
  const { x, y } = l.notebook;
  const s = l.s;
  const near = y - 3 * s;
  const far = y - 30 * s;
  /** A point on the open pages: u across (-1 to 1), v back from the near edge (0 to 1). */
  const at = (u: number, v: number) => [x + u * lerp(78, 66, v) * s, lerp(near, far, v)] as const;
  const quad = (pts: (readonly [number, number])[]) => {
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
  };
  contactShadow(ctx, x, y, 82 * s, s);
  // The cover, a little bigger than the pages.
  ctx.fillStyle = "#4a3458";
  quad([
    [x - 82 * s, y],
    [x + 82 * s, y],
    [x + 69 * s, far - 2 * s],
    [x - 69 * s, far - 2 * s],
  ]);
  ctx.fillStyle = "#f2e6d6";
  quad([at(-1, 0), at(0, 0), at(0, 1), at(-1, 1)]);
  ctx.fillStyle = "#fbf1e4";
  quad([at(0, 0), at(1, 0), at(1, 1), at(0, 1)]);
  // Shadow into the gutter.
  ctx.fillStyle = "rgba(120,80,90,0.18)";
  quad([at(-0.12, 0), at(0, 0), at(0, 1), at(-0.12, 1)]);
  ctx.strokeStyle = "rgba(130,110,170,0.35)";
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let j = 1; j < 7; j++) {
    const v = j / 7;
    for (const [a, b] of [
      [-0.94, -0.06],
      [0.06, 0.94],
    ]) {
      const [x0, y0] = at(a, v);
      const [x1] = at(b, v);
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y0);
    }
  }
  ctx.stroke();
  // A few lines of handwriting on the left page.
  ctx.strokeStyle = "rgba(74,56,82,0.6)";
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  for (let j = 2; j < 7; j++) {
    const v = j / 7 - 0.03;
    const [x0, y0] = at(-0.88, v);
    const [x1] = at(j === 2 ? -0.45 : -0.12, v);
    ctx.moveTo(x0, y0);
    for (let px = x0; px < x1; px += 2) ctx.lineTo(px, y0 - Math.abs(Math.sin(px * 0.9)) * 2.2 * s);
  }
  ctx.stroke();
  // The pen, lying across the right-hand page.
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3a2c3e";
  ctx.lineWidth = 3.4 * s;
  ctx.beginPath();
  ctx.moveTo(x + 18 * s, y - 8 * s);
  ctx.lineTo(x + 62 * s, y - 25 * s);
  ctx.stroke();
  ctx.strokeStyle = "#e8c48a";
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(x + 50 * s, y - 22 * s);
  ctx.lineTo(x + 60 * s, y - 26 * s);
  ctx.stroke();
}

/** The alarm clock's case and face; its hands are live. */
function drawClock(ctx: CanvasRenderingContext2D, l: Layout) {
  const { x, y } = l.clock;
  const s = l.s;
  const cy = y - 28 * s;
  contactShadow(ctx, x, y, 19 * s, s);
  // Feet, and the bells with the hammer's post between them.
  ctx.strokeStyle = "#b8935a";
  ctx.lineWidth = 3 * s;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x - 12 * s, cy + 17 * s);
  ctx.lineTo(x - 17 * s, y);
  ctx.moveTo(x + 12 * s, cy + 17 * s);
  ctx.lineTo(x + 17 * s, y);
  ctx.moveTo(x, cy - 22 * s);
  ctx.lineTo(x, cy - 28 * s);
  ctx.stroke();
  ctx.fillStyle = "#e8c48a";
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * 14 * s, cy - 18 * s, 8 * s, Math.PI, 0);
    ctx.fill();
  }
  ctx.fillStyle = "#9a7cb2";
  ctx.beginPath();
  ctx.arc(x, cy, 22 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,210,170,0.45)";
  ctx.beginPath();
  ctx.arc(x, cy, 22 * s, -Math.PI * 0.95, -Math.PI * 0.35);
  ctx.arc(x, cy, 19 * s, -Math.PI * 0.35, -Math.PI * 0.95, true);
  ctx.fill();
  ctx.fillStyle = "#f6ead8";
  ctx.beginPath();
  ctx.arc(x, cy, 17 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a3852";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r = i % 3 ? 1 : 1.6;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * 14 * s, cy + Math.sin(a) * 14 * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The desk lamp: a weighted base, two arms jointed at the elbow, and a
 *  shade bent down over the notebook. Its light is live. */
function lampShape(l: Layout) {
  const { x, y } = l.lamp;
  const s = l.s;
  const elbow = { x: x - 4 * s, y: y - 72 * s };
  const head = { x: x - 50 * s, y: y - 84 * s };
  // The shade hangs from the head, tipped a little towards the notebook.
  const tilt = 0.32;
  const along = { x: -Math.sin(tilt), y: Math.cos(tilt) };
  const across = { x: Math.cos(tilt), y: Math.sin(tilt) };
  const depth = 26 * s;
  const mouth = { x: head.x + along.x * depth, y: head.y + along.y * depth };
  return { x, y, s, elbow, head, along, across, depth, mouth };
}

function drawLamp(ctx: CanvasRenderingContext2D, l: Layout) {
  const { x, y, s, elbow, head, across, mouth } = lampShape(l);
  contactShadow(ctx, x, y, 20 * s, s);
  ctx.fillStyle = "#4f7a6c";
  ctx.beginPath();
  ctx.ellipse(x, y - 3 * s, 20 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - 20 * s, y - 7 * s, 40 * s, 4 * s);
  ctx.fillStyle = "#6f9a8a";
  ctx.beginPath();
  ctx.ellipse(x, y - 7 * s, 20 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Arms, and brass at the joints.
  ctx.strokeStyle = "#4f7a6c";
  ctx.lineCap = "round";
  ctx.lineWidth = 3.4 * s;
  ctx.beginPath();
  ctx.moveTo(x, y - 8 * s);
  ctx.lineTo(elbow.x, elbow.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,220,180,0.4)";
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(x - 1.5 * s, y - 8 * s);
  ctx.lineTo(elbow.x - 1.5 * s, elbow.y);
  ctx.lineTo(head.x, head.y - 1.5 * s);
  ctx.stroke();
  ctx.fillStyle = "#c9a46a";
  for (const j of [{ x, y: y - 8 * s }, elbow, head]) {
    ctx.beginPath();
    ctx.arc(j.x, j.y, 3.2 * s, 0, Math.PI * 2);
    ctx.fill();
  }
  // The shade: a cone, narrow at the head, open over the desk, lit inside.
  const back = { x: head.x + across.x * 6 * s, y: head.y + across.y * 6 * s };
  const front = { x: head.x - across.x * 6 * s, y: head.y - across.y * 6 * s };
  const half = 19 * s;
  const lipA = { x: mouth.x + across.x * half, y: mouth.y + across.y * half };
  const lipB = { x: mouth.x - across.x * half, y: mouth.y - across.y * half };
  ctx.fillStyle = "#5f8a7a";
  ctx.beginPath();
  ctx.moveTo(back.x, back.y);
  ctx.lineTo(lipA.x, lipA.y);
  ctx.lineTo(lipB.x, lipB.y);
  ctx.lineTo(front.x, front.y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgba(255,220,180,0.35)";
  ctx.beginPath();
  ctx.moveTo(back.x, back.y);
  ctx.lineTo(lipA.x, lipA.y);
  ctx.lineTo(lipA.x - across.x * 4 * s, lipA.y - across.y * 4 * s);
  ctx.lineTo(back.x - across.x * 2 * s, back.y - across.y * 2 * s);
  ctx.fill();
  ctx.fillStyle = "#4f7a6c";
  ctx.beginPath();
  ctx.ellipse(head.x, head.y, 7 * s, 4.5 * s, Math.atan2(across.y, across.x), 0, Math.PI * 2);
  ctx.fill();
  // The open mouth, glowing, the bulb just showing in it.
  ctx.fillStyle = "#ffe6b0";
  ctx.beginPath();
  ctx.ellipse(mouth.x, mouth.y, half, 4.5 * s, Math.atan2(across.y, across.x), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fffaf0";
  ctx.beginPath();
  ctx.ellipse(mouth.x, mouth.y - 1 * s, 7 * s, 3 * s, Math.atan2(across.y, across.x), 0, Math.PI * 2);
  ctx.fill();
}

/**
 * The lamp's light, drawn once: a soft cone down from the shade and a warm
 * pool where it lands on the notebook and desk. Returns the sprite and
 * where it goes; the front canvas only breathes it.
 */
function lampLight(l: Layout, dpr: number) {
  const { mouth, across, s } = lampShape(l);
  const pool = { x: mouth.x - 22 * s, y: l.desk - 12 * s, rx: 100 * s, ry: 22 * s };
  const box = {
    x: pool.x - pool.rx - 10 * s,
    y: mouth.y - 10 * s,
    w: pool.rx * 2 + 60 * s,
    h: l.desk + 16 * s - mouth.y,
  };
  const c = document.createElement("canvas");
  c.width = Math.ceil(box.w * dpr);
  c.height = Math.ceil(box.h * dpr);
  const g = c.getContext("2d")!;
  g.scale(dpr, dpr);
  g.translate(-box.x, -box.y);
  // Drawn once, so a real blur costs nothing after.
  g.filter = `blur(${Math.max(2, 6 * s)}px)`;
  const half = 17 * s;
  const cone = g.createLinearGradient(0, mouth.y, 0, pool.y);
  cone.addColorStop(0, "rgba(255,214,150,0.5)");
  cone.addColorStop(1, "rgba(255,200,140,0.12)");
  g.fillStyle = cone;
  g.beginPath();
  g.moveTo(mouth.x + across.x * half, mouth.y + across.y * half);
  g.lineTo(pool.x + pool.rx * 0.75, pool.y);
  g.lineTo(pool.x - pool.rx * 0.75, pool.y);
  g.lineTo(mouth.x - across.x * half, mouth.y - across.y * half);
  g.fill();
  g.filter = "none";
  const warm = g.createRadialGradient(pool.x, pool.y, 0, pool.x, pool.y, pool.rx);
  warm.addColorStop(0, "rgba(255,210,150,0.55)");
  warm.addColorStop(0.5, "rgba(255,190,130,0.2)");
  warm.addColorStop(1, "rgba(255,190,130,0)");
  g.fillStyle = warm;
  g.save();
  g.translate(pool.x, pool.y);
  g.scale(1, pool.ry / pool.rx);
  g.translate(-pool.x, -pool.y);
  g.beginPath();
  g.arc(pool.x, pool.y, pool.rx, 0, Math.PI * 2);
  g.fill();
  g.restore();
  return { sprite: c, box, mouth };
}

/**
 * The cat, a ginger tabby curled up asleep facing right, drawn once: its
 * body a mound shaded from the lit back down to the shadow underneath,
 * stripes running round the curl, the window's light along its outline,
 * its tail wrapped round the front, and its head tucked down on its paw
 * with the ears up. The front canvas only breathes it.
 */
function catSprite(k: number, dpr: number) {
  // Drawn in its own units: the sill at y 0, from x -60 to 62.
  const c = document.createElement("canvas");
  c.width = Math.ceil(122 * k * dpr);
  c.height = Math.ceil(56 * k * dpr);
  const g = c.getContext("2d")!;
  g.scale(k * dpr, k * dpr);
  g.translate(60, 48);
  g.lineCap = "round";
  g.lineJoin = "round";

  const body = new Path2D();
  body.moveTo(-46, 0);
  body.bezierCurveTo(-56, -16, -44, -36, -18, -37);
  body.bezierCurveTo(2, -38, 20, -31, 27, -18);
  body.lineTo(30, 0);
  body.closePath();
  const fur = g.createLinearGradient(0, -38, 0, 0);
  fur.addColorStop(0, "#efa86e");
  fur.addColorStop(0.4, "#d4864e");
  fur.addColorStop(1, "#8a4a2c");
  g.fillStyle = fur;
  g.fill(body);

  // Stripes running round the curl: tapered bands out from a point under
  // its middle, so they follow the back as it bends.
  g.save();
  g.clip(body);
  g.fillStyle = "rgba(130,62,32,0.6)";
  const [ox, oy] = [-8, 4];
  const ray = (a: number, r: number) => [ox + Math.cos(a) * r, oy + Math.sin(a) * r] as const;
  for (let a = -2.95; a < -0.55; a += 0.24) {
    const w = 0.055;
    g.beginPath();
    g.moveTo(...ray(a, 20));
    g.quadraticCurveTo(...ray(a - w * 2, 34), ...ray(a - w, 48));
    g.lineTo(...ray(a + w * 1.4, 48));
    g.quadraticCurveTo(...ray(a, 34), ...ray(a, 20));
    g.fill();
  }
  // Rim light along its back, from the window behind it.
  g.beginPath();
  g.rect(-60, -48, 122, 38);
  g.clip();
  g.strokeStyle = "rgba(255,226,186,0.9)";
  g.lineWidth = 3;
  g.stroke(body);
  g.restore();

  // The curve of its back leg, folded under the haunch.
  g.strokeStyle = "rgba(110,50,26,0.45)";
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-40, -6);
  g.bezierCurveTo(-42, -20, -26, -26, -14, -18);
  g.stroke();

  // The tail, wrapped round the front, ringed.
  const tail = new Path2D();
  tail.moveTo(-45, -4);
  tail.bezierCurveTo(-36, 5, 2, 6, 30, 1);
  g.strokeStyle = "#cf8250";
  g.lineWidth = 9;
  g.stroke(tail);
  g.strokeStyle = "rgba(130,62,32,0.7)";
  g.lineCap = "butt";
  g.setLineDash([3.5, 6]);
  g.stroke(tail);
  g.setLineDash([]);
  g.lineCap = "round";
  g.strokeStyle = "rgba(255,226,186,0.5)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-40, -3);
  g.bezierCurveTo(-30, 2, 0, 3, 26, -2);
  g.stroke();

  // A front paw tucked under the chin.
  g.fillStyle = "#f2c79a";
  g.beginPath();
  g.ellipse(40, -3.5, 8, 3.8, 0, 0, Math.PI * 2);
  g.fill();

  // Ears, the far one first, pink inside.
  const ear = (bx: number, by: number, tx: number, ty: number, ex: number, ey: number, fill: string) => {
    g.fillStyle = fill;
    g.beginPath();
    g.moveTo(bx, by);
    g.quadraticCurveTo(tx - 1, ty + 1, tx, ty);
    g.quadraticCurveTo(tx + 1, ty + 2, ex, ey);
    g.fill();
    g.fillStyle = "#e9a294";
    g.beginPath();
    g.moveTo(lerp(bx, ex, 0.25), lerp(by, ey, 0.25) - 1);
    g.lineTo(lerp(tx, (bx + ex) / 2, 0.25), lerp(ty, (by + ey) / 2, 0.25));
    g.lineTo(lerp(bx, ex, 0.75), lerp(by, ey, 0.75) - 1);
    g.fill();
  };
  ear(23, -21, 22, -40, 33, -27, "#c9783f");
  ear(37, -28, 46, -42, 48, -22, "#e09a5e");

  // The head: rounded, wider at the cheeks, tipped down onto the paw.
  const head = new Path2D();
  head.ellipse(36, -16, 15, 12.5, 0.18, 0, Math.PI * 2);
  head.ellipse(41, -10, 11, 8, 0.1, 0, Math.PI * 2);
  const face = g.createLinearGradient(30, -30, 40, 0);
  face.addColorStop(0, "#f0aa70");
  face.addColorStop(1, "#c27440");
  g.fillStyle = face;
  g.fill(head);
  g.save();
  g.clip(head);
  // Forehead and cheek stripes, and the lighter muzzle.
  g.strokeStyle = "rgba(130,62,32,0.65)";
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(33, -28);
  g.lineTo(34, -22);
  g.moveTo(37.5, -28.5);
  g.lineTo(37.5, -22.5);
  g.moveTo(42, -27);
  g.lineTo(40.5, -21.5);
  g.moveTo(27, -14);
  g.lineTo(32, -13);
  g.moveTo(27.5, -10);
  g.lineTo(32, -10.5);
  g.stroke();
  g.fillStyle = "#f7d8b4";
  g.beginPath();
  g.ellipse(46, -9, 7, 5, 0.2, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.strokeStyle = "rgba(255,226,186,0.8)";
  g.lineWidth = 1.6;
  g.beginPath();
  g.ellipse(36, -16, 15, 12.5, 0.18, Math.PI * 1.05, Math.PI * 1.75);
  g.stroke();
  // Nose, and eyes shut.
  g.fillStyle = "#d9776e";
  g.beginPath();
  g.ellipse(51.5, -10.5, 1.8, 1.3, 0, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "#4a2418";
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(37, -16);
  g.quadraticCurveTo(40.5, -13.5, 44, -15.5);
  g.moveTo(47.5, -16.5);
  g.quadraticCurveTo(49.5, -14.5, 51, -16);
  g.stroke();
  return c;
}

/** A shaft of sunlight, along x: fading in from the window, out into the
 *  room, and soft at both edges. Drawn once and stretched to each shaft. */
function shaftSprite() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const g = c.getContext("2d")!;
  const along = g.createLinearGradient(0, 0, 256, 0);
  along.addColorStop(0, "rgba(255,206,160,0)");
  along.addColorStop(0.12, "rgba(255,206,160,1)");
  along.addColorStop(0.5, "rgba(255,200,150,0.6)");
  along.addColorStop(1, "rgba(255,190,140,0)");
  g.fillStyle = along;
  g.fillRect(0, 0, 256, 64);
  g.globalCompositeOperation = "destination-in";
  const across = g.createLinearGradient(0, 0, 0, 64);
  across.addColorStop(0, "rgba(0,0,0,0)");
  across.addColorStop(0.5, "rgba(0,0,0,1)");
  across.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = across;
  g.fillRect(0, 0, 256, 64);
  return c;
}

/** A soft round blur, stamped for steam and dust rather than drawing a new
 *  gradient every frame. */
function puffSprite(radius: number, rgb: string) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(radius * 2);
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.4, `rgba(${rgb},0.45)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

const DawnScene = () => {
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
      const dpr = cappedDpr(1.5);
      const b = fitCanvas(back, dpr);
      const l = layout(b.w, b.h);
      drawBack(b.ctx, b.w, b.h, l);

      const { ctx, w, h } = fitCanvas(front, dpr);
      const rand = seeded(17);
      const { s, win } = l;

      const catK = s * 1.1;
      const cat = catSprite(catK, dpr);
      const shaft = shaftSprite();
      const lamp = lampLight(l, dpr);
      const bulbGlow = puffSprite(48, "255,200,130");
      const puff = puffSprite(32, "255,245,235");
      const mote = puffSprite(6, "255,225,180");

      // The open part of the window, between the blinds and the rooftops,
      // where clouds and birds can pass.
      const sky = { x: win.x, y: l.blind + 8 * s, w: win.w, h: l.roofs - win.h * 0.12 - l.blind };
      const glass = new Path2D();
      const { cord, bar } = sash(l);
      for (const pane of panes(l)) {
        // Either side of the pull cord, which hangs in front of the glass.
        if (pane.y < bar && cord > pane.x && cord < pane.x + pane.w) {
          glass.rect(pane.x, pane.y, cord - 1.5 - pane.x, pane.h);
          glass.rect(cord + 1.5, pane.y, pane.x + pane.w - cord - 1.5, pane.h);
        } else glass.rect(pane.x, pane.y, pane.w, pane.h);
      }
      const clouds = Array.from({ length: 3 }, (_, i) => ({
        x: win.x + rand() * win.w,
        y: sky.y + lerp(0.15, 0.6, i / 2) * sky.h,
        rx: lerp(0.12, 0.22, rand()) * win.w,
        ry: lerp(3, 6, rand()) * s + 1,
        speed: lerp(3, 7, rand()),
      }));
      // A few birds crossing now and then: one loose flock on a long loop.
      const flock = Array.from({ length: 4 }, () => ({ dx: rand() * 40 * s, dy: rand() * 18 * s, phase: rand() * 6 }));
      const flockLoop = 38;

      // Dust in the light: drifting slowly through the stripes and the
      // window's glow, each brightening and fading.
      const area = {
        x: Math.max(0, win.x - win.w * 0.6),
        y: win.y + win.h * 0.2,
        w: win.w * 1.4,
        h: l.desk - win.y - win.h * 0.2,
      };
      const motes = Array.from({ length: l.portrait ? 26 : 44 }, () => ({
        x: area.x + rand() * area.w,
        y: area.y + rand() * area.h,
        vx: lerp(-4, 4, rand()),
        vy: lerp(-5, 2, rand()),
        size: lerp(2, 5, rand()) * Math.max(0.7, s),
        phase: rand() * Math.PI * 2,
        rate: lerp(0.4, 1.2, rand()),
      }));

      const steam = Array.from({ length: 10 }, () => ({ age: rand() * 4, seed: rand() * 10 }));

      // Shafts of sunlight through the open lower half of the window,
      // slanting down into the room as the stripes from the blinds do, each
      // drifting a little and slowly brightening and fading.
      const angle = Math.atan2(0.55, -1);
      const shafts = Array.from({ length: 5 }, (_, i) => {
        const y0 = lerp(l.blind, l.sill, lerp(0.2, 0.6, rand()));
        return {
          x: win.x + win.w * lerp(0.25, 0.95, (i + rand() * 0.6) / 5),
          y: y0,
          length: ((l.desk - y0) / 0.482) * lerp(0.95, 1.2, rand()),
          width: lerp(0.08, 0.17, rand()) * win.w,
          alpha: lerp(0.12, 0.2, rand()),
          phase: rand() * Math.PI * 2,
          rate: lerp(0.15, 0.35, rand()),
        };
      });

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);

        // Outside: clouds drifting along, and the flock going over.
        ctx.save();
        ctx.clip(glass);
        ctx.fillStyle = "rgba(255,214,190,0.35)";
        for (const c of clouds) {
          c.x += c.speed * dt;
          if (c.x - c.rx > win.x + win.w) c.x = win.x - c.rx;
          ctx.beginPath();
          ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        const u = (t % flockLoop) / flockLoop;
        if (u < 0.4) {
          const fx = win.x - 60 * s + (u / 0.4) * (win.w + 120 * s);
          const fy = sky.y + sky.h * 0.35 - (u / 0.4) * sky.h * 0.2;
          ctx.strokeStyle = "rgba(60,40,70,0.75)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          for (const bird of flock) {
            const bx = fx + bird.dx;
            const by = fy + bird.dy;
            const flap = Math.sin(t * 9 + bird.phase) * 3 * s;
            ctx.moveTo(bx - 5 * s, by - flap);
            ctx.lineTo(bx, by);
            ctx.lineTo(bx + 5 * s, by - flap);
          }
          ctx.stroke();
        }
        ctx.restore();

        // The cat asleep on the sill, breathing slowly.
        const breath = 1 + Math.sin(t * 1.3) * 0.035;
        ctx.save();
        ctx.translate(l.cat.x, l.cat.y);
        ctx.scale(1, breath);
        ctx.drawImage(cat, -60 * catK, -48 * catK, 122 * catK, 56 * catK);
        ctx.restore();

        // Sunlight streaming in, added onto everything behind it.
        ctx.globalCompositeOperation = "lighter";
        for (const sh of shafts) {
          ctx.save();
          ctx.translate(sh.x, sh.y);
          ctx.rotate(angle);
          ctx.globalAlpha = sh.alpha * (0.6 + 0.4 * Math.sin(t * sh.rate + sh.phase));
          const drift = Math.sin(t * 0.11 + sh.phase) * sh.width * 0.3;
          ctx.drawImage(shaft, 0, -sh.width / 2 + drift, sh.length, sh.width);
          ctx.restore();
        }

        // The lamp's light on the notebook, breathing very slowly.
        const lit = 0.9 + Math.sin(t * 0.5) * 0.08;
        ctx.globalAlpha = lit;
        ctx.drawImage(lamp.sprite, lamp.box.x, lamp.box.y, lamp.box.w, lamp.box.h);
        ctx.globalAlpha = 0.35 * lit;
        const gr = 60 * s;
        ctx.drawImage(bulbGlow, lamp.mouth.x - gr, lamp.mouth.y - gr, gr * 2, gr * 2);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;

        // The clock's hands, keeping the real time.
        const now = new Date();
        const sec = now.getSeconds();
        const min = now.getMinutes() + sec / 60;
        const hr = (now.getHours() % 12) + min / 60;
        const { x: kx, y: ky } = l.clock;
        const kc = ky - 28 * s;
        const hand = (turn: number, len: number, width: number, color: string) => {
          const a = turn * Math.PI * 2 - Math.PI / 2;
          ctx.strokeStyle = color;
          ctx.lineWidth = width;
          ctx.beginPath();
          ctx.moveTo(kx, kc);
          ctx.lineTo(kx + Math.cos(a) * len, kc + Math.sin(a) * len);
          ctx.stroke();
        };
        ctx.lineCap = "round";
        hand(hr / 12, 8 * s, 2.2 * s, "#3a2c3e");
        hand(min / 60, 12 * s, 1.6 * s, "#3a2c3e");
        hand(sec / 60, 13 * s, 0.8 * s, "#d9604e");
        ctx.fillStyle = "#3a2c3e";
        ctx.beginPath();
        ctx.arc(kx, kc, 1.6 * s, 0, Math.PI * 2);
        ctx.fill();

        // Steam off the mug.
        const { x: mx, y: my } = l.mug;
        for (const p of steam) {
          p.age += dt;
          if (p.age > 4) p.age -= 4;
          const k = p.age / 4;
          const size = (8 + k * 26) * s;
          ctx.globalAlpha = Math.sin(k * Math.PI) * 0.16;
          ctx.drawImage(
            puff,
            mx + Math.sin(p.age * 1.3 + p.seed) * 10 * s * (0.3 + k) - size / 2,
            my - 52 * s - k * 100 * s - size / 2,
            size,
            size,
          );
        }

        // Dust in the light.
        for (const m of motes) {
          m.x += m.vx * dt;
          m.y += (m.vy + Math.sin(t * 0.5 + m.phase) * 3) * dt;
          if (m.x < area.x) m.x += area.w;
          if (m.x > area.x + area.w) m.x -= area.w;
          if (m.y < area.y) m.y += area.h;
          if (m.y > area.y + area.h) m.y -= area.h;
          ctx.globalAlpha = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * m.rate + m.phase));
          ctx.drawImage(mote, m.x - m.size / 2, m.y - m.size / 2, m.size, m.size);
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
      {/* Shadow gathered in the corners, deepest top left behind the greeting. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_45%,transparent_40%,rgb(20_12_28/0.6)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgb(16_10_24/0.45),transparent_40%)]" />
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default DawnScene;
