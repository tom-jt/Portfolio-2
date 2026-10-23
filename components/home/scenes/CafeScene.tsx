"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, GRAIN, lerp, onResize, seeded } from "./canvas";

/**
 * Inside a café late at night, rain on the big front window. Two canvases:
 *
 *  back  — the room: wall, shelves, the counter and a cup, pendant lamps, and
 *          through the window a wet street gone soft with distance. Drawn once.
 *  front — rain outside, beads and runs on the glass, steam off the cup, a
 *          string of lights that twinkle, and the lamps' glow breathing.
 */

interface Layout {
  win: { x: number; y: number; w: number; h: number };
  counter: number;
  cup: { x: number; y: number; s: number };
  lamps: { x: number; y: number }[];
}

function layout(w: number, h: number): Layout {
  const portrait = w < h;
  const x = w * (portrait ? 0.06 : 0.17);
  // On a phone the greeting covers the top of the screen, so the window starts below it.
  const win = portrait ? { x, y: h * 0.24, w: w - x * 2, h: h * 0.48 } : { x, y: h * 0.1, w: w - x * 2, h: h * 0.6 };
  const counter = h * 0.8;
  const s = Math.min(w, h) / 800;
  return {
    win,
    counter,
    cup: { x: w * (portrait ? 0.7 : 0.64), y: counter, s },
    lamps: portrait
      ? [{ x: w * 0.5, y: h * 0.185 }]
      : [
          { x: w * 0.3, y: h * 0.13 },
          { x: w * 0.7, y: h * 0.13 },
        ],
  };
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

  // Buildings opposite, barely there.
  for (let bx = x; bx < x + w; ) {
    const bw = lerp(0.08, 0.18, rand()) * w;
    const bh = lerp(0.35, 0.7, rand()) * h;
    ctx.fillStyle = rand() < 0.5 ? "#0e1428" : "#121a30";
    ctx.fillRect(bx, y + h - bh, bw, bh);
    bx += bw;
  }

  // Out-of-focus lights: windows, street lamps, a passing car.
  const colors = ["255,196,120", "255,170,90", "255,140,180", "120,200,230", "255,220,160"];
  for (let i = 0; i < 36; i++) {
    const bx = x + rand() * w;
    const by = y + lerp(0.3, 1, rand() ** 0.7) * h;
    const r = lerp(6, 22, rand()) * (w / 900 + 0.4);
    const c = colors[Math.floor(rand() * colors.length)];
    const a = lerp(0.15, 0.45, rand());
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, r);
    g.addColorStop(0, `rgba(${c},${a})`);
    g.addColorStop(0.7, `rgba(${c},${a * 0.6})`);
    g.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(bx - r, by - r, r * 2, r * 2);
  }

  // A neon sign across the street, smeared by the rain.
  const nx = x + w * 0.2;
  const ny = y + h * 0.42;
  const neon = ctx.createRadialGradient(nx, ny, 0, nx, ny, w * 0.12);
  neon.addColorStop(0, "rgba(255,120,170,0.45)");
  neon.addColorStop(1, "rgba(255,120,170,0)");
  ctx.fillStyle = neon;
  ctx.fillRect(nx - w * 0.12, ny - w * 0.12, w * 0.24, w * 0.24);
  ctx.fillStyle = "rgba(255,170,205,0.55)";
  ctx.fillRect(nx - w * 0.04, ny - 2, w * 0.08, 4);

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
    for (const side of [0, 1]) {
      const sx = side ? x + ww + x * 0.18 : x * 0.12;
      const sw = x * 0.7;
      for (const row of [0.26, 0.46]) {
        const sy = h * row;
        ctx.fillStyle = "#4a2f1d";
        ctx.fillRect(sx, sy, sw, 5);
        // Jars and tins.
        for (let jx = sx + 6; jx < sx + sw - 12; ) {
          const jw = lerp(10, 18, rand());
          const jh = lerp(16, 34, rand());
          const hue = ["#8a5a3a", "#b98a5a", "#5f7a6a", "#c9b08a", "#7a4a3a"][Math.floor(rand() * 5)];
          ctx.fillStyle = hue;
          ctx.globalAlpha = 0.85;
          ctx.fillRect(jx, sy - jh, jw, jh);
          ctx.fillStyle = "rgba(255,230,190,0.18)";
          ctx.fillRect(jx + 2, sy - jh + 2, 2, jh - 4);
          ctx.globalAlpha = 1;
          jx += jw + lerp(3, 9, rand());
        }
      }
    }
    // A trailing plant on the right-hand top shelf.
    const px = x + ww + x * 0.18 + x * 0.55;
    const py = h * 0.26;
    ctx.strokeStyle = "#3d6a3a";
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(px, py - 4);
      const len = lerp(40, 110, rand());
      const dx = lerp(-18, 10, rand());
      ctx.bezierCurveTo(px + dx, py + len * 0.3, px + dx * 1.5, py + len * 0.7, px + dx, py + len);
      ctx.stroke();
      for (let k = 0.2; k < 1; k += 0.18) {
        ctx.fillStyle = rand() < 0.5 ? "#4f8a4a" : "#3d6a3a";
        ctx.beginPath();
        ctx.ellipse(px + dx * (0.6 + k), py + len * k, 5, 3, rand() * Math.PI, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = "#a0583a";
    ctx.fillRect(px - 10, py - 18, 20, 18);
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

  // The cup and saucer.
  const { x: cx, y: cy, s } = l.cup;
  ctx.fillStyle = "#e8dccb";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 2 * s, 46 * s, 8 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - 28 * s, cy - 40 * s);
  ctx.lineTo(cx + 28 * s, cy - 40 * s);
  ctx.quadraticCurveTo(cx + 26 * s, cy, cx, cy);
  ctx.quadraticCurveTo(cx - 26 * s, cy, cx - 28 * s, cy - 40 * s);
  ctx.fill();
  ctx.strokeStyle = "#e8dccb";
  ctx.lineWidth = 6 * s;
  ctx.beginPath();
  ctx.ellipse(cx + 32 * s, cy - 24 * s, 10 * s, 12 * s, 0, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();
  ctx.fillStyle = "#4a2a18";
  ctx.beginPath();
  ctx.ellipse(cx, cy - 40 * s, 27 * s, 5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  // Lamplight on the cup's left.
  ctx.fillStyle = "rgba(255,200,140,0.18)";
  ctx.fillRect(cx - 24 * s, cy - 36 * s, 6 * s, 30 * s);

  // Pendant lamps: cord and shade. Their glow is on the front canvas.
  for (const lamp of l.lamps) {
    ctx.strokeStyle = "#0d0805";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(lamp.x, 0);
    ctx.lineTo(lamp.x, lamp.y);
    ctx.stroke();
    const r = Math.max(22, w * 0.025);
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

      const frame = (t: number, dt: number) => {
        ctx.clearRect(0, 0, w, h);

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
          const cy = lamp.y + Math.max(22, w * 0.025) * 0.7;
          const g = ctx.createRadialGradient(lamp.x, cy, 0, lamp.x, cy, r);
          g.addColorStop(0, `rgba(255,190,110,${0.32 * flicker})`);
          g.addColorStop(0.35, `rgba(255,170,90,${0.1 * flicker})`);
          g.addColorStop(1, "rgba(255,170,90,0)");
          ctx.fillStyle = g;
          ctx.fillRect(lamp.x - r, cy - r, r * 2, r * 2);
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
