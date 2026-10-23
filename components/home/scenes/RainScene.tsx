"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import {
  animate,
  cappedDpr,
  fitCanvas,
  GRAIN,
  lerp,
  onResize,
  seeded,
} from "./canvas";

/**
 * A city at night, seen through a rainy window. Two canvases:
 *
 *  back  — sky, skyline, lit windows and street bokeh. Drawn at half
 *          resolution and blurred with CSS, because it is out of focus behind
 *          the glass. It only redraws every few seconds, when a window light
 *          flicks on or off.
 *  front — rain falling outside, and drops on the glass. The drops are
 *          sprites; a few grow heavy and run down, swallowing the drops in
 *          their path and leaving a trail of beads behind.
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
        for (let wx = x + cell * 0.6; wx < x + bw - cell * 0.8; wx += cell) {
          if (rand() > layer.lit) continue;
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
  // lamps at even spacing, shop windows at the foot of the front buildings,
  // and cars in two lanes, headlights coming, tail lights going.
  const lampGap = Math.max(150, w * 0.16);
  for (let x = lampGap * 0.3; x < w + lampGap; x += lampGap) {
    city.bokeh.push({ x: x + lerp(-8, 8, rand()), y: h * 0.8, r: lerp(26, 34, rand()), color: LAMP, alpha: 0.5 });
  }
  for (const b of city.buildings.filter((b) => b.color === LAYERS[2].color)) {
    if (rand() < 0.45) continue;
    city.bokeh.push({ x: b.x + b.w * lerp(0.3, 0.7, rand()), y: h * 0.9, r: lerp(30, 46, rand()), color: "255,205,150", alpha: 0.28 });
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

// ----------------------------------------------------------------- glass

/**
 * A drop on glass at night: nearly clear and slightly darker than what's
 * behind it, with a bright crescent along its lower edge where it gathers
 * the light, and a pin of reflection on top. Drops low on the pane catch the
 * warm street light; drops up against the sky catch cooler light.
 */
