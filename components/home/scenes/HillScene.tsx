"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * A grassy hill under a big blue sky, in a light rain. The sky, distant
 * hills and the lone tree are drawn once to the back canvas; the front one
 * moves the clouds, the drizzle, and the grass along the near crest.
 */

/** The near hill's skyline: low on the left, rising gently to the right. */
const crest = (x: number, w: number, h: number) =>
  h * 0.8 - Math.sin((x / w) * Math.PI * 0.9 + 0.2) * h * 0.07 - (x / w) * h * 0.04;

function drawBack(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.72);
  sky.addColorStop(0, "#2462bf");
  sky.addColorStop(0.45, "#4f92dc");
  sky.addColorStop(0.8, "#9ccbf0");
  sky.addColorStop(1, "#d3ebfa");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Sun somewhere behind the drizzle, top right.
  const sun = ctx.createRadialGradient(w * 0.82, h * 0.14, 0, w * 0.82, h * 0.14, Math.max(w, h) * 0.45);
  sun.addColorStop(0, "rgba(255,250,225,0.55)");
  sun.addColorStop(0.3, "rgba(255,245,215,0.15)");
  sun.addColorStop(1, "rgba(255,245,215,0)");
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h);

  // Hills, far to near: hazier and bluer with distance.
  const layers: [base: number, amp: number, freq: number, phase: number, color: string][] = [
    [0.6, 0.035, 2.2, 0.5, "#8fbfb4"],
    [0.66, 0.05, 1.6, 2.1, "#6fae78"],
    [0.71, 0.045, 1.2, 4.0, "#589d60"],
  ];
  for (const [base, amp, freq, phase, color] of layers) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; ; x = Math.min(w, x + 8)) {
      ctx.lineTo(x, h * base - Math.sin((x / w) * Math.PI * freq + phase) * h * amp);
      if (x === w) break;
    }
    ctx.lineTo(w, h);
    ctx.fill();
  }

  // A lone tree on the middle hill.
  const tx = w * 0.72;
  const ty = h * 0.66 - Math.sin(0.72 * Math.PI * 1.6 + 2.1) * h * 0.05;
  const s = Math.min(w, h) / 900;
  ctx.fillStyle = "#3b2b1f";
  ctx.fillRect(tx - 3 * s, ty - 46 * s, 6 * s, 48 * s);
  ctx.fillStyle = "#2f6d39";
  for (const [dx, dy, r] of [
    [0, -62, 30],
    [-22, -50, 22],
    [22, -50, 22],
    [0, -82, 20],
  ]) {
    ctx.beginPath();
    ctx.arc(tx + dx * s, ty + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // The near hill.
  const near = ctx.createLinearGradient(0, h * 0.7, 0, h);
  near.addColorStop(0, "#4a974f");
  near.addColorStop(1, "#2c6a35");
  ctx.fillStyle = near;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; ; x = Math.min(w, x + 6)) {
    ctx.lineTo(x, crest(x, w, h));
    if (x === w) break;
  }
  ctx.lineTo(w, h);
  ctx.fill();
}

/** A soft cumulus, pre-rendered from overlapping white puffs. */
function cloudSprite(width: number, rand: () => number) {
  const height = width * 0.6;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width);
  canvas.height = Math.ceil(height);
  const g = canvas.getContext("2d")!;
  // Puffs stay inside the sprite, so no edge of the canvas ever shows.
  for (let i = 0; i < 10; i++) {
    const cx = lerp(0.3, 0.7, rand()) * width;
    const cy = lerp(0.45, 0.6, rand()) * height;
    const r = lerp(0.1, 0.2, rand()) * width;
    const puff = g.createRadialGradient(cx, cy, 0, cx, cy, r);
    puff.addColorStop(0, "rgba(255,255,255,0.6)");
    puff.addColorStop(0.55, "rgba(255,255,255,0.28)");
    puff.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = puff;
    g.fillRect(0, 0, width, height);
  }
  return canvas;
}

const HillScene = () => {
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
      drawBack(b.ctx, b.w, b.h);

      const { ctx, w, h } = fitCanvas(front, cappedDpr(1.5));
      const rand = seeded(11);

      const clouds = Array.from({ length: 5 }, (_, i) => {
        const width = lerp(0.18, 0.32, rand()) * Math.max(w, 700);
        return {
          sprite: cloudSprite(width, rand),
          x: rand() * w,
          y: lerp(0.04, 0.34, i / 4) * h,
          speed: lerp(4, 10, rand()),
        };
      });

      const blades = Array.from({ length: Math.round(w / 3) }, () => {
        const x = rand() * w;
        return {
          x,
          len: lerp(8, 22, rand()),
          lean: lerp(-0.3, 0.3, rand()),
          color: rand() < 0.5 ? "#4f9d55" : "#6ab56b",
          phase: rand() * Math.PI * 2,
        };
      });

      const drops = Array.from({ length: Math.min(160, Math.max(50, Math.round((w * h) / 14000))) }, () => ({
        x: rand() * w,
        y: rand() * h,
        len: lerp(10, 18, rand()),
        speed: lerp(650, 900, rand()),
      }));

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);

        for (const c of clouds) {
          c.x += c.speed * dt;
          if (c.x > w) c.x = -c.sprite.width;
          ctx.drawImage(c.sprite, c.x, c.y);
        }

        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255,255,255,0.32)";
        ctx.beginPath();
        for (const d of drops) {
          d.y += d.speed * dt;
          d.x += d.speed * 0.08 * dt;
          if (d.y > h) {
            d.y = -d.len;
            d.x = Math.random() * w;
          }
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x + d.len * 0.08, d.y + d.len);
        }
        ctx.stroke();

        // Grass along the crest, leaning with the wind.
        ctx.lineWidth = 1.3;
        ctx.lineCap = "round";
        for (const g of blades) {
          const base = crest(g.x, w, h) + 2;
          const sway = Math.sin(t * 1.4 + g.x * 0.015 + g.phase) * 4 + g.lean * 6;
          ctx.strokeStyle = g.color;
          ctx.beginPath();
          ctx.moveTo(g.x, base);
          ctx.quadraticCurveTo(g.x + sway * 0.3, base - g.len * 0.6, g.x + sway, base - g.len);
          ctx.stroke();
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
      {/* Darkens the corners just enough for light text to hold up on the sky. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_55%_40%,transparent_40%,rgb(10_30_60/0.45)_100%)]" />
      <div
        className="absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{ backgroundImage: `url("${GRAIN}")` }}
      />
    </div>
  );
};

export default HillScene;
