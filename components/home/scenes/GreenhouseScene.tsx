"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * Inside an old glasshouse on a rainy afternoon, looking down the aisle. Two
 * canvases:
 *
 *  back  — the misted garden outside, the white iron frame and its glazing
 *          bars, the staging and its pots, hanging baskets, a string of bulbs,
 *          and palms leaning in at the edges. Drawn once.
 *  front — rain on the glass: beads, and runs that gather them, kept to the
 *          glass by a mask of everything in front of it; drips falling from
 *          the roof; the bulbs' glow, breathing.
 */

// ----------------------------------------------------------------- frame

/** The view down the aisle: one-point perspective onto the vanishing point. */
interface View {
  w: number;
  h: number;
  cx: number;
  vy: number;
  f: number;
}

// The glasshouse in world units: eye at height 0, walls at x = ±1.
const EAVE = 0.95;
const RIDGE = 1.6;
const FLOOR = -0.95;
const BENCH = -0.36;
/** The staging's inner edge, either side of the aisle. */
const AISLE = 0.42;
const Z_NEAR = 0.6;
const Z_FAR = 6.5;
/** The main frames, near to far. */
const RAFTERS = [1.25, 1.95, 2.85, 3.95, 5.2];

function view(w: number, h: number): View {
  const portrait = w < h;
  // On a phone, the eye a little lower and the walls further off, so the
  // roof fills the tall screen rather than the floor.
  return { w, h, cx: w * 0.5, vy: h * (portrait ? 0.56 : 0.5), f: portrait ? h * 0.34 : Math.max(w * 0.5, h * 0.62) };
}

const at = (v: View, x: number, y: number, z: number): [number, number] => [v.cx + (x * v.f) / z, v.vy - (y * v.f) / z];

/** The roof's height at x across the house. */
const roofY = (x: number) => EAVE + (1 - Math.abs(x)) * (RIDGE - EAVE);

/** The house's cross-section: up one wall, over the ridge, down the other. */
const PROFILE: [number, number][] = [
  [-1, BENCH],
  [-1, EAVE],
  [0, RIDGE],
  [1, EAVE],
  [1, BENCH],
];

