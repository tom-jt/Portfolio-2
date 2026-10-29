"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * Inside a café late at night, rain on the big front window. Two canvases:
 *
 *  back  — the room: wall, shelves, the counter and a cup, pendant lamps, and
 *          through the window a wet street gone soft with distance. Drawn once.
 *  front — cars swishing past outside, rain, beads and runs on the glass,
 *          steam off the cup, a string of lights that twinkle, and the
 *          lamps' glow breathing.
 */

interface Layout {
  win: { x: number; y: number; w: number; h: number };
  counter: number;
  cup: { x: number; y: number; s: number };
  /** Where each pendant hangs, and its shade's half-width. */
  lamps: { x: number; y: number; r: number }[];
  /** Where the things along the counter stand, or null where there's no room. */
  deco: { plant: Spot; books: Spot | null; candle: Spot; croissant: Spot | null };
}

/** The middle of something's footprint on the counter. */
type Spot = { x: number; y: number };

function layout(w: number, h: number): Layout {
  const portrait = w < h;
  const x = w * (portrait ? 0.06 : 0.17);
  // On a phone the greeting covers the top of the screen, so the window starts below it.
  const win = portrait ? { x, y: h * 0.24, w: w - x * 2, h: h * 0.48 } : { x, y: h * 0.1, w: w - x * 2, h: h * 0.6 };
  const counter = h * 0.8;
  const s = Math.min(w, h) / 800;
  // Things stand a little nearer or further back on the counter top, not all
  // along its back edge, and in the groups someone would leave them in: the
  // coffee with its croissant, the books by the candle, the plant on its own.
  const at = (x: number, depth: number): Spot => ({ x, y: counter + depth * s });
  // A pendant's shade is as wide as a big bowl: a few cups across.
  const r = Math.max(22, 60 * s);
  return {
    win,
    counter,
    cup: { ...at(w * (portrait ? 0.7 : 0.64), 5), s },
    lamps: portrait
      ? [{ x: w * 0.5, y: h * 0.185, r }]
      : [
          { x: w * 0.3, y: h * 0.13, r },
          { x: w * 0.7, y: h * 0.13, r },
        ],
    // A phone keeps the plant and the candle only.
    deco: portrait
      ? { plant: at(w * 0.15, 2), books: null, candle: at(w * 0.34, 7), croissant: null }
      : {
          plant: at(w * 0.215, 2),
          books: at(w * 0.355, 0),
          candle: at(w * 0.445, 7),
          croissant: at(w * 0.745, 10),
        },
  };
}

/**
 * The contact shadow under something on the counter: a soft flat ellipse
 * just wider than its footprint, darkest where it touches. The lamps hang
 * above, so every shadow falls straight down, all at one depth. (x, y) is
 * the middle of the footprint and `rx` half its width.
 */
