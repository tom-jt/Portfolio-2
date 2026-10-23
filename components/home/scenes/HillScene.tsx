"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * A grassy hill under a big blue sky, in a light rain. The sky, the hills
 * (hazier with distance), the lone tree and the near slope's tufts and
 * flowers are drawn once to the back canvas; the front one moves the
 * clouds, the drizzle, and the tall grass in the foreground.
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

  // Hills, far to near: hazier and bluer with distance. Each is lit along
  // its crest and darkens down its slope, and haze pools between them.
  const layers: [base: number, amp: number, freq: number, phase: number, top: string, bottom: string][] = [
    [0.57, 0.03, 3.1, 1.2, "#a9cbe0", "#9cc2d4"],
    [0.6, 0.035, 2.2, 0.5, "#9cc9b6", "#86b7a3"],
    [0.66, 0.05, 1.6, 2.1, "#7cba7c", "#5e9f63"],
    [0.71, 0.045, 1.2, 4.0, "#63a865", "#4b8f51"],
  ];
  const ridge = (base: number, amp: number, freq: number, phase: number, x: number) =>
    h * base - Math.sin((x / w) * Math.PI * freq + phase) * h * amp;
  for (const [base, amp, freq, phase, top, bottom] of layers) {
    const fill = ctx.createLinearGradient(0, h * (base - amp), 0, h * (base + 0.12));
    fill.addColorStop(0, top);
    fill.addColorStop(1, bottom);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; ; x = Math.min(w, x + 8)) {
      ctx.lineTo(x, ridge(base, amp, freq, phase, x));
      if (x === w) break;
    }
    ctx.lineTo(w, h);
    ctx.fill();
    // A rim of light along the crest, from the sun behind the cloud.
    ctx.strokeStyle = "rgba(235,255,225,0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 0; ; x = Math.min(w, x + 8)) {
      const y = ridge(base, amp, freq, phase, x) + 0.8;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      if (x === w) break;
    }
    ctx.stroke();
    // Haze settling in front of it, so the next hill stands out.
    const haze = ctx.createLinearGradient(0, h * (base + 0.01), 0, h * (base + 0.07));
    haze.addColorStop(0, "rgba(220,238,245,0)");
    haze.addColorStop(1, "rgba(220,238,245,0.18)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, h * (base + 0.01), w, h * 0.06);
  }

  // A lone tree, standing on the middle hill's crest.
  const s = Math.min(w, h) / 900;
  const tx = w * 0.72;
  const ty = ridge(0.66, 0.05, 1.6, 2.1, tx) + 2 * s;
  ctx.fillStyle = "rgba(20,50,25,0.25)";
  ctx.beginPath();
  ctx.ellipse(tx + 10 * s, ty + 1 * s, 30 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#3b2b1f";
  ctx.beginPath();
  ctx.moveTo(tx - 4.5 * s, ty);
  ctx.lineTo(tx - 2 * s, ty - 48 * s);
  ctx.lineTo(tx + 2 * s, ty - 48 * s);
  ctx.lineTo(tx + 4.5 * s, ty);
  ctx.fill();
  const canopy: [dx: number, dy: number, r: number, color: string][] = [
    [-20, -52, 22, "#2a5e33"],
    [22, -54, 21, "#2a5e33"],
    [0, -64, 30, "#2f6d39"],
    [-12, -80, 20, "#357a3f"],
    [12, -84, 19, "#357a3f"],
    // The side facing the sun, top right, catches the light.
    [16, -78, 12, "#4a9150"],
    [24, -60, 10, "#43884a"],
  ];
  for (const [dx, dy, r, color] of canopy) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(tx + dx * s, ty + dy * s, r * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // The near hill, lighter where it crests.
  const near = ctx.createLinearGradient(0, h * 0.72, 0, h);
  near.addColorStop(0, "#56a35a");
  near.addColorStop(0.45, "#3f8846");
  near.addColorStop(1, "#285f30");
  ctx.fillStyle = near;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; ; x = Math.min(w, x + 6)) {
    ctx.lineTo(x, crest(x, w, h));
    if (x === w) break;
  }
  ctx.lineTo(w, h);
  ctx.fill();

  // Tufts and a few wildflowers on the near slope, thicker and larger the
  // nearer they are.
  const rand = seeded(7);
  ctx.lineCap = "round";
  for (let i = 0; i < Math.round(w / 2.2); i++) {
    const x = rand() * w;
    const top = crest(x, w, h) + 6;
    const depth = rand() ** 0.8;
    const y = lerp(top, h, depth);
    const len = lerp(3, 11, depth) * (Math.min(w, h) / 800 + 0.4);
    ctx.strokeStyle = rand() < 0.5 ? "rgba(30,80,35,0.55)" : "rgba(110,180,100,0.45)";
    ctx.lineWidth = lerp(0.8, 1.6, depth);
    for (let k = -1; k <= 1; k++) {
      ctx.beginPath();
      ctx.moveTo(x + k * 1.5, y);
      ctx.lineTo(x + k * 3, y - len * (k ? 0.75 : 1));
      ctx.stroke();
    }
  }
  for (let i = 0; i < Math.round(w / 28); i++) {
    const x = rand() * w;
    const depth = rand() ** 0.7;
    const y = lerp(crest(x, w, h) + 10, h, depth);
    ctx.fillStyle = ["#f7f3e8", "#ffe27a", "#f3b8d0"][Math.floor(rand() * 3)];
    ctx.beginPath();
    ctx.arc(x, y, lerp(1, 2.4, depth), 0, Math.PI * 2);
    ctx.fill();
  }
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

      // Tall grass in the very front, rising from the bottom of the window.
      const blades = Array.from({ length: Math.round(w / 2.5) }, () => {
        const x = rand() * w;
        return {
          x,
          len: lerp(18, 58, rand() ** 1.6) * (Math.min(w, h) / 800 + 0.4),
          lean: lerp(-0.3, 0.3, rand()),
          color: ["#2f7537", "#3f8b45", "#56a159"][Math.floor(rand() * 3)],
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

        // The tall grass, leaning with the wind.
        ctx.lineWidth = 1.6;
        ctx.lineCap = "round";
        for (const g of blades) {
          const base = h + 2;
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