function profile(ctx: CanvasRenderingContext2D, v: View, z: number) {
  ctx.beginPath();
  PROFILE.forEach(([x, y], i) => {
    const [px, py] = at(v, x, y, z);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
}

/** A beam running the length of the house, tapering into the distance. */
function beam(ctx: CanvasRenderingContext2D, v: View, x: number, y: number, size: number, color: string) {
  const a = at(v, x, y + size / 2, Z_NEAR);
  const b = at(v, x, y + size / 2, Z_FAR);
  const c = at(v, x, y - size / 2, Z_FAR);
  const d = at(v, x, y - size / 2, Z_NEAR);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(...a);
  ctx.lineTo(...b);
  ctx.lineTo(...c);
  ctx.lineTo(...d);
  ctx.fill();
}

// --------------------------------------------------------------- outside

/** Where the lawn outside begins, and where its puddles lie, as fractions of
 *  the screen. */
const LAWN = 0.62;

function puddles(w: number, h: number) {
  const rand = seeded(59);
  return Array.from({ length: 7 }, () => ({
    x: rand() * w,
    y: h * lerp(LAWN + 0.03, 0.86, rand()),
    rx: Math.max(w, 600) * lerp(0.04, 0.09, rand()),
    ry: h * lerp(0.008, 0.016, rand()),
  }));
}

/** The garden beyond the glass: a soft blue sky in a sun shower, the trees
 *  and the lawn beyond, all gone soft through the misted glass. */
function drawOutside(ctx: CanvasRenderingContext2D, v: View) {
  const { w, h } = v;
  const sky = ctx.createLinearGradient(0, 0, 0, h * LAWN);
  sky.addColorStop(0, "#5f8db8");
  sky.addColorStop(0.5, "#8fb5d4");
  sky.addColorStop(1, "#c3d8e2");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  // The sun, somewhere up behind the shower.
  const sun = ctx.createRadialGradient(w * 0.7, h * 0.12, 0, w * 0.7, h * 0.12, Math.max(w, h) * 0.5);
  sun.addColorStop(0, "rgba(255,248,225,0.45)");
  sun.addColorStop(1, "rgba(255,248,225,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.filter = `blur(${Math.max(4, w / 160)}px)`;
  const lawn = ctx.createLinearGradient(0, h * LAWN, 0, h);
  lawn.addColorStop(0, "#6f9c62");
  lawn.addColorStop(1, "#4d7a46");
  ctx.fillStyle = lawn;
  ctx.fillRect(0, h * LAWN, w, h * (1 - LAWN));
  const rand = seeded(41);
  // Two rows of trees round the glasshouse, the far one paler in the haze.
  for (const [base, top, color, size] of [
    [0.56, 0.3, "rgba(104,146,130,0.7)", 0.09],
    [0.63, 0.38, "rgba(56,98,66,0.88)", 0.13],
  ] as const) {
    for (let x = -w * 0.05; x < w * 1.05; x += Math.max(w, 600) * size * lerp(0.5, 0.9, rand())) {
      const r = Math.max(w, 600) * size * lerp(0.6, 1.1, rand());
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(x, h * lerp(top, base, rand()), r, r * lerp(1, 1.6, rand()), 0, 0, Math.PI * 2);
      ctx.ellipse(x, h * base, r * 0.9, h * 0.02, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Puddles on the lawn, holding the sky.
  ctx.fillStyle = "rgba(190,214,232,0.6)";
  for (const p of puddles(w, h)) {
    ctx.beginPath();
    ctx.ellipse(p.x, p.y, p.rx, p.ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Mist on the glass, thickest low down where the warm air meets it.
  const mist = ctx.createLinearGradient(0, 0, 0, h);
  mist.addColorStop(0, "rgba(225,236,244,0.06)");
  mist.addColorStop(0.5, "rgba(228,238,244,0.18)");
  mist.addColorStop(1, "rgba(228,238,240,0.1)");
  ctx.fillStyle = mist;
  ctx.fillRect(0, 0, w, h);
}

// ---------------------------------------------------------------- plants

const GREENS = ["#1d3a25", "#27502f", "#34683a", "#4a8446", "#6a9e52"];

/** A leaf from its stem end, `len` long, pointing along `angle`. */
function leaf(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, width: number, angle: number) {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const tx = x + dx * len;
  const ty = y + dy * len;
  const nx = -dy * width;
  const ny = dx * width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + dx * len * 0.5 + nx, y + dy * len * 0.5 + ny, tx, ty);
  ctx.quadraticCurveTo(x + dx * len * 0.5 - nx, y + dy * len * 0.5 - ny, x, y);
  ctx.fill();
}

/**
 * A frond: a stem arching from (x, y) along `angle`, bending by `droop` as it
 * goes, with leaflets either side that shrink toward the tip. Long thin
 * leaflets make a palm; short ones close together, a fern.
 */
function frond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  len: number,
  angle: number,
  droop: number,
  leaflet: number,
  count: number,
  color: string,
  /** How broad each leaflet is, for its length. */
  breadth = 0.18,
) {
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(0.6, len * 0.012);
  const point = (t: number): [number, number, number] => {
    const a = angle + droop * t;
    // Integrate the bend roughly: the angle eases from start to end.
    const ax = angle + droop * t * 0.5;
    return [x + Math.cos(ax) * len * t, y + Math.sin(ax) * len * t, a];
  };
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let t = 0.1; t <= 1.001; t += 0.1) ctx.lineTo(...(point(t).slice(0, 2) as [number, number]));
  ctx.stroke();
  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const [px, py, a] = point(t);
    const size = leaflet * len * (1 - t * 0.7);
    for (const side of [-1, 1]) leaf(ctx, px, py, size, size * breadth, a + side * 1.0 + droop * 0.3);
  }
}

/**
 * A pot on the staging and its plant, scaled by `s` (pixels per world unit).
 * The plant grows out of the soil just inside the rim, from several points
 * across it, and the rim is drawn last, over the stems.
 */
function potted(ctx: CanvasRenderingContext2D, x: number, y: number, s: number, kind: number, rand: () => number) {
  const pw = 0.1 * s;
  const ph = 0.09 * s;
  const top = y - ph;
  ctx.fillStyle = "#8a5236";
  ctx.beginPath();
  ctx.moveTo(x - pw / 2, top);
  ctx.lineTo(x + pw / 2, top);
  ctx.lineTo(x + pw * 0.38, y);
  ctx.lineTo(x - pw * 0.38, y);
  ctx.fill();
  ctx.fillStyle = "#2e2118";
  ctx.beginPath();
  ctx.ellipse(x, top + ph * 0.04, pw * 0.48, ph * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  const soil = top + ph * 0.1;
  const base = () => x + (rand() - 0.5) * pw * 0.7;
  const green = () => GREENS[1 + Math.floor(rand() * 4)];
  if (kind === 0) {
    // A fern, its fronds arching out all round.
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + lerp(-1.2, 1.2, i / 8) + (rand() - 0.5) * 0.2;
      frond(ctx, base(), soil, s * lerp(0.17, 0.26, rand()), a, (a > -Math.PI / 2 ? 1 : -1) * 0.9, 0.22, 9, green());
    }
  } else if (kind === 1) {
    // A small palm, a few long fronds up from a clump.
    for (let i = 0; i < 6; i++) {
      const a = -Math.PI / 2 + lerp(-0.8, 0.8, i / 5) + (rand() - 0.5) * 0.2;
      frond(ctx, base(), soil, s * lerp(0.28, 0.4, rand()), a, (a > -Math.PI / 2 ? 1 : -1) * 0.7, 0.32, 8, green());
    }
  } else {
    // A leafy plant: broad leaves on short stalks, fanning up and out.
    ctx.strokeStyle = "#2f5a35";
    ctx.lineWidth = Math.max(0.6, s * 0.005);
    ctx.lineCap = "round";
    for (let i = 0; i < 11; i++) {
      const bx = base();
      const a = -Math.PI / 2 + lerp(-1.05, 1.05, i / 10) + (rand() - 0.5) * 0.25;
      // The stalk rises more steeply than its leaf leans.
      const stalk = s * lerp(0.025, 0.05, rand());
      const sa = -Math.PI / 2 + (a + Math.PI / 2) * 0.55;
      const px = bx + Math.cos(sa) * stalk;
      const py = soil + Math.sin(sa) * stalk;
      ctx.beginPath();
      ctx.moveTo(bx, soil);
      ctx.lineTo(px, py);
      ctx.stroke();
      ctx.fillStyle = green();
      leaf(ctx, px, py, s * lerp(0.07, 0.11, rand()), s * 0.028, a);
    }
    if (kind === 3) {
      ctx.fillStyle = rand() < 0.5 ? "#d9584a" : "#e88aa6";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(x + (rand() - 0.5) * pw * 1.6, soil - s * lerp(0.07, 0.13, rand()), s * 0.012, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // The rim, over the stems where they leave the soil.
  ctx.fillStyle = "#a3633f";
  ctx.fillRect(x - pw * 0.55, top, pw * 1.1, ph * 0.24);
  ctx.fillStyle = "rgba(255,220,180,0.18)";
  ctx.fillRect(x - pw * 0.55, top, pw * 1.1, ph * 0.06);
}

/** A trailing strand hanging from (x, y), small leaves all down it. */
function trail(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, s: number, rand: () => number) {
  const sway = (rand() - 0.5) * s * 0.08;
  ctx.strokeStyle = "#2b4a2c";
  ctx.lineWidth = Math.max(0.5, s * 0.003);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + sway, y + len * 0.5, x + sway * 0.5, y + len);
  ctx.stroke();
  for (let t = 0.08; t < 1; t += 0.09) {
    ctx.fillStyle = GREENS[1 + Math.floor(rand() * 3)];
    const lx = x + sway * (t < 0.5 ? t : 0.5 + (t - 0.5)) + (rand() - 0.5) * s * 0.02;
    ctx.beginPath();
    ctx.ellipse(lx, y + len * t, s * 0.016, s * 0.011, rand() * 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

const MOSS = ["#35592e", "#3f6b35", "#4f7f3c", "#5f8f42"];

/** A cushion of moss: a few soft tufts clustered round (x, y). */
function moss(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rand: () => number) {
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = MOSS[Math.floor(rand() * MOSS.length)];
    ctx.beginPath();
    ctx.ellipse(
      x + (rand() - 0.5) * r * 2,
      y + (rand() - 0.5) * r * 0.8,
      r * lerp(0.35, 0.7, rand()),
      r * lerp(0.25, 0.5, rand()),
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

/**
 * A basket hung from the roof: a deep round bowl on three cords, its plant
 * growing out of the soil inside the rim and trailing over it, some strands
 * spilling down in front of the bowl.
 */
function basket(ctx: CanvasRenderingContext2D, v: View, x: number, z: number, rand: () => number) {
  const s = v.f / z;
  const [hx, hy] = at(v, x, roofY(x), z);
  const [bx, by] = at(v, x, 0.5, z);
  const r = s * 0.1;
  const ry = r * 0.28;
  const depth = r * 0.95;

  // The cords, to the rim's sides and its back.
  ctx.strokeStyle = "rgba(40,48,42,0.8)";
  ctx.lineWidth = Math.max(0.6, s * 0.004);
  ctx.beginPath();
  for (const [dx, dy] of [
    [-r, 0],
    [0, -ry],
    [r, 0],
  ]) {
    ctx.moveTo(hx, hy);
    ctx.lineTo(bx + dx, by + dy);
  }
  ctx.stroke();

  // The soil inside, and the rim behind it.
  ctx.fillStyle = "#2e2118";
  ctx.beginPath();
  ctx.ellipse(bx, by, r, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  const rim = Math.max(0.8, r * 0.1);
  ctx.strokeStyle = "#7a5c3e";
  ctx.lineWidth = rim;
  ctx.beginPath();
  ctx.ellipse(bx, by, r, ry, 0, Math.PI, Math.PI * 2);
  ctx.stroke();

  // The leafy top, from points across the soil.
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = GREENS[1 + Math.floor(rand() * 4)];
    const lx = bx + (rand() - 0.5) * r * 1.4;
    const ly = by + (rand() - 0.5) * ry;
    leaf(ctx, lx, ly, s * lerp(0.05, 0.085, rand()), s * 0.022, -Math.PI / 2 + lerp(-1.3, 1.3, i / 11) + (rand() - 0.5) * 0.3);
  }

  // The bowl, lit from the bulbs on one side, and its front rim.
  const body = ctx.createLinearGradient(bx - r, by, bx + r, by + depth);
  body.addColorStop(0, "#6e5640");
  body.addColorStop(1, "#33271c");
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.ellipse(bx, by, r, depth, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = "#9a7a54";
  ctx.lineWidth = rim;
  ctx.beginPath();
  ctx.ellipse(bx, by, r, ry, 0, 0, Math.PI);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,226,180,0.35)";
  ctx.lineWidth = rim * 0.4;
  ctx.beginPath();
  ctx.ellipse(bx, by - rim * 0.3, r, ry, 0, Math.PI * 0.15, Math.PI * 0.65);
  ctx.stroke();

  // Vines from inside, over the front of the rim, and down past the bowl.
  for (let i = 0; i < 9; i++) {
    const t = (i + 0.5) / 9;
    const a = Math.PI * lerp(0.05, 0.95, t);
    const lipX = bx + Math.cos(a) * r * 0.95;
    const lipY = by + Math.sin(a) * ry;
    ctx.strokeStyle = "#2b4a2c";
    ctx.lineWidth = Math.max(0.5, s * 0.003);
    ctx.beginPath();
    ctx.moveTo(bx + (lipX - bx) * 0.4, by - ry * 0.3);
    ctx.quadraticCurveTo(lipX, lipY - ry * 0.8, lipX, lipY + rim);
    ctx.stroke();
    ctx.fillStyle = GREENS[2 + Math.floor(rand() * 3)];
    leaf(ctx, lipX, lipY, s * 0.03, s * 0.012, Math.PI / 2 + (lipX - bx) / r);
    trail(ctx, lipX, lipY + rim, s * lerp(0.2, 0.55, rand()), s, rand);
  }
}

// -------------------------------------------------------------- interior

interface Bulb {
  x: number;
  y: number;
  r: number;
}

/** A string of bulbs slung across the house at depth z, sagging in the middle. */
function bulbString(v: View, z: number, count: number): { wire: [number, number][]; bulbs: Bulb[] } {
  const wire: [number, number][] = [];
  const bulbs: Bulb[] = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    const x = lerp(-1, 1, t);
    wire.push(at(v, x, EAVE - 0.05 - Math.sin(t * Math.PI) * 0.28, z));
  }
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const [x, y] = at(v, lerp(-1, 1, t), EAVE - 0.05 - Math.sin(t * Math.PI) * 0.28, z);
    bulbs.push({ x, y: y + (0.03 * v.f) / z, r: Math.max(1.4, (0.016 * v.f) / z) });
  }
  return { wire, bulbs };
}

const STRINGS = [1.6, 3.4];

/**
 * Everything in front of the glass, near to far reversed: the frame, the
 * floor and staging, the pots, the baskets, the bulbs, the palms leaning in.
 * Drawn once for the scene, and once more, as `mask`, to cut it all out of
 * the layer the rain on the glass is kept to.
 */
function drawInterior(ctx: CanvasRenderingContext2D, v: View, mask: boolean) {
  const { w, h } = v;
  const rand = seeded(73);

  // The glazing bars: thin, every pane's width down the house.
  ctx.lineCap = "round";
  for (let z = Z_NEAR + 0.15; z < Z_FAR; z += 0.32) {
    ctx.strokeStyle = "rgba(196,210,202,0.5)";
    ctx.lineWidth = Math.max(0.6, (0.01 * v.f) / z);
    profile(ctx, v, z);
    ctx.stroke();
  }
  // The beams along it: ridge, purlins, eaves, and a rail at the sill.
  const frame = "#cfd9d2";
  beam(ctx, v, 0, RIDGE, 0.05, frame);
  for (const side of [-1, 1]) {
    for (const t of [1 / 3, 2 / 3]) beam(ctx, v, side * (1 - t), roofY(1 - t), 0.03, frame);
    beam(ctx, v, side, EAVE, 0.05, frame);
    beam(ctx, v, side, 0.3, 0.025, frame);
    beam(ctx, v, side, BENCH + 0.02, 0.04, frame);
  }

  // The far end: glass too, with a door.
  ctx.strokeStyle = frame;
  ctx.lineWidth = Math.max(1, (0.035 * v.f) / Z_FAR);
  profile(ctx, v, Z_FAR);
  ctx.stroke();
  ctx.beginPath();
  for (const x of [-0.66, -0.33, 0.33, 0.66]) {
    ctx.moveTo(...at(v, x, FLOOR, Z_FAR));
    ctx.lineTo(...at(v, x, roofY(x), Z_FAR));
  }
  ctx.moveTo(...at(v, -1, 0.4, Z_FAR));
  ctx.lineTo(...at(v, 1, 0.4, Z_FAR));
  ctx.stroke();
  ctx.fillStyle = mask ? "#000" : "rgba(60,80,68,0.55)";
  const [dl, dt] = at(v, -0.24, 0.35, Z_FAR);
  const [dr, db] = at(v, 0.24, FLOOR, Z_FAR);
  ctx.fillRect(dl, dt, dr - dl, db - dt);
  ctx.strokeRect(dl, dt, dr - dl, db - dt);

  // The main frames, each with curved iron brackets at the eaves.
  for (const z of [...RAFTERS].reverse()) {
    const width = (0.04 * v.f) / z;
    ctx.lineWidth = width;
    ctx.strokeStyle = frame;
    profile(ctx, v, z);
    ctx.stroke();
    ctx.lineWidth = width * 0.6;
    ctx.beginPath();
    for (const side of [-1, 1]) {
      ctx.moveTo(...at(v, side, EAVE - 0.32, z));
      const [qx, qy] = at(v, side, EAVE, z);
      ctx.quadraticCurveTo(qx, qy, ...at(v, side * 0.68, roofY(0.68), z));
    }
    ctx.stroke();
    // Its shaded underside.
    ctx.strokeStyle = "rgba(30,48,40,0.35)";
    ctx.lineWidth = width * 0.35;
    ctx.save();
    ctx.translate(0, width * 0.4);
    profile(ctx, v, z);
    ctx.stroke();
    ctx.restore();
  }

  // The floor down the aisle: old boards, wet and catching the sky, gone
  // green between.
  const floor = [at(v, -AISLE, FLOOR, Z_NEAR), at(v, -AISLE, FLOOR, Z_FAR), at(v, AISLE, FLOOR, Z_FAR), at(v, AISLE, FLOOR, Z_NEAR)];
  const fg = ctx.createLinearGradient(0, v.vy, 0, h);
  fg.addColorStop(0, "#5a6152");
  fg.addColorStop(1, "#272c22");
  ctx.fillStyle = fg;
  ctx.beginPath();
  floor.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
  ctx.fill();
  if (!mask) {
    ctx.strokeStyle = "rgba(20,16,12,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let z = Z_NEAR; z < Z_FAR; z += 0.22) {
      ctx.moveTo(...at(v, -AISLE, FLOOR, z));
      ctx.lineTo(...at(v, AISLE, FLOOR, z));
    }
    ctx.stroke();
    // The wet sheen down the middle, where the light from the far end lies.
    const sheen = ctx.createLinearGradient(...at(v, -AISLE, FLOOR, 2), ...at(v, AISLE, FLOOR, 2));
    sheen.addColorStop(0, "rgba(200,220,230,0)");
    sheen.addColorStop(0.5, "rgba(200,220,230,0.16)");
    sheen.addColorStop(1, "rgba(200,220,230,0)");
    ctx.fillStyle = sheen;
    ctx.beginPath();
    floor.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.fill();
  }
  // Moss in the joints between the boards, in runs, and thick along the
  // edges of the aisle where nobody treads.
  ctx.lineCap = "round";
  for (let z = Z_NEAR; z < Z_FAR; z += 0.22) {
    const from = lerp(-AISLE, AISLE * 0.6, rand());
    const to = Math.min(AISLE, from + lerp(0.1, 0.5, rand()));
    ctx.strokeStyle = MOSS[Math.floor(rand() * MOSS.length)];
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = Math.max(0.8, (0.008 * v.f) / z);
    ctx.beginPath();
    ctx.moveTo(...at(v, from, FLOOR, z));
    ctx.lineTo(...at(v, to, FLOOR, z));
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  for (const side of [-1, 1]) {
    for (let z = Z_FAR - 0.1; z > 0.9; z -= 0.12) {
      const [x, y] = at(v, side * lerp(AISLE * 0.8, AISLE, rand()), FLOOR, z);
      moss(ctx, x, y, (0.035 * v.f) / z, rand);
    }
  }

  // The staging down each side: its underside, its top and edge, all gone
  // over to moss, with ferns at its foot and trailing plants over its edge.
  for (const side of [-1, 1]) {
    const quad = (pts: [number, number][], color: string) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
      ctx.fill();
    };
    quad([at(v, side * AISLE, BENCH, Z_NEAR), at(v, side * AISLE, BENCH, Z_FAR), at(v, side * AISLE, FLOOR, Z_FAR), at(v, side * AISLE, FLOOR, Z_NEAR)], "#16261b");
    quad([at(v, side * AISLE, BENCH, Z_NEAR), at(v, side * AISLE, BENCH, Z_FAR), at(v, side, BENCH, Z_FAR), at(v, side, BENCH, Z_NEAR)], "#3d4a33");
    quad(
      [at(v, side * AISLE, BENCH, Z_NEAR), at(v, side * AISLE, BENCH, Z_FAR), at(v, side * AISLE, BENCH - 0.07, Z_FAR), at(v, side * AISLE, BENCH - 0.07, Z_NEAR)],
      "#5e5640",
    );
    ctx.strokeStyle = "#202418";
    for (let z = 1; z < Z_FAR; z += 0.9) {
      ctx.lineWidth = (0.03 * v.f) / z;
      ctx.beginPath();
      ctx.moveTo(...at(v, side * AISLE * 1.08, BENCH - 0.07, z));
      ctx.lineTo(...at(v, side * AISLE * 1.08, FLOOR, z));
      ctx.stroke();
      // Moss climbing the leg from the floor.
      for (let k = 0; k < 3; k++) {
        const [x, y] = at(v, side * AISLE * 1.08, lerp(FLOOR, FLOOR + 0.3, rand()), z);
        moss(ctx, x, y, (0.025 * v.f) / z, rand);
      }
    }
    // Moss along the edge board, and patches down the face.
    for (let z = Z_FAR - 0.1; z > 0.9; z -= 0.14) {
      const [x, y] = at(v, side * AISLE, BENCH - lerp(0, 0.06, rand()), z);
      moss(ctx, x, y, (0.035 * v.f) / z, rand);
      if (rand() < 0.4) {
        const [fx, fy] = at(v, side * AISLE, lerp(FLOOR + 0.05, BENCH - 0.1, rand()), z);
        moss(ctx, fx, fy, (0.04 * v.f) / z, rand);
      }
    }
    // Ferns at the staging's foot, arching out over the edge of the aisle.
    for (let z = Z_FAR - 0.2; z > 1.5; z -= lerp(0.35, 0.6, rand())) {
      const [x, y] = at(v, side * AISLE * 0.98, FLOOR, z);
      const s = v.f / z;
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 - side * lerp(0.4, 1.3, i / 5) + (rand() - 0.5) * 0.2;
        frond(ctx, x, y, s * lerp(0.1, 0.16, rand()), a, -side * 0.9, 0.24, 9, GREENS[1 + Math.floor(rand() * 4)]);
      }
    }
  }

  // Pots along the staging, far to near, so the near ones stand in front.
  const pots: { x: number; z: number; kind: number }[] = [];
  for (const side of [-1, 1]) {
    for (let z = Z_FAR - 0.25; z > 0.9; z -= lerp(0.18, 0.32, rand())) {
      pots.push({ x: side * lerp(0.5, 0.93, rand()), z, kind: Math.floor(rand() * 4) });
    }
  }
  pots.sort((a, b) => b.z - a.z);
  for (const p of pots) {
    const [x, y] = at(v, p.x, BENCH, p.z);
    if (y > h + 40 || x < -200 || x > w + 200) continue;
    potted(ctx, x, y, v.f / p.z, p.kind, rand);
  }

  // Trailing plants spilling over the staging's edge.
  for (const side of [-1, 1]) {
    for (let z = Z_FAR - 0.3; z > 0.9; z -= lerp(0.25, 0.5, rand())) {
      const [x, y] = at(v, side * AISLE, BENCH, z);
      const s = v.f / z;
      for (let i = 0; i < 4; i++) trail(ctx, x + (rand() - 0.5) * s * 0.1, y, s * lerp(0.15, 0.42, rand()), s, rand);
    }
  }

  // Big pots on the floor, either side of the aisle, far to near.
  for (const z of [4.8, 3.5, 2.4]) {
    for (const side of [-1, 1]) {
      const [x, y] = at(v, side * lerp(0.34, 0.38, rand()), FLOOR, z + (rand() - 0.5) * 0.3);
      potted(ctx, x, y, (v.f / z) * 1.15, 0, rand);
    }
  }

  // Baskets hung from the frames, the nearest big over the top corners.
  for (const z of [...RAFTERS.slice(0, 4)].reverse()) {
    for (const side of [-1, 1]) basket(ctx, v, side * lerp(0.52, 0.66, rand()), z, rand);
  }

  // Bulbs slung across, on their wire.
  for (const z of [...STRINGS].reverse()) {
    const { wire, bulbs } = bulbString(v, z, 9);
    ctx.strokeStyle = "rgba(30,34,30,0.85)";
    ctx.lineWidth = Math.max(0.6, (0.004 * v.f) / z);
    ctx.beginPath();
    wire.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.stroke();
    for (const b of bulbs) {
      if (!mask) {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 7);
        g.addColorStop(0, "rgba(255,200,120,0.35)");
        g.addColorStop(1, "rgba(255,200,120,0)");
        ctx.fillStyle = g;
        ctx.fillRect(b.x - b.r * 7, b.y - b.r * 7, b.r * 14, b.r * 14);
      }
      ctx.fillStyle = "#ffe2a8";
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Palms leaning in at the edges, near enough to be dark against the light,
  // and ferns low in the corners.
  const unit = Math.min(w, h * 0.75);
  const near = ["#0f2016", "#14291b", "#183020"];
  for (const [x, y, len, angle, droop] of [
    [-0.02, 0.12, 0.55, -0.3, 1.2],
    [-0.03, 0.38, 0.45, 0, 1.1],
    [1.03, 0.2, 0.52, Math.PI + 0.3, -1.15],
    [1.02, 0.46, 0.42, Math.PI, -1.1],
  ] as const) {
    frond(ctx, x * w, y * h, len * unit, angle, droop, 0.3, 20, near[Math.floor(rand() * 3)], 0.1);
  }
  for (const [x, flip] of [
    [-0.02, 1],
    [1.02, -1],
  ] as const) {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + flip * lerp(0.1, 1.3, i / 6);
      frond(ctx, x * w, h * 1.02, unit * lerp(0.28, 0.4, rand()), a, flip * 0.9, 0.2, 11, near[i % 3]);
    }
  }
}

// ----------------------------------------------------------------- glass

/**
 * A drop on the glass by day: nearly clear, a little darker at its rim, with
 * a bright crescent low down where it gathers the light and a pin of
 * reflection on top.
 */
function dropSprite(r: number, dpr: number) {
  const pad = 2;
  const size = Math.ceil((r + pad) * 2 * dpr);
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  g.scale(dpr, dpr);
  const c = r + pad;
  g.beginPath();
  g.arc(c, c, r, 0, Math.PI * 2);
  g.save();
  g.clip();
  const body = g.createRadialGradient(c, c - r * 0.3, r * 0.1, c, c, r);
  body.addColorStop(0, "rgba(220,235,228,0.12)");
  body.addColorStop(0.75, "rgba(40,62,52,0.22)");
  body.addColorStop(1, "rgba(20,36,28,0.5)");
  g.fillStyle = body;
  g.fillRect(0, 0, c * 2, c * 2);
  g.restore();
  g.strokeStyle = "rgba(235,245,240,0.7)";
  g.lineWidth = Math.max(0.5, r * 0.22);
  g.lineCap = "round";
  g.beginPath();
  g.arc(c, c, r * 0.86, Math.PI * 0.18, Math.PI * 0.82);
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.arc(c - r * 0.32, c - r * 0.38, Math.max(0.5, r * 0.2), 0, Math.PI * 2);
  g.fill();
  return { canvas, r, pad };
}

/** A bulb's halo, drawn once and stamped each frame. */
function glowSprite(dpr: number) {
  const r = 40;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = Math.ceil(r * 2 * dpr);
  const g = canvas.getContext("2d")!;
  g.scale(dpr, dpr);
  const grad = g.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0, "rgba(255,214,140,0.55)");
  grad.addColorStop(0.3, "rgba(255,190,110,0.18)");
  grad.addColorStop(1, "rgba(255,190,110,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, r * 2, r * 2);
  return canvas;
}

/** The rain outside: a far sheet, fine and slow, and a nearer, brighter one. */
const RAIN = [
  { share: 0.6, alpha: 0.3, width: 0.9, len: [12, 20], speed: [700, 900] },
  { share: 0.4, alpha: 0.5, width: 1.2, len: [22, 34], speed: [1050, 1300] },
];

interface Bead {
  x: number;
  y: number;
  r: number;
}
interface Trail extends Bead {
  life: number;
  max: number;
}
interface Runner extends Bead {
  speed: number;
  travelled: number;
  gap: number;
}
interface Drip {
  x: number;
  y: number;
  /** Where it lands: the staging or the floor below it. */
  floor: number;
  r: number;
  speed: number;
  /** Seconds it has hung there, gathering, before it lets go. */
  hang: number;
  splash: number;
}

const GreenhouseScene = () => {
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
      const v = view(b.w, b.h);
      drawOutside(b.ctx, v);
      drawInterior(b.ctx, v, false);

      const { ctx, w, h } = fitCanvas(front, dpr);

      // Where the glass shows: everything, less what stands in front of it.
      const mask = document.createElement("canvas");
      mask.width = front.width;
      mask.height = front.height;
      const m = mask.getContext("2d")!;
      m.setTransform(dpr, 0, 0, dpr, 0, 0);
      m.fillStyle = "#fff";
      m.fillRect(0, 0, w, h);
      m.globalCompositeOperation = "destination-out";
      drawInterior(m, v, true);

      const sprites = Array.from({ length: 7 }, (_, i) => dropSprite(i + 1, dpr));
      const glow = glowSprite(dpr);
      const drawBead = (bead: Bead, alpha = 1, stretch = 1, into = ctx) => {
        const s = sprites[Math.min(sprites.length - 1, Math.max(0, Math.round(bead.r) - 1))];
        const size = (s.r + s.pad) * 2 * (bead.r / s.r);
        into.globalAlpha = alpha;
        into.drawImage(s.canvas, bead.x - size / 2, bead.y - (size * stretch) / 2, size, size * stretch);
      };

      // Resting beads live on a layer of their own, as on the rainy window:
      // added to as they land, redrawn (at most ten times a second) only
      // when a run swallows some.
      const beadLayer = document.createElement("canvas");
      beadLayer.width = front.width;
      beadLayer.height = front.height;
      const beadCtx = beadLayer.getContext("2d")!;
      beadCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let beadsGone = true;
      let redrawnAt = -Infinity;
      const area = w * h;
      const beadTarget = Math.min(420, Math.max(100, Math.round(area / 3800)));
      const newBead = (): Bead => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.06 ? lerp(3, 4.4, Math.random()) : 0.8 + Math.random() ** 1.8 * 2.6,
      });
      const beads: Bead[] = Array.from({ length: beadTarget }, newBead);
      const trails: Trail[] = [];
      const runners: Runner[] = [];

      // The rain outside, behind the beads: a far sheet and a near one.
      const streakCount = Math.min(320, Math.max(100, Math.round(area / 4500)));
      const streaks = RAIN.map((layer) =>
        Array.from({ length: Math.round(streakCount * layer.share) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          len: lerp(layer.len[0], layer.len[1], Math.random()),
          speed: lerp(layer.speed[0], layer.speed[1], Math.random()),
        })),
      );
      // And rings where it lands on the lawn, most of them in the puddles.
      const pools = puddles(w, h);
      const ripples: { x: number; y: number; age: number; size: number }[] = [];

      const bulbs = STRINGS.flatMap((z) => bulbString(v, z, 9).bulbs).map((bulb) => ({
        ...bulb,
        phase: Math.random() * Math.PI * 2,
        rate: lerp(0.6, 1.4, Math.random()),
      }));

      // Drips gather under the frames, near the roof, and fall to the staging
      // or the floor below.
      const dripFrom = RAFTERS.slice(0, 4).flatMap((z) =>
        [-0.85, -0.45, 0.3, 0.75].map((x) => {
          const [px, py] = at(v, x, roofY(x), z);
          const below = Math.abs(x) > AISLE ? BENCH : FLOOR;
          return { x: px, y: py, floor: at(v, x, below, z)[1] };
        }),
      ).filter((p) => p.x > 0 && p.x < w && p.y > 0 && p.y < h * 0.6);
      const drips: Drip[] = [];

      const drawGlass = (now = 0) => {
        for (const t of trails) drawBead(t, Math.min(1, t.life / t.max) * 0.9);
        if (beadsGone && now - redrawnAt >= 0.1) {
          beadCtx.clearRect(0, 0, w, h);
          for (const bead of beads) drawBead(bead, 1, 1, beadCtx);
          beadsGone = false;
          redrawnAt = now;
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(beadLayer, 0, 0, w, h);
        for (const run of runners) drawBead(run, 1, run.speed > 0 ? 1.18 : 1.05);
        ctx.globalAlpha = 1;
        // Keep it all to the glass.
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(mask, 0, 0, w, h);
        ctx.globalCompositeOperation = "source-over";
      };

      const drawBulbs = (t: number) => {
        for (const bulb of bulbs) {
          const size = bulb.r * 16;
          ctx.globalAlpha = 0.55 + Math.sin(t * bulb.rate + bulb.phase) * 0.2;
          ctx.drawImage(glow, bulb.x - size / 2, bulb.y - size / 2, size, size);
        }
        ctx.globalAlpha = 1;
      };

      if (reduced) {
        ctx.clearRect(0, 0, w, h);
        drawGlass();
        drawBulbs(0);
        return;
      }

      let beadClock = 0;
      let runnerClock = 0.4;
      let dripClock = 1.5;

      stop = animate((t, dt) => {
        ctx.clearRect(0, 0, w, h);

        RAIN.forEach((layer, li) => {
          ctx.strokeStyle = `rgba(240,248,255,${layer.alpha})`;
          ctx.lineWidth = layer.width;
          ctx.beginPath();
          for (const s of streaks[li]) {
            s.y += s.speed * dt;
            s.x += s.speed * 0.06 * dt;
            if (s.y > h) {
              s.y = -s.len - Math.random() * 60;
              s.x = Math.random() * (w + 40) - 40;
            }
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + s.len * 0.06, s.y + s.len);
          }
          ctx.stroke();
        });

        for (let n = Math.random() < dt * 40 ? 1 : 0; n > 0 && ripples.length < 40; n--) {
          const pool = Math.random() < 0.6 ? pools[Math.floor(Math.random() * pools.length)] : null;
          ripples.push(
            pool
              ? { x: pool.x + (Math.random() - 0.5) * pool.rx * 1.6, y: pool.y + (Math.random() - 0.5) * pool.ry, age: 0, size: lerp(6, 12, Math.random()) }
              : { x: Math.random() * w, y: h * lerp(LAWN + 0.02, 0.9, Math.random()), age: 0, size: lerp(3, 6, Math.random()) },
          );
        }
        ctx.strokeStyle = "rgb(235,245,255)";
        ctx.lineWidth = 1;
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          r.age += dt;
          if (r.age > 0.6) {
            ripples.splice(i, 1);
            continue;
          }
          const k = r.age / 0.6;
          ctx.globalAlpha = (1 - k) * 0.55;
          ctx.beginPath();
          ctx.ellipse(r.x, r.y, r.size * k + 1, (r.size * k + 1) * 0.3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;

        beadClock += dt * 22;
        while (beadClock >= 1) {
          beadClock -= 1;
          if (beads.length < beadTarget) {
            const bead = newBead();
            beads.push(bead);
            drawBead(bead, 1, 1, beadCtx);
          }
        }

        runnerClock -= dt;
        if (runnerClock <= 0 && runners.length < 6) {
          runnerClock = lerp(0.6, 2, Math.random());
          runners.push({
            x: Math.random() * w,
            y: lerp(-0.05, 0.5, Math.random()) * h,
            r: lerp(2.6, 4.8, Math.random()),
            speed: 0,
            travelled: 0,
            gap: lerp(6, 14, Math.random()),
          });
        }
        for (let i = runners.length - 1; i >= 0; i--) {
          const run = runners[i];
          if (Math.random() < dt * 1.6) {
            run.speed = Math.random() < 0.28 ? 0 : (40 + Math.random() * 170) * (run.r / 5);
          }
          const dy = run.speed * dt;
          run.y += dy;
          if (dy > 0) run.x += (Math.random() - 0.5) * 0.5;
          run.travelled += dy;
          if (run.travelled > run.gap) {
            run.travelled = 0;
            const max = lerp(6, 12, Math.random());
            trails.push({
              x: run.x + (Math.random() - 0.5) * run.r * 0.5,
              y: run.y - run.r * 0.7,
              r: lerp(0.5, 1.2, Math.random()) * (run.r / 5),
              life: max,
              max,
            });
            run.r = Math.max(2.2, run.r - 0.04);
          }
          for (let j = beads.length - 1; j >= 0; j--) {
            const bead = beads[j];
            const dx = bead.x - run.x;
            const by = bead.y - run.y;
            const reach = run.r + bead.r * 0.8;
            if (dx * dx + by * by < reach * reach) {
              run.r = Math.min(6.5, Math.sqrt(run.r * run.r + bead.r * bead.r * 0.5));
              beads.splice(j, 1);
              beadsGone = true;
            }
          }
          if (run.y - run.r > h) runners.splice(i, 1);
        }
        for (let i = trails.length - 1; i >= 0; i--) {
          trails[i].life -= dt;
          if (trails[i].life <= 0) trails.splice(i, 1);
        }

        drawGlass(t);
        drawBulbs(t);

        // Now and then a drip gathers under the roof and lets go.
        dripClock -= dt;
        if (dripClock <= 0 && dripFrom.length && drips.length < 3) {
          dripClock = lerp(4, 9, Math.random());
          const from = dripFrom[Math.floor(Math.random() * dripFrom.length)];
          drips.push({ ...from, r: 0, speed: 0, hang: 0, splash: 0 });
        }
        ctx.fillStyle = "rgba(225,240,234,0.85)";
        ctx.strokeStyle = "rgba(225,240,234,0.6)";
        ctx.lineWidth = 1;
        for (let i = drips.length - 1; i >= 0; i--) {
          const d = drips[i];
          if (d.splash > 0) {
            d.splash += dt;
            ctx.globalAlpha = Math.max(0, 1 - d.splash / 0.35);
            ctx.beginPath();
            ctx.ellipse(d.x, d.floor, d.splash * 30, d.splash * 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1;
            if (d.splash > 0.35) drips.splice(i, 1);
            continue;
          }
          if (d.hang < 1.4) {
            d.hang += dt;
            d.r = Math.min(2.2, d.hang * 1.8);
          } else {
            d.speed += 1400 * dt;
            d.y += d.speed * dt;
            if (d.y >= d.floor) d.splash = 0.001;
          }
          ctx.beginPath();
          ctx.ellipse(d.x, d.y + d.r, d.r * 0.8, d.r * (d.speed > 0 ? 1.6 : 1.1), 0, 0, Math.PI * 2);
          ctx.fill();
        }
      });
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
      {/* Deeper in the corners, the top left most, where the greeting sits. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_45%,transparent_35%,rgb(8_18_12/0.6)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(160deg,rgb(8_18_12/0.45),transparent_40%)]" />
      <div
        className="absolute inset-0 opacity-[0.1] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default GreenhouseScene;