function dropSprite(r: number, dpr: number, warm: boolean) {
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

  const light = warm ? "255,206,150" : "176,204,255";

  const body = g.createRadialGradient(c, c - r * 0.3, r * 0.1, c, c, r);
  body.addColorStop(0, "rgba(150,170,215,0.08)");
  body.addColorStop(0.75, "rgba(20,28,52,0.28)");
  body.addColorStop(1, "rgba(4,8,20,0.6)");
  g.fillStyle = body;
  g.fillRect(0, 0, c * 2, c * 2);

  const pool = g.createRadialGradient(c, c + r * 0.55, 0, c, c + r * 0.55, r * 0.75);
  pool.addColorStop(0, `rgba(${light},0.55)`);
  pool.addColorStop(1, `rgba(${light},0)`);
  g.fillStyle = pool;
  g.fillRect(0, 0, c * 2, c * 2);
  g.restore();

  g.strokeStyle = `rgba(${light},0.7)`;
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

type Sprite = ReturnType<typeof dropSprite>;

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
interface Streak {
  x: number;
  y: number;
  len: number;
  speed: number;
}

/** Far, mid and near rain: fainter, shorter and slower the further away. */
const STREAK_LAYERS = [
  { share: 0.5, alpha: 0.12, width: 0.8, len: [10, 16], speed: [650, 850] },
  { share: 0.32, alpha: 0.18, width: 1, len: [14, 22], speed: [900, 1150] },
  { share: 0.18, alpha: 0.26, width: 1.3, len: [20, 32], speed: [1250, 1500] },
];
const WIND = 0.1;

const RainScene = () => {
  const backRef = useRef<HTMLCanvasElement>(null);
  const frontRef = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) return;

    let stop = () => {};
    let flicker: ReturnType<typeof setInterval> | undefined;

    const setup = () => {
      stop();
      clearInterval(flicker);

      // Back: half resolution is plenty under a blur.
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

      // Front.
      const dpr = cappedDpr(1.5);
      const { ctx, w, h } = fitCanvas(front, dpr);
      const sprites = (warm: boolean): Sprite[] =>
        Array.from({ length: 9 }, (_, i) => dropSprite(i + 1, dpr, warm));
      const warmSprites = sprites(true);
      const coolSprites = sprites(false);
      const spriteFor = (bead: Bead) => {
        const set = bead.y > h * 0.55 ? warmSprites : coolSprites;
        return set[Math.min(set.length - 1, Math.max(0, Math.round(bead.r) - 1))];
      };
      const drawBead = (bead: Bead, alpha = 1, stretch = 1) => {
        const s = spriteFor(bead);
        const k = bead.r / s.r;
        const size = (s.r + s.pad) * 2 * k;
        ctx.globalAlpha = alpha;
        ctx.drawImage(s.canvas, bead.x - size / 2, bead.y - (size * stretch) / 2, size, size * stretch);
      };

      const area = w * h;
      const beadTarget = Math.min(520, Math.max(120, Math.round(area / 3200)));
      const newBead = (): Bead => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() < 0.08 ? lerp(3.4, 5.2, Math.random()) : 1 + Math.random() ** 1.8 * 3,
      });
      const beads: Bead[] = Array.from({ length: beadTarget }, newBead);
      const trails: Trail[] = [];
      const runners: Runner[] = [];

      const streakCount = Math.min(260, Math.max(80, Math.round(area / 7000)));
      const streaks: Streak[][] = STREAK_LAYERS.map((layer) =>
        Array.from({ length: Math.round(streakCount * layer.share) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          len: lerp(layer.len[0], layer.len[1], Math.random()),
          speed: lerp(layer.speed[0], layer.speed[1], Math.random()),
        })),
      );

      const drawGlass = () => {
        for (const t of trails) drawBead(t, Math.min(1, t.life / t.max) * 0.9);
        for (const bead of beads) drawBead(bead);
        for (const run of runners) drawBead(run, 1, run.speed > 0 ? 1.18 : 1.05);
        ctx.globalAlpha = 1;
      };

      if (reduced) {
        ctx.clearRect(0, 0, w, h);
        drawGlass();
        return;
      }

      let beadClock = 0;
      let runnerClock = 0.4;

      stop = animate((_, dt) => {
        ctx.clearRect(0, 0, w, h);

        // Rain outside the window.
        STREAK_LAYERS.forEach((layer, li) => {
          ctx.strokeStyle = `rgba(190,210,255,${layer.alpha})`;
          ctx.lineWidth = layer.width;
          ctx.beginPath();
          for (const s of streaks[li]) {
            s.y += s.speed * dt;
            s.x += s.speed * WIND * dt;
            if (s.y > h) {
              s.y = -s.len - Math.random() * 60;
              s.x = Math.random() * (w + 60) - 60;
            }
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + s.len * WIND, s.y + s.len);
          }
          ctx.stroke();
        });

        // New drops landing on the glass.
        beadClock += dt * 26;
        while (beadClock >= 1) {
          beadClock -= 1;
          if (beads.length < beadTarget) beads.push(newBead());
        }

        // Every so often a drop gets heavy enough to run.
        runnerClock -= dt;
        if (runnerClock <= 0 && runners.length < 7) {
          runnerClock = lerp(0.5, 1.8, Math.random());
          runners.push({
            x: Math.random() * w,
            y: lerp(-0.05, 0.55, Math.random()) * h,
            r: lerp(3, 5.5, Math.random()),
            speed: 0,
            travelled: 0,
            gap: lerp(6, 14, Math.random()),
          });
        }

        for (let i = runners.length - 1; i >= 0; i--) {
          const run = runners[i];
          // Stop-start: drops on glass catch, then let go.
          if (Math.random() < dt * 1.6) {
            run.speed = Math.random() < 0.28 ? 0 : (40 + Math.random() * 180) * (run.r / 5);
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
              r: lerp(0.5, 1.3, Math.random()) * (run.r / 5),
              life: max,
              max,
            });
            run.r = Math.max(2.4, run.r - 0.04);
          }

          for (let j = beads.length - 1; j >= 0; j--) {
            const bead = beads[j];
            const dx = bead.x - run.x;
            const by = bead.y - run.y;
            const reach = run.r + bead.r * 0.8;
            if (dx * dx + by * by < reach * reach) {
              run.r = Math.min(7.5, Math.sqrt(run.r * run.r + bead.r * bead.r * 0.5));
              beads.splice(j, 1);
            }
          }

          if (run.y - run.r > h) runners.splice(i, 1);
        }

        for (let i = trails.length - 1; i >= 0; i--) {
          trails[i].life -= dt;
          if (trails[i].life <= 0) trails.splice(i, 1);
        }

        drawGlass();
      });
    };

    setup();
    const stopResize = onResize(setup);
    return () => {
      stop();
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
      <canvas ref={frontRef} className="absolute inset-0 h-full w-full" />
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
