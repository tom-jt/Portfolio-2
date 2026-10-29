"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";
import GlassRain, { NIGHT_GLASS } from "./GlassRain";

/**
 * A city at night, seen through a rainy window. Two canvases:
 *
 *  back  — sky, skyline, lit windows and street bokeh. Drawn at half
 *          resolution and blurred with CSS, because it is out of focus behind
 *          the glass. It only redraws every few seconds, when a window light
 *          flicks on or off.
 *  front — rain falling outside, and drops on the glass (GlassRain).
 */

// ------------------------------------------------------------------ city

type Rgb = string;

interface Win {
  x: number;
  y: number;
  w: number;
  h: number;
  color: Rgb;
  alpha: number;
  lit: boolean;
}

interface City {
  buildings: { x: number; y: number; w: number; h: number; color: string }[];
  windows: Win[];
  bokeh: { x: number; y: number; r: number; color: Rgb; alpha: number }[];
  signs: { x: number; y: number; w: number; h: number; color: Rgb }[];
  beacon: { x: number; y: number };
}

/** Kept sparse: under the blur, dense windows smear into a speckled carpet
 *  instead of reading as lit rooms. */
const LAYERS = [
  { color: "#151c3a", h: [0.3, 0.58], w: [0.035, 0.065], lit: 0.14, a: [0.16, 0.36], cell: 6 },
  { color: "#0e1431", h: [0.2, 0.46], w: [0.05, 0.09], lit: 0.17, a: [0.3, 0.65], cell: 9 },
  { color: "#070b1c", h: [0.1, 0.3], w: [0.07, 0.13], lit: 0.15, a: [0.4, 0.85], cell: 13 },
];

/** Mostly warm interiors, some cool screens, the odd pink lamp. */
function windowColor(r: number): Rgb {
  if (r < 0.58) return "255,213,154";
  if (r < 0.8) return "255,179,107";
  if (r < 0.95) return "169,214,255";
  return "255,158,199";
}

const LAMP: Rgb = "255,180,100";
const HEADLIGHT: Rgb = "255,236,204";
const TAIL_LIGHT: Rgb = "255,84,72";

function buildCity(w: number, h: number): City {
  const rand = seeded(20251022);
  const unit = Math.max(w, 900);
  const city: City = { buildings: [], windows: [], bokeh: [], signs: [], beacon: { x: 0, y: h } };

  LAYERS.forEach((layer, li) => {
    let x = -rand() * 40;
    while (x < w) {
      const bw = lerp(layer.w[0], layer.w[1], rand()) * unit;
      const bh = lerp(layer.h[0], layer.h[1], rand()) * h;
      const top = h - bh;
      city.buildings.push({ x, y: top, w: bw, h: bh, color: layer.color });

      // The tallest building in the back row gets the aircraft beacon.
      if (li === 0 && top < city.beacon.y) city.beacon = { x: x + bw / 2, y: top - 6 };

      const cell = layer.cell;
      for (let wy = top + cell; wy < h - cell; wy += cell * 1.35) {
        // Some floors busy and some nearly dark, so the lights gather in
        // places rather than sprinkling evenly over every building.
        const floor = layer.lit * lerp(0.2, 2, rand() ** 1.5);
        for (let wx = x + cell * 0.6; wx < x + bw - cell * 0.8; wx += cell) {
          if (rand() > floor) continue;
          city.windows.push({
            x: wx,
            y: wy,
            w: cell * 0.55,
            h: cell * 0.72,
            color: windowColor(rand()),
            alpha: lerp(layer.a[0], layer.a[1], rand()),
            lit: true,
          });
        }
      }

      if (li === 1 && rand() < 0.12) {
        const vertical = rand() < 0.5;
        city.signs.push({
          x: x + bw * 0.2,
          y: top + bh * 0.15,
          w: vertical ? 9 : bw * 0.6,
          h: vertical ? 46 : 12,
          color: rand() < 0.5 ? "236,150,190" : "126,208,228",
        });
      }
      x += bw + rand() * 6;
    }
  });

  // The street, out of focus. Every light has a source: a row of street
  // lamps, shop windows at the foot of the front buildings, and cars in two
  // lanes, headlights coming, tail lights going. The lamps keep roughly to a
  // row, but their gaps, sizes, heights, and brightness all vary, and the
  // odd one is out, so they don't line up like beads.
  const lampGap = Math.max(150, w * 0.16);
  for (let x = lampGap * lerp(0.1, 0.5, rand()); x < w + lampGap; x += lampGap * lerp(0.6, 1.4, rand())) {
    if (rand() < 0.15) continue;
    city.bokeh.push({
      x,
      y: h * lerp(0.77, 0.83, rand()),
      r: lerp(20, 36, rand()),
      color: LAMP,
      alpha: lerp(0.34, 0.54, rand()),
    });
  }
  for (const b of city.buildings.filter((b) => b.color === LAYERS[2].color)) {
    if (rand() < 0.45) continue;
    city.bokeh.push({
      x: b.x + b.w * lerp(0.2, 0.8, rand()),
      y: h * lerp(0.87, 0.93, rand()),
      r: lerp(26, 48, rand()),
      color: "255,205,150",
      alpha: lerp(0.18, 0.32, rand()),
    });
  }
  const cars = Math.max(3, Math.round(w / 260));
  for (let i = 0; i < cars; i++) {
    const coming = i % 2 === 0;
    const cx = ((i + rand() * 0.6) / cars) * w;
    const y = h * (coming ? 1.0 : 0.94);
    const r = coming ? lerp(18, 24, rand()) : lerp(12, 16, rand());
    const gap = r * (coming ? 2.2 : 2.6);
    for (const dx of [-gap / 2, gap / 2]) {
      city.bokeh.push({ x: cx + dx, y, r, color: coming ? HEADLIGHT : TAIL_LIGHT, alpha: coming ? 0.55 : 0.6 });
    }
  }
  // Each sign spills its colour onto the street below it.
  for (const sign of city.signs) {
    city.bokeh.push({ x: sign.x + sign.w / 2, y: h * 0.86, r: 40, color: sign.color, alpha: 0.18 });
  }
  return city;
}

