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
 * The sun going down over the sea. The sky, sun, sea and headland are drawn
 * once to the back canvas. The front canvas animates what moves: glitter on
 * the sun's path across the water, slow swell lines, drifting cloud, a
 * lighthouse, and now and then a few birds heading home.
 */

interface Layout {
  w: number;
  h: number;
  horizon: number;
  sun: { x: number; y: number; r: number };
  lighthouse: { x: number; y: number };
}

function layout(w: number, h: number): Layout {
  const horizon = h * 0.62;
  const r = Math.min(110, Math.max(40, Math.min(w, h) * 0.085));
  return {
    w,
    h,
    horizon,
    sun: { x: w * 0.66, y: horizon + r * 0.18, r },
    lighthouse: { x: w * 0.12, y: horizon - h * 0.07 },
  };
}

function drawBack(ctx: CanvasRenderingContext2D, l: Layout) {
  const { w, h, horizon, sun } = l;

  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, "#1d1440");
  sky.addColorStop(0.32, "#46245e");
  sky.addColorStop(0.62, "#9e3d6c");
  sky.addColorStop(0.86, "#e6735e");
  sky.addColorStop(0.97, "#ffb46a");
  sky.addColorStop(1, "#ffd593");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, horizon);

  const glow = ctx.createRadialGradient(sun.x, horizon, 0, sun.x, horizon, sun.r * 8);
  glow.addColorStop(0, "rgba(255,200,130,0.6)");
  glow.addColorStop(0.35, "rgba(255,140,100,0.18)");
  glow.addColorStop(1, "rgba(255,140,100,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, horizon);

  // The sun, already touching the water.
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, w, horizon);
  ctx.clip();
  const disc = ctx.createLinearGradient(0, sun.y - sun.r, 0, sun.y + sun.r);
  disc.addColorStop(0, "#fff6d8");
  disc.addColorStop(0.6, "#ffd08a");
  disc.addColorStop(1, "#ff9f55");
  ctx.fillStyle = disc;
  ctx.shadowColor = "rgba(255,190,120,0.9)";
  ctx.shadowBlur = sun.r * 0.8;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, sun.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const sea = ctx.createLinearGradient(0, horizon, 0, h);
  sea.addColorStop(0, "#f0a070");
  sea.addColorStop(0.05, "#c46677");
  sea.addColorStop(0.35, "#6a3266");
  sea.addColorStop(0.75, "#2a1538");
  sea.addColorStop(1, "#160a21");
  ctx.fillStyle = sea;
  ctx.fillRect(0, horizon, w, h - horizon);

  // The sun's path on the water: a tall, soft ellipse under the disc.
  ctx.save();
  ctx.translate(sun.x, horizon);
  ctx.scale(1, 4.5);
  const path = ctx.createRadialGradient(0, 0, 0, 0, 0, sun.r * 1.3);
  path.addColorStop(0, "rgba(255,200,130,0.45)");
  path.addColorStop(1, "rgba(255,200,130,0)");
  ctx.fillStyle = path;
  ctx.fillRect(-sun.r * 1.3, 0, sun.r * 2.6, sun.r * 1.3);
  ctx.restore();

  ctx.fillStyle = "rgba(255,226,180,0.55)";
  ctx.fillRect(0, horizon - 0.5, w, 1);

  // A headland on the left, and a fainter one far off to the right.
  const rand = seeded(7);
  ctx.fillStyle = "#2b1636";
  ctx.beginPath();
  ctx.moveTo(0, horizon + 2);
  ctx.lineTo(0, horizon - h * 0.05);
  const span = w * 0.32;
  for (let x = 0; x <= span; x += span / 14) {
    const t = x / span;
    const height = h * 0.055 * (1 - t ** 1.6) * (0.85 + rand() * 0.3);
    ctx.lineTo(x, horizon - height);
  }
  ctx.lineTo(span, horizon + 2);
  ctx.fill();

  ctx.fillStyle = "rgba(110,52,90,0.55)";
  ctx.beginPath();
  ctx.moveTo(w * 0.82, horizon + 1);
  ctx.quadraticCurveTo(w * 0.9, horizon - h * 0.018, w, horizon - h * 0.012);
  ctx.lineTo(w, horizon + 1);
  ctx.fill();

  // The lighthouse.
  const lh = l.lighthouse;
  const towerH = h * 0.07 - h * 0.022;
  ctx.fillStyle = "#e7cfc2";
  ctx.beginPath();
  ctx.moveTo(lh.x - 4, lh.y + 6 + towerH);
  ctx.lineTo(lh.x - 2.5, lh.y + 6);
  ctx.lineTo(lh.x + 2.5, lh.y + 6);
  ctx.lineTo(lh.x + 4, lh.y + 6 + towerH);
  ctx.fill();
  ctx.fillStyle = "#3a1d40";
  ctx.fillRect(lh.x - 3.5, lh.y + 6 + towerH * 0.45, 7, towerH * 0.16);
  ctx.fillRect(lh.x - 3, lh.y, 6, 6);
}