function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, s: number) {
  const r = rx * 1.12;
  const ry = Math.max(3.5 * s, r * 0.18);
  ctx.save();
  ctx.translate(x, y + 1.5 * s);
  ctx.scale(1, ry / r);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
  g.addColorStop(0, "rgba(8,4,2,0.62)");
  g.addColorStop(0.6, "rgba(8,4,2,0.36)");
  g.addColorStop(1, "rgba(8,4,2,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  // The thin dark line right at the contact.
  ctx.fillStyle = "rgba(8,4,2,0.45)";
  ctx.beginPath();
  ctx.ellipse(x, y + 0.5 * s, rx * 0.92, 1.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A succulent in a little terracotta pot. */
function drawPlant(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, rand: () => number) {
  shadow(ctx, x, y, 11 * s, s);
  // Leaves first, fanning out of the soil: the back ones darker.
  for (let i = 0; i < 11; i++) {
    const back = i < 5;
    const a = lerp(-1.25, 1.25, (i % 6) / 5) + lerp(-0.12, 0.12, rand());
    const len = (back ? lerp(18, 24, rand()) : lerp(12, 18, rand())) * s;
    ctx.save();
    ctx.translate(x, y - 22 * s);
    ctx.rotate(a);
    ctx.fillStyle = back ? "#3f6e4a" : ["#5f9a6a", "#6fae78", "#7cba82"][i % 3];
    ctx.beginPath();
    ctx.moveTo(-3.6 * s, 0);
    ctx.quadraticCurveTo(-4 * s, -len * 0.6, 0, -len);
    ctx.quadraticCurveTo(4 * s, -len * 0.6, 3.6 * s, 0);
    ctx.fill();
    // A blush at the tip, as succulents get.
    ctx.fillStyle = "rgba(220,120,110,0.45)";
    ctx.beginPath();
    ctx.ellipse(0, -len + 2 * s, 1.4 * s, 2.4 * s, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // The pot: rim, then a tapered body, lit from the left.
  const body = ctx.createLinearGradient(x - 14 * s, 0, x + 14 * s, 0);
  body.addColorStop(0, "#c8724a");
  body.addColorStop(1, "#7e3f24");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(x - 13 * s, y - 18 * s);
  ctx.lineTo(x + 13 * s, y - 18 * s);
  ctx.lineTo(x + 10 * s, y);
  ctx.lineTo(x - 10 * s, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#b5623e";
  ctx.fillRect(x - 15 * s, y - 24 * s, 30 * s, 7 * s);
  ctx.fillStyle = "rgba(255,210,170,0.25)";
  ctx.fillRect(x - 15 * s, y - 24 * s, 30 * s, 1.5 * s);
}

/** Two books lying one on the other, and a pen across the top. */
function drawBooks(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  shadow(ctx, x, y, 42 * s, s);
  const book = (bx: number, by: number, bw: number, bh: number, cover: string) => {
    // The cover, and the pages showing along the near edge.
    ctx.fillStyle = cover;
    ctx.fillRect(bx - bw / 2, by - bh, bw, bh);
    ctx.fillStyle = "#e9dcc4";
    ctx.fillRect(bx - bw / 2 + 3 * s, by - bh + 2.5 * s, bw - 6 * s, bh - 5 * s);
    ctx.fillStyle = "rgba(120,95,70,0.35)";
    for (let ly = by - bh + 4 * s; ly < by - 3 * s; ly += 1.8 * s) ctx.fillRect(bx - bw / 2 + 3 * s, ly, bw - 6 * s, 0.6 * s);
    ctx.fillStyle = "rgba(255,225,190,0.2)";
    ctx.fillRect(bx - bw / 2, by - bh, bw, 1.2 * s);
  };
  book(x, y, 84 * s, 13 * s, "#3f5a6a");
  book(x - 4 * s, y - 13 * s, 70 * s, 11 * s, "#7a3b2e");
  // The pen, lying slightly askew: most of a book's length, as a real one is.
  ctx.save();
  ctx.translate(x + 6 * s, y - 25.5 * s);
  ctx.rotate(-0.06);
  ctx.fillStyle = "#1f1a18";
  ctx.fillRect(-38 * s, -1.8 * s, 70 * s, 3.6 * s);
  ctx.fillStyle = "#c9a45a";
  ctx.fillRect(20 * s, -2 * s, 3 * s, 4 * s);
  ctx.fillRect(-38 * s, -1.8 * s, 4 * s, 3.6 * s);
  ctx.restore();
}

/** A candle in a glass, its flame drawn on the front canvas. */
function drawCandle(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  shadow(ctx, x, y, 14 * s, s);
  // Wax, cream and lit warm from its own flame.
  const wax = ctx.createLinearGradient(0, y - 24 * s, 0, y);
  wax.addColorStop(0, "#fff0cf");
  wax.addColorStop(1, "#d9c09a");
  ctx.fillStyle = wax;
  ctx.fillRect(x - 11 * s, y - 22 * s, 22 * s, 22 * s);
  ctx.fillStyle = "#f6dfb0";
  ctx.beginPath();
  ctx.ellipse(x, y - 22 * s, 11 * s, 2.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a1a10";
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(x, y - 22 * s);
  ctx.lineTo(x + 0.6 * s, y - 27 * s);
  ctx.stroke();
  // The glass round it: faint, with a bright edge where the light catches.
  ctx.fillStyle = "rgba(255,235,210,0.1)";
  ctx.fillRect(x - 14 * s, y - 36 * s, 28 * s, 36 * s);
  ctx.strokeStyle = "rgba(255,230,200,0.35)";
  ctx.lineWidth = 1.2 * s;
  ctx.strokeRect(x - 14 * s, y - 36 * s, 28 * s, 36 * s);
  ctx.fillStyle = "rgba(255,245,230,0.35)";
  ctx.fillRect(x - 11 * s, y - 33 * s, 2 * s, 28 * s);
}

/** A croissant on a side plate: the plate a little wider than the cup's
 *  saucer, the croissant longer than the cup is wide. */
function drawCroissant(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  shadow(ctx, x, y, 50 * s, s);
  ctx.fillStyle = "#d9cab5";
  ctx.beginPath();
  ctx.ellipse(x, y, 50 * s, 8.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4b39c";
  ctx.beginPath();
  ctx.ellipse(x, y - 1 * s, 35 * s, 5.4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Its segments, plumpest in the middle, each a little darker at the seam.
  const c = s * 1.3;
  const segs = [-22, -13, -4, 5, 14, 22];
  for (const [i, dx] of segs.entries()) {
    const mid = 1 - Math.abs(i - 2.5) / 3;
    const rx = lerp(6, 9, mid) * c;
    const ry = lerp(5, 10, mid) * c;
    const cy = y - 3 * s - ry + Math.abs(dx) * 0.12 * c;
    const g = ctx.createLinearGradient(0, cy - ry, 0, cy + ry);
    g.addColorStop(0, "#e8a85a");
    g.addColorStop(1, "#9a5a26");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(x + dx * c, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(90,45,15,0.5)";
    ctx.lineWidth = 0.8 * s;
    ctx.stroke();
  }
  // A shine across the top.
  ctx.fillStyle = "rgba(255,225,170,0.35)";
  ctx.beginPath();
  ctx.ellipse(x - 2 * c, y - 3 * s - 16 * c, 9 * c, 2 * c, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawStreet(ctx: CanvasRenderingContext2D, win: Layout["win"], rand: () => number) {
  const { x, y, w, h } = win;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  const night = ctx.createLinearGradient(0, y, 0, y + h);
  night.addColorStop(0, "#0b1226");
  night.addColorStop(0.6, "#1a1f38");
  night.addColorStop(1, "#2a2235");
  ctx.fillStyle = night;
  ctx.fillRect(x, y, w, h);

  // Everything outside is out of focus, seen through wet glass. The street is
  // drawn once, so the blur costs nothing after the first frame.
  ctx.filter = `blur(${Math.max(1.5, w / 450)}px)`;

  // Buildings opposite, and their lit windows: each light belongs to a wall.
  const street = y + h * 0.78;
  const s = w / 900 + 0.4;
  for (let bx = x - w * 0.02; bx < x + w; ) {
    const bw = lerp(0.1, 0.2, rand()) * w;
    const bh = lerp(0.4, 0.72, rand()) * h;
    const top = street - bh;
    ctx.fillStyle = rand() < 0.5 ? "#101730" : "#141c36";
    ctx.fillRect(bx, top, bw, bh);
    // Windows in a grid, a few lit, slightly soft with distance.
    const cols = Math.max(2, Math.round(bw / (16 * s)));
    const rows = Math.max(3, Math.round(bh / (20 * s)));
    const cw = bw / cols;
    const rh = bh / rows;
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > 0.32) continue;
        const wx = bx + c * cw + cw * 0.28;
        const wy = top + r * rh + rh * 0.3;
        ctx.fillStyle = rand() < 0.75 ? "rgba(255,200,130,0.34)" : "rgba(190,215,255,0.24)";
        ctx.fillRect(wx, wy, cw * 0.38, rh * 0.36);
      }
    }
    bx += bw + lerp(2, 8, rand()) * s;
  }

  // The pavement, and street lamps standing on it at even intervals.
  ctx.fillStyle = "#1c1d30";
  ctx.fillRect(x, street, w, h * 0.06);
  const lampGap = Math.max(160, w * 0.32);
  for (let lx = x + lampGap * 0.4; lx < x + w; lx += lampGap) {
    const lampY = street - h * 0.22;
    ctx.strokeStyle = "#0b0f1d";
    ctx.lineWidth = 2.5 * s;
    ctx.beginPath();
    ctx.moveTo(lx, street + h * 0.04);
    ctx.lineTo(lx, lampY);
    ctx.lineTo(lx + 12 * s, lampY);
    ctx.stroke();
    const r = 34 * s;
    const g = ctx.createRadialGradient(lx + 12 * s, lampY + 3 * s, 0, lx + 12 * s, lampY + 3 * s, r);
    g.addColorStop(0, "rgba(255,206,140,0.7)");
    g.addColorStop(0.35, "rgba(255,190,120,0.25)");
    g.addColorStop(1, "rgba(255,190,120,0)");
    ctx.fillStyle = g;
    ctx.fillRect(lx + 12 * s - r, lampY + 3 * s - r, r * 2, r * 2);
  }

  // The cars are live, on the front canvas (see carSprite).

  // Wet road reflecting it all.
  const road = ctx.createLinearGradient(0, y + h * 0.85, 0, y + h);
  road.addColorStop(0, "rgba(255,190,140,0.08)");
  road.addColorStop(1, "rgba(255,190,140,0.18)");
  ctx.fillStyle = road;
  ctx.fillRect(x, y + h * 0.85, w, h * 0.15);
  ctx.restore();
}

function drawBack(ctx: CanvasRenderingContext2D, w: number, h: number, l: Layout) {
  const rand = seeded(23);

  const wall = ctx.createLinearGradient(0, 0, 0, h);
  wall.addColorStop(0, "#1c120d");
  wall.addColorStop(0.6, "#2a1a11");
  wall.addColorStop(1, "#160d08");
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, w, h);

  // Wainscoting below the window.
  ctx.fillStyle = "#24160e";
  ctx.fillRect(0, l.win.y + l.win.h + h * 0.04, w, h);
  ctx.strokeStyle = "rgba(0,0,0,0.25)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, l.win.y + l.win.h + h * 0.04);
    ctx.lineTo(x, l.counter);
    ctx.stroke();
  }

  drawStreet(ctx, l.win, rand);

  // Window frame and mullions.
  const { x, y, w: ww, h: wh } = l.win;
  ctx.strokeStyle = "#3a2416";
  ctx.lineWidth = Math.max(4, ww * 0.008);
  ctx.beginPath();
  ctx.moveTo(x + ww / 2, y);
  ctx.lineTo(x + ww / 2, y + wh);
  ctx.moveTo(x, y + wh * 0.32);
  ctx.lineTo(x + ww, y + wh * 0.32);
  ctx.stroke();
  ctx.lineWidth = Math.max(10, ww * 0.018);
  ctx.strokeStyle = "#4a2f1d";
  ctx.strokeRect(x, y, ww, wh);
  // Sill.
  ctx.fillStyle = "#5a3a24";
  ctx.fillRect(x - 14, y + wh, ww + 28, Math.max(8, h * 0.014));

  // Shelves on the side walls, when there's room for them.
  if (x > 70) {
    // Where the trailing plant stands, near the end of the right-hand top
    // shelf; the books there stop short of it.
    const plant = { x: x + ww + x * 0.18 + x * 0.55, y: h * 0.26 };
    for (const side of [0, 1]) {
      const sx = side ? x + ww + x * 0.18 : x * 0.12;
      const sw = x * 0.7;
      // Sized against the cup on the counter, a little smaller for being
      // further back: a book stands a good two and a half cups tall, a jar of
      // beans half again as tall as one.
      const k = l.cup.s;
      for (const row of [0.26, 0.46]) {
        const sy = h * row;
        ctx.fillStyle = "#4a2f1d";
        ctx.fillRect(sx, sy, sw, 5 * k);
        // Books in groups, a jar or two between them.
        const end = side && row === 0.26 ? plant.x - 24 * l.cup.s : sx + sw - 10;
        for (let bx = sx + 6; bx < end; ) {
          if (rand() < 0.22) {
            const jw = lerp(28, 38, rand()) * k;
            const jh = lerp(44, 58, rand()) * k;
            ctx.fillStyle = ["#b98a5a", "#5f7a6a", "#c9b08a"][Math.floor(rand() * 3)];
            ctx.fillRect(bx, sy - jh, jw, jh);
            ctx.fillStyle = "#3a2416";
            ctx.fillRect(bx - k, sy - jh - 5 * k, jw + 2 * k, 5 * k);
            bx += jw + 8 * k;
            continue;
          }
          const count = 4 + Math.floor(rand() * 4);
          for (let n = 0; n < count && bx < end - 4 * k; n++) {
            const bw = lerp(11, 17, rand()) * k;
            const bh = lerp(84, 104, rand()) * k;
            const hue = ["#7a3b2e", "#4f6a5a", "#8a6a3e", "#3f4f6a", "#a3724a", "#5a3a4a"][Math.floor(rand() * 6)];
            // The last of a group sometimes leans back onto its neighbour:
            // it pivots on its outer corner, standing out from the group by
            // as far as its top tips in, so the top rests on the book beside.
            const lean = n > 0 && n === count - 1 && rand() < 0.35 ? 0.22 : 0;
            if (lean) bx += bh * Math.sin(lean);
            ctx.save();
            ctx.translate(bx + bw, sy);
            ctx.rotate(-lean);
            ctx.fillStyle = hue;
            ctx.fillRect(-bw, -bh, bw, bh);
            ctx.fillStyle = "rgba(255,230,190,0.22)";
            ctx.fillRect(-bw + k, -bh + 10 * k, bw - 2 * k, 2.5 * k);
            ctx.fillRect(-bw + k, -18 * k, bw - 2 * k, 2.5 * k);
            ctx.restore();
            bx += bw + k;
          }
          bx += lerp(12, 22, rand()) * k;
        }
      }
    }
    // The trailing plant: a pot with a rim, its stems spilling out over
    // either side of the rim and hanging down past the shelf's edge, leaves
    // along them, and a tuft left standing in the pot.
    const k = l.cup.s;
    const rim = plant.y - 24 * k;
    const pot = ctx.createLinearGradient(plant.x - 14 * k, 0, plant.x + 14 * k, 0);
    pot.addColorStop(0, "#b5623e");
    pot.addColorStop(1, "#7a3a22");
    ctx.fillStyle = pot;
    ctx.beginPath();
    ctx.moveTo(plant.x - 12 * k, rim + 5 * k);
    ctx.lineTo(plant.x + 12 * k, rim + 5 * k);
    ctx.lineTo(plant.x + 9.5 * k, plant.y);
    ctx.lineTo(plant.x - 9.5 * k, plant.y);
    ctx.fill();
    ctx.fillStyle = "#a0583a";
    ctx.fillRect(plant.x - 14 * k, rim, 28 * k, 6 * k);
    ctx.fillStyle = "#2a1a10";
    ctx.fillRect(plant.x - 12 * k, rim - 1 * k, 24 * k, 1.5 * k);
    const leaf = (lx: number, ly: number, size: number, angle: number) => {
      ctx.fillStyle = rand() < 0.5 ? "#4f8a4a" : "#3d6a3a";
      ctx.beginPath();
      ctx.ellipse(lx, ly, size, size * 0.6, angle, 0, Math.PI * 2);
      ctx.fill();
    };
    ctx.strokeStyle = "#3d6a3a";
    ctx.lineWidth = 1.4 * k;
    for (let i = 0; i < 6; i++) {
      // Out over the left of the rim or the right, then down.
      const dir = i % 2 ? 1 : -1;
      const len = lerp(50, 130, rand()) * k;
      const sway = lerp(-6, 6, rand()) * k;
      const p0 = { x: plant.x + dir * lerp(3, 9, rand()) * k, y: rim };
      const p1 = { x: plant.x + dir * 20 * k, y: rim - 7 * k };
      const p2 = { x: plant.x + dir * 18 * k + sway, y: rim + len * 0.45 };
      const p3 = { x: plant.x + dir * 15 * k + sway * 1.6, y: rim + len };
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.bezierCurveTo(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y);
      ctx.stroke();
      // Leaves alternating along it, smaller towards the tip.
      for (let t = 0.12; t <= 1; t += 0.11) {
        const u = 1 - t;
        const at = (a: number, b: number, c: number, d: number) =>
          u * u * u * a + 3 * u * u * t * b + 3 * u * t * t * c + t * t * t * d;
        const side = Math.round(t * 9) % 2 ? 1 : -1;
        leaf(at(p0.x, p1.x, p2.x, p3.x) + side * 3 * k, at(p0.y, p1.y, p2.y, p3.y), lerp(5, 3, t) * k, side * 0.6);
      }
    }
    // The tuft in the pot, over the stems' roots.
    for (let i = 0; i < 7; i++) leaf(plant.x + lerp(-10, 10, i / 6) * k, rim - lerp(2, 7, rand()) * k, 5 * k, lerp(-0.8, 0.8, i / 6));
  }

  // Counter.
  const top = ctx.createLinearGradient(0, l.counter, 0, h);
  top.addColorStop(0, "#6b4428");
  top.addColorStop(0.08, "#4a2e1b");
  top.addColorStop(1, "#24150c");
  ctx.fillStyle = top;
  ctx.fillRect(0, l.counter, w, h - l.counter);
  ctx.fillStyle = "rgba(255,200,140,0.25)";
  ctx.fillRect(0, l.counter, w, 2);

  // The cup and saucer, lit from the lamps on the left.
  const { x: cx, y: cy, s } = l.cup;
  // Further back on the counter first, so nearer things overlap them.
  const { plant, books, candle } = l.deco;
  drawPlant(ctx, plant.x, plant.y, s * 1.25, rand);
  if (books) drawBooks(ctx, books.x, books.y, s * 1.25);
  drawCandle(ctx, candle.x, candle.y, s);
  shadow(ctx, cx, cy + 2 * s, 44 * s, s);
  // Saucer: a wide shallow dish with a lit rim.
  ctx.fillStyle = "#d9cab5";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2 * s, 44 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c4b39c";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 1 * s, 30 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Handle: a ring on the right, open in the middle.
  ctx.strokeStyle = "#e2d5c2";
  ctx.lineWidth = 5 * s;
  ctx.beginPath();
  // Its ends meet the cup's side, so it reads as joined, not floating.
  ctx.ellipse(cx + 22 * s, cy - 19 * s, 11 * s, 10 * s, 0, -Math.PI * 0.5, Math.PI * 0.5);
  ctx.stroke();
  // Body: straight sides rounding into the foot.
  const body = ctx.createLinearGradient(cx - 24 * s, 0, cx + 24 * s, 0);
  body.addColorStop(0, "#f6ecdd");
  body.addColorStop(0.55, "#e2d5c2");
  body.addColorStop(1, "#b9a993");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(cx - 24 * s, cy - 34 * s);
  ctx.lineTo(cx + 24 * s, cy - 34 * s);
  ctx.lineTo(cx + 22 * s, cy - 10 * s);
  ctx.quadraticCurveTo(cx + 20 * s, cy - 1 * s, cx + 10 * s, cy - 1 * s);
  ctx.lineTo(cx - 10 * s, cy - 1 * s);
  ctx.quadraticCurveTo(cx - 20 * s, cy - 1 * s, cx - 22 * s, cy - 10 * s);
  ctx.closePath();
  ctx.fill();
  // Rim, and the coffee inside it with a crema ring.
  ctx.fillStyle = "#f8f0e4";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 34 * s, 24 * s, 4.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  const coffee = ctx.createRadialGradient(cx - 4 * s, cy - 34 * s, 0, cx, cy - 34 * s, 21 * s);
  coffee.addColorStop(0, "#8a5a32");
  coffee.addColorStop(0.7, "#5a351c");
  coffee.addColorStop(1, "#3a2010");
  ctx.fillStyle = coffee;
  ctx.beginPath();
  ctx.ellipse(cx, cy - 34 * s, 21 * s, 3.6 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Its croissant, a little nearer.
  if (l.deco.croissant) drawCroissant(ctx, l.deco.croissant.x, l.deco.croissant.y, s);

  // Pendant lamps: cord and shade. Their glow is on the front canvas.
  for (const lamp of l.lamps) {
    ctx.strokeStyle = "#0d0805";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lamp.x, 0);
    ctx.lineTo(lamp.x, lamp.y);
    ctx.stroke();
    const { r } = lamp;
    ctx.fillStyle = "#b5773e";
    ctx.beginPath();
    ctx.moveTo(lamp.x - r * 0.25, lamp.y);
    ctx.lineTo(lamp.x + r * 0.25, lamp.y);
    ctx.lineTo(lamp.x + r, lamp.y + r * 0.7);
    ctx.lineTo(lamp.x - r, lamp.y + r * 0.7);
    ctx.fill();
    ctx.fillStyle = "#ffe2b0";
    ctx.beginPath();
    ctx.ellipse(lamp.x, lamp.y + r * 0.7, r * 0.9, r * 0.16, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** The two lanes of the street outside, as a share of the window's height:
 *  the far one, cars going left, and the near one, cars going right. */
const LANES = [
  { y: 0.875, dir: -1, size: 0.07 },
  { y: 0.93, dir: 1, size: 0.088 },
] as const;

/**
 * A car going by in the rain, seen side on through the wet glass and well
 * out of focus: a dark shape against the lit street, its headlights a soft
 * glow that throws a long, faint beam far ahead along the road, its tail
 * lights a red haze trailing behind, and both shining back up off the wet
 * road. Rendered once per lane, smeared along its way as if moving fast,
 * and slid across each frame. Its speed trail, fainter and fainter copies
 * of it and its lamps falling away behind, is a sprite of its own, so each
 * car can draw it out as long as its speed. `len` is the car's length; it faces right, or
 * left with `dir` -1. In the sprite, the road is at `road` and the car's
 * middle at `mid`.
 */
function carSprite(len: number, dir: number, dpr: number) {
  const w = len * 5.4;
  const h = len * 0.8;
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * dpr);
  c.height = Math.ceil(h * dpr);
  const trailCanvas = document.createElement("canvas");
  trailCanvas.width = c.width;
  trailCanvas.height = c.height;
  // Room behind for the trail, and more ahead for the beam.
  const mid = len * 2.3;
  const road = h * 0.62;
  const setUp = (into: HTMLCanvasElement) => {
    const ctx = into.getContext("2d")!;
    ctx.scale(dpr, dpr);
    if (dir < 0) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    // Well out of focus.
    ctx.filter = `blur(${Math.max(3, len * 0.1)}px)`;
    return ctx;
  };
  let g = setUp(trailCanvas);
  const front = mid + len * 0.5;
  const rear = mid - len * 0.5;
  const lampY = road - len * 0.17;
  /** A long soft streak of light along the road from `x0` to `x1`. */
  const streak = (x0: number, x1: number, y: number, height: number, rgb: string, a: number) => {
    const fade = g.createLinearGradient(x0, 0, x1, 0);
    fade.addColorStop(0, `rgba(${rgb},${a})`);
    fade.addColorStop(0.35, `rgba(${rgb},${a * 0.45})`);
    fade.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = fade;
    g.beginPath();
    g.ellipse((x0 + x1) / 2, y, Math.abs(x1 - x0) / 2, height / 2, 0, 0, Math.PI * 2);
    g.fill();
  };
  const glow = (x: number, y: number, r: number, rgb: string, a: number) => {
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, `rgba(${rgb},${a})`);
    grad.addColorStop(0.4, `rgba(${rgb},${a * 0.35})`);
    grad.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = grad;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  };
  // Body and cabin, dark, the roof catching the street lamps.
  const body = () => {
    g.fillStyle = "#0b0d18";
    g.beginPath();
    g.roundRect(rear, road - len * 0.26, len, len * 0.2, len * 0.05);
    g.fill();
    g.beginPath();
    g.moveTo(mid - len * 0.3, road - len * 0.25);
    g.lineTo(mid - len * 0.18, road - len * 0.4);
    g.lineTo(mid + len * 0.12, road - len * 0.4);
    g.lineTo(mid + len * 0.28, road - len * 0.25);
    g.fill();
    g.fillStyle = "rgba(255,200,150,0.14)";
    g.fillRect(mid - len * 0.18, road - len * 0.41, len * 0.3, len * 0.02);
    g.fillStyle = "rgba(120,140,190,0.14)";
    g.beginPath();
    g.moveTo(mid - len * 0.26, road - len * 0.26);
    g.lineTo(mid - len * 0.16, road - len * 0.37);
    g.lineTo(mid + len * 0.1, road - len * 0.37);
    g.lineTo(mid + len * 0.23, road - len * 0.26);
    g.fill();
    g.fillStyle = "#05060c";
    for (const wx of [-0.3, 0.3]) {
      g.beginPath();
      g.arc(mid + wx * len, road - len * 0.06, len * 0.075, 0, Math.PI * 2);
      g.fill();
    }
  };
  const draw = () => {
    // The beam, reaching two and a half car lengths on down the road, and
    // the red haze behind.
    streak(front - len * 0.1, front + len * 2.6, road - len * 0.08, len * 0.22, "255,236,205", 0.16);
    streak(rear + len * 0.1, rear - len * 0.9, road - len * 0.12, len * 0.2, "255,60,50", 0.14);
    body();
    // The lamps themselves: soft, not glaring.
    glow(front, lampY, len * 0.12, "255,240,215", 0.55);
    glow(rear, lampY, len * 0.09, "255,60,50", 0.5);
    // Their reflections, drawn out down the wet road.
    for (const [x, rgb, a] of [
      [front, "255,236,205", 0.18],
      [rear, "255,60,50", 0.16],
    ] as const) {
      const shine = g.createLinearGradient(0, road, 0, road + len * 0.28);
      shine.addColorStop(0, `rgba(${rgb},${a})`);
      shine.addColorStop(1, `rgba(${rgb},0)`);
      g.fillStyle = shine;
      g.fillRect(x - len * 0.05, road, len * 0.1, len * 0.28);
    }
  };
  // The trail: fainter and fainter copies of the car falling away behind
  // it, a car length and a half at an ordinary speed, its lamps drawn out
  // into streaks.
  const trail = 14;
  for (let i = trail; i >= 1; i--) {
    const k = i / trail;
    g.save();
    g.translate(-k * len * 1.4, 0);
    g.globalAlpha = 0.2 * (1 - k) ** 1.5;
    body();
    g.globalAlpha = 0.5 * (1 - k) ** 1.2;
    glow(front, lampY, len * 0.1, "255,240,215", 0.4);
    glow(rear, lampY, len * 0.08, "255,60,50", 0.45);
    g.restore();
  }
  // The car, smeared along its way: drawn over itself a little further on
  // each time.
  g = setUp(c);
  const smear = 8;
  g.globalAlpha = 1 / 2.6;
  for (let i = 0; i < smear; i++) {
    g.save();
    g.translate((i / (smear - 1) - 0.5) * len * 0.3, 0);
    draw();
    g.restore();
  }
  return { canvas: c, trail: trailCanvas, w, h, mid: dir < 0 ? w - mid : mid, road };
}

/** A soft round glow, rendered once and stamped for each bulb. */
function glowSprite(radius: number, rgb: string) {
  const c = document.createElement("canvas");
  c.width = c.height = Math.ceil(radius * 2);
  const g = c.getContext("2d")!;
  const grad = g.createRadialGradient(radius, radius, 0, radius, radius, radius);
  grad.addColorStop(0, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.2, `rgba(${rgb},0.4)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

const CafeScene = () => {
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
      const rand = seeded(5);
      const { win } = l;

      const rain = Array.from({ length: Math.round((win.w * win.h) / 5000) }, () => ({
        x: win.x + rand() * win.w,
        y: win.y + rand() * win.h,
        len: lerp(8, 16, rand()),
        speed: lerp(500, 800, rand()),
      }));

      const beads = Array.from({ length: Math.round((win.w * win.h) / 4500) }, () => ({
        x: win.x + rand() * win.w,
        y: win.y + rand() * win.h,
        r: lerp(0.8, 2.4, rand()),
      }));

      const runs = Array.from({ length: 6 }, () => ({
        x: win.x + rand() * win.w,
        y: win.y + rand() * win.h,
        r: lerp(2.2, 3.4, rand()),
        speed: lerp(25, 70, rand()),
        wobble: rand() * Math.PI * 2,
      }));

      // String lights draped across the top of the window, in three swags.
      const bulbs: { x: number; y: number; phase: number; rate: number }[] = [];
      const swags = 3;
      const count = Math.round(win.w / 34);
      for (let i = 0; i <= count; i++) {
        const u = i / count;
        const swag = (u * swags) % 1;
        bulbs.push({
          x: win.x + u * win.w,
          y: win.y + 6 + Math.sin(swag * Math.PI) * Math.min(28, win.h * 0.07),
          phase: rand() * Math.PI * 2,
          rate: lerp(0.8, 2.2, rand()),
        });
      }
      const bulbGlow = glowSprite(14, "255,200,120");

      const steam = Array.from({ length: 22 }, () => ({ age: rand() * 4, seed: rand() * 10 }));

      // Cars swishing by on the street outside, now and then, in either
      // lane. Seen only through the panes, so the frame and the mullion
      // stay in front of them.
      const dpr = cappedDpr(1.5);
      const lanes = LANES.map((lane) => {
        const len = win.w * lane.size;
        return { ...lane, sprite: carSprite(len, lane.dir, dpr), wait: lerp(0.5, 5, rand()) };
      });
      const cars: { lane: (typeof lanes)[number]; x: number; speed: number; trail: number }[] = [];
      /** An ordinary speed, at which a trail is as long as it was drawn. */
      const cruise = win.w * 0.55;
      const edge = Math.max(10, win.w * 0.018) / 2;
      const bar = Math.max(4, win.w * 0.008) / 2;
      const paneW = win.w / 2 - bar - edge;
      const panes = new Path2D();
      panes.rect(win.x + edge, win.y + edge, paneW, win.h - edge * 2);
      panes.rect(win.x + win.w / 2 + bar, win.y + edge, paneW, win.h - edge * 2);

      // The candle's flame and its glow, drawn once and stamped each frame.
      const fs = l.cup.s;
      const flame = document.createElement("canvas");
      flame.width = Math.ceil(10 * fs);
      flame.height = Math.ceil(20 * fs);
      {
        const g = flame.getContext("2d")!;
        const fw = flame.width;
        const fh = flame.height;
        const grad = g.createLinearGradient(0, fh, 0, 0);
        grad.addColorStop(0, "#ff9a3c");
        grad.addColorStop(0.45, "#ffd27a");
        grad.addColorStop(1, "#fff6d8");
        g.fillStyle = grad;
        g.beginPath();
        g.moveTo(fw / 2, 0);
        g.quadraticCurveTo(fw, fh * 0.62, fw / 2, fh);
        g.quadraticCurveTo(0, fh * 0.62, fw / 2, 0);
        g.fill();
      }
      const candleGlow = glowSprite(46 * fs, "255,180,100");

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);

        // The cars, behind the rain. Sometimes one comes close behind
        // another, mostly there's a good gap.
        for (const lane of lanes) {
          lane.wait -= dt;
          if (lane.wait > 0) continue;
          lane.wait = Math.random() < 0.25 ? lerp(0.6, 1.4, Math.random()) : lerp(3, 9, Math.random());
          // Starting just out of sight, beam and all.
          const { w: sw, mid } = lane.sprite;
          const speed = win.w * lerp(0.35, 0.85, Math.random());
          cars.push({
            lane,
            x: lane.dir > 0 ? win.x - (sw - mid) : win.x + win.w + mid,
            speed,
            trail: (speed / cruise) ** 1.5,
          });
        }
        ctx.save();
        ctx.clip(panes);
        for (let i = cars.length - 1; i >= 0; i--) {
          const car = cars[i];
          car.x += car.lane.dir * car.speed * dt;
          if (car.x < win.x - car.lane.sprite.w || car.x > win.x + win.w + car.lane.sprite.w) cars.splice(i, 1);
        }
        // The far lane first, so a near car passes in front of a far one.
        for (const lane of lanes) {
          for (const car of cars) {
            if (car.lane !== lane) continue;
            const { sprite, y } = lane;
            const top = win.y + win.h * y - sprite.road;
            // The trail drawn out from the car's middle, longer the faster
            // it goes.
            const tw = sprite.w * car.trail;
            ctx.drawImage(sprite.trail, car.x - sprite.mid * car.trail, top, tw, sprite.h);
            ctx.drawImage(sprite.canvas, car.x - sprite.mid, top, sprite.w, sprite.h);
          }
        }
        ctx.restore();

        // Everything outside, and on, the glass.
        ctx.save();
        ctx.beginPath();
        ctx.rect(win.x, win.y, win.w, win.h);
        ctx.clip();

        ctx.strokeStyle = "rgba(170,200,240,0.28)";
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

        ctx.fillStyle = "rgba(220,230,255,0.15)";
        ctx.beginPath();
        for (const b of beads) {
          ctx.moveTo(b.x + b.r, b.y);
          ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.fillStyle = "rgba(255,240,220,0.3)";
        for (const b of beads) ctx.fillRect(b.x - b.r * 0.4, b.y - b.r * 0.5, 1, 1);

        for (const r of runs) {
          r.y += r.speed * dt;
          if (r.y > win.y + win.h + 10) {
            r.y = win.y - 10;
            r.x = win.x + Math.random() * win.w;
          }
          const x = r.x + Math.sin(r.y * 0.04 + r.wobble) * 2;
          // A faint wet trail above the drop.
          const trail = ctx.createLinearGradient(0, r.y - 60, 0, r.y);
          trail.addColorStop(0, "rgba(220,230,255,0)");
          trail.addColorStop(1, "rgba(220,230,255,0.16)");
          ctx.fillStyle = trail;
          ctx.fillRect(x - r.r * 0.4, r.y - 60, r.r * 0.8, 60);
          ctx.fillStyle = "rgba(225,235,255,0.4)";
          ctx.beginPath();
          ctx.ellipse(x, r.y, r.r, r.r * 1.25, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(255,240,220,0.7)";
          ctx.fillRect(x - r.r * 0.4, r.y - r.r * 0.5, 1.2, 1.2);
        }
        ctx.restore();

        // String lights.
        ctx.strokeStyle = "rgba(20,12,8,0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        bulbs.forEach((bulb, i) => (i ? ctx.lineTo(bulb.x, bulb.y) : ctx.moveTo(bulb.x, bulb.y)));
        ctx.stroke();
        for (const bulb of bulbs) {
          ctx.globalAlpha = 0.65 + Math.sin(t * bulb.rate + bulb.phase) * 0.3;
          ctx.drawImage(bulbGlow, bulb.x - 14, bulb.y - 10);
          ctx.globalAlpha = 1;
          ctx.fillStyle = "#ffe0a8";
          ctx.fillRect(bulb.x - 1.5, bulb.y + 2, 3, 4);
        }

        // Lamp glow, breathing very slightly.
        for (const [i, lamp] of l.lamps.entries()) {
          const flicker = 0.92 + Math.sin(t * 3.1 + i * 2) * 0.03 + Math.sin(t * 7.3 + i) * 0.02;
          const r = Math.max(w, h) * 0.38;
          const cy = lamp.y + lamp.r * 0.7;
          const g = ctx.createRadialGradient(lamp.x, cy, 0, lamp.x, cy, r);
          g.addColorStop(0, `rgba(255,190,110,${0.32 * flicker})`);
          g.addColorStop(0.35, `rgba(255,170,90,${0.1 * flicker})`);
          g.addColorStop(1, "rgba(255,170,90,0)");
          ctx.fillStyle = g;
          ctx.fillRect(lamp.x - r, cy - r, r * 2, r * 2);
        }

        // The candle flickering in its glass.
        {
          const fx = l.deco.candle.x;
          const fy = l.deco.candle.y - 27 * fs;
          const flick = 1 + Math.sin(t * 9.1) * 0.06 + Math.sin(t * 13.7) * 0.05;
          ctx.globalAlpha = 0.32 * flick;
          ctx.drawImage(candleGlow, fx - candleGlow.width / 2, fy - candleGlow.height / 2);
          ctx.globalAlpha = 1;
          const fw = flame.width * (2 - flick);
          const fh = flame.height * flick;
          ctx.drawImage(flame, fx - fw / 2 + Math.sin(t * 5.3) * 0.6 * fs, fy - fh, fw, fh);
        }

        // Steam off the cup.
        const { x: cx, y: cy, s } = l.cup;
        for (const p of steam) {
          p.age += dt;
          if (p.age > 4) p.age -= 4;
          const k = p.age / 4;
          const px = cx + Math.sin(p.age * 1.3 + p.seed) * 10 * s * (0.3 + k);
          const py = cy - 44 * s - k * 110 * s;
          const pr = (4 + k * 14) * s;
          const a = Math.sin(k * Math.PI) * 0.12;
          const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
          g.addColorStop(0, `rgba(255,245,235,${a})`);
          g.addColorStop(1, "rgba(255,245,235,0)");
          ctx.fillStyle = g;
          ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);
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
      <canvas ref={frontRef} className="absolute inset-0 h-full w-full" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,transparent_35%,rgb(8_4_2/0.6)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default CafeScene;