function drawCity(ctx: CanvasRenderingContext2D, w: number, h: number, city: City, beaconOn: boolean) {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#050914");
  sky.addColorStop(0.42, "#0d1530");
  sky.addColorStop(0.66, "#241c3e");
  sky.addColorStop(0.82, "#1b1832");
  sky.addColorStop(1, "#0a0d1c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Light pollution: the city lights the low cloud from underneath.
  for (const [x, y, r, c, a] of [
    [0.28, 0.74, 0.5, "255,150,90", 0.2],
    [0.74, 0.7, 0.42, "236,143,180", 0.14],
    [0.52, 0.62, 0.36, "126,200,220", 0.08],
  ] as const) {
    const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, r * Math.max(w, h));
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  for (const b of city.buildings) {
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, b.y, b.w, b.h);
  }
  for (const win of city.windows) {
    if (!win.lit) continue;
    ctx.fillStyle = `rgba(${win.color},${win.alpha})`;
    ctx.fillRect(win.x, win.y, win.w, win.h);
  }
  for (const s of city.signs) {
    ctx.shadowColor = `rgba(${s.color},0.9)`;
    ctx.shadowBlur = 18;
    ctx.fillStyle = `rgba(${s.color},0.85)`;
    ctx.fillRect(s.x, s.y, s.w, s.h);
  }
  ctx.shadowBlur = 0;

  if (beaconOn) {
    const { x, y } = city.beacon;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 14);
    g.addColorStop(0, "rgba(255,70,60,0.95)");
    g.addColorStop(1, "rgba(255,70,60,0)");
    ctx.fillStyle = g;
    ctx.fillRect(x - 14, y - 14, 28, 28);
  }

  // Out-of-focus street lights: discs with a soft shoulder.
  for (const b of city.bokeh) {
    const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
    g.addColorStop(0, `rgba(${b.color},${b.alpha})`);
    g.addColorStop(0.6, `rgba(${b.color},${b.alpha * 0.8})`);
    g.addColorStop(1, `rgba(${b.color},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

const RainScene = () => {
  const backRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const back = backRef.current;
    if (!back) return;

    let flicker: ReturnType<typeof setInterval> | undefined;

    const setup = () => {
      clearInterval(flicker);

      // Half resolution is plenty under a blur.
      const b = fitCanvas(back, 0.5);
      const city = buildCity(b.w, b.h);
      let beaconOn = true;
      drawCity(b.ctx, b.w, b.h, city, beaconOn);

      if (!reduced) {
        flicker = setInterval(() => {
          const flips = Math.max(1, Math.round(city.windows.length * 0.006));
          for (let i = 0; i < flips; i++) {
            const win = city.windows[Math.floor(Math.random() * city.windows.length)];
            if (win) win.lit = !win.lit;
          }
          beaconOn = !beaconOn;
          drawCity(b.ctx, b.w, b.h, city, beaconOn);
        }, 2600);
      }
    };

    setup();
    const stopResize = onResize(setup);
    return () => {
      clearInterval(flicker);
      stopResize();
    };
  }, [reduced]);

  return (
    <div className="absolute inset-0">
      <canvas
        ref={backRef}
        className="absolute inset-0 h-full w-full scale-[1.06] blur-[5px] saturate-[1.1]"
      />
      <GlassRain look={NIGHT_GLASS} />
      {/* Condensation gathering at the bottom of the pane. */}
      <div className="absolute inset-0 bg-[linear-gradient(to_top,rgb(170_190_225/0.08),transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgb(3_5_12/0.7)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.13] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default RainScene;