/** Soft, wide cloud built from overlapping ellipses, pre-rendered once. */
function cloudSprite(width: number, lit: number, rand: () => number) {
  const height = width * 0.22;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const g = canvas.getContext("2d")!;
  const color = lit > 0.5 ? "255,170,140" : "150,72,120";
  for (let i = 0; i < 9; i++) {
    const cx = lerp(0.15, 0.85, rand()) * width;
    const cy = lerp(0.4, 0.6, rand()) * height;
    const rx = lerp(0.12, 0.3, rand()) * width;
    g.save();
    g.translate(cx, cy);
    g.scale(1, (height * 0.42) / rx);
    const grad = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    grad.addColorStop(0, `rgba(${color},${0.16 + lit * 0.12})`);
    grad.addColorStop(1, `rgba(${color},0)`);
    g.fillStyle = grad;
    g.fillRect(-rx, -rx, rx * 2, rx * 2);
    g.restore();
  }
  return canvas;
}

const SunsetScene = () => {
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
      drawBack(b.ctx, l);

      const { ctx, w, h } = fitCanvas(front, cappedDpr(1.5));
      const { horizon, sun } = l;
      const rand = seeded(42);
      const gauss = () => (rand() + rand() + rand() - 1.5) / 1.5;

      const glitter = Array.from({ length: Math.min(200, Math.max(90, Math.round(w / 8))) }, () => {
        const depth = rand() ** 1.7;
        const spread = sun.r * 0.5 + depth * w * 0.2;
        return {
          x: sun.x + gauss() * spread,
          y: horizon + 2 + depth * (h - horizon),
          len: (3 + depth * 26) * lerp(0.5, 1, rand()),
          thick: 1 + depth * 1.5,
          depth,
          phase: rand() * Math.PI * 2,
          speed: lerp(1.2, 3.2, rand()),
        };
      });

      const swell = Array.from({ length: 40 }, () => {
        const depth = rand() ** 1.5;
        return {
          x: rand() * w,
          y: horizon + 3 + depth * (h - horizon),
          len: 40 + depth * w * 0.35,
          speed: lerp(3, 9, rand()),
          phase: rand() * Math.PI * 2,
        };
      });

      const clouds = Array.from({ length: 5 }, (_, i) => {
        const y = lerp(0.08, 0.44, i / 4 + (rand() - 0.5) * 0.1) * horizon;
        const width = lerp(0.35, 0.6, rand()) * w;
        return {
          sprite: cloudSprite(width, y / horizon, rand),
          x: rand() * w,
          y,
          speed: lerp(3, 8, rand()),
        };
      });

      let flock: { x: number; y: number; birds: { dx: number; dy: number; s: number; p: number }[] } | null = null;
      let flockClock = 4;

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);

        for (const c of clouds) {
          c.x += c.speed * dt;
          if (c.x > w) c.x = -c.sprite.width;
          ctx.drawImage(c.sprite, c.x, c.y - c.sprite.height / 2);
        }

        for (const s of swell) {
          s.x += s.speed * dt;
          if (s.x > w) s.x = -s.len;
          const a = 0.06 + 0.05 * Math.sin(t * 0.5 + s.phase);
          ctx.fillStyle = `rgba(255,200,190,${a})`;
          ctx.fillRect(s.x, s.y, s.len, 1);
        }

        for (const g of glitter) {
          const twinkle = Math.max(0, Math.sin(t * g.speed + g.phase)) ** 4;
          const a = twinkle * (0.35 + 0.55 * (1 - g.depth));
          if (a < 0.02) continue;
          const x = g.x + Math.sin(t * 0.3 + g.phase) * 2;
          ctx.fillStyle = `rgba(255,232,180,${a})`;
          ctx.fillRect(x - g.len / 2, g.y, g.len, g.thick);
        }

        // The lighthouse turns roughly every five seconds.
        const beam = Math.max(0, Math.sin(t * 1.25)) ** 6;
        if (beam > 0.01) {
          const { x, y } = l.lighthouse;
          const glow = ctx.createRadialGradient(x, y + 3, 0, x, y + 3, 22);
          glow.addColorStop(0, `rgba(255,236,190,${beam})`);
          glow.addColorStop(1, "rgba(255,236,190,0)");
          ctx.fillStyle = glow;
          ctx.fillRect(x - 22, y - 19, 44, 44);
        }

        flockClock -= dt;
        if (!flock && flockClock <= 0) {
          flock = {
            x: -60,
            y: lerp(0.16, 0.34, Math.random()) * horizon,
            birds: Array.from({ length: 3 + Math.floor(Math.random() * 3) }, (_, i) => ({
              dx: -i * lerp(14, 22, Math.random()),
              dy: (i % 2 ? 1 : -1) * i * lerp(5, 9, Math.random()),
              s: lerp(4.5, 7, Math.random()),
              p: Math.random() * Math.PI * 2,
            })),
          };
        }
        if (flock) {
          flock.x += 36 * dt;
          flock.y -= 2 * dt;
          ctx.strokeStyle = "rgba(48,20,48,0.75)";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          for (const bird of flock.birds) {
            const x = flock.x + bird.dx;
            const y = flock.y + bird.dy;
            const flap = Math.sin(t * 7 + bird.p) * bird.s * 0.55;
            ctx.moveTo(x - bird.s, y - flap);
            ctx.quadraticCurveTo(x - bird.s / 2, y - bird.s * 0.2, x, y);
            ctx.quadraticCurveTo(x + bird.s / 2, y - bird.s * 0.2, x + bird.s, y - flap);
          }
          ctx.stroke();
          if (flock.x > w + 120) {
            flock = null;
            flockClock = lerp(16, 30, Math.random());
          }
        }
      };

      if (reduced) {
        frame(1.3, 0);
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
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_55%,transparent_45%,rgb(20_6_24/0.6)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.12] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default SunsetScene;
