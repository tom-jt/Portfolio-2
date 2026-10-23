"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, lerp } from "@/components/home/scenes/canvas";
import { formatNumber } from "@/lib/home/format";
import {
  catchDrop,
  gardenStore,
  goldenChance,
  spawnInterval,
} from "@/lib/home/garden";

/**
 * The garden's window: raindrops run down it, and clicking (or tapping, or
 * pressing Space) catches them for drops. Golden ones are worth far more.
 *
 * With reduced motion the drops bead in place and fade instead of falling,
 * so the game still works without anything moving across the screen.
 */

interface Drop {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  golden: boolean;
  age: number;
  life: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  golden: boolean;
}
interface Floater {
  x: number;
  y: number;
  text: string;
  age: number;
  golden: boolean;
}

const MAX_DROPS = 12;

function teardrop(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - r * 1.85);
  ctx.quadraticCurveTo(x + r * 1.05, y - r * 0.6, x + r, y);
  ctx.arc(x, y, r, 0, Math.PI);
  ctx.quadraticCurveTo(x - r * 1.05, y - r * 0.6, x, y - r * 1.85);
  ctx.closePath();
}

const CatchGame = ({ label }: { label: string }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const pixelFont = getComputedStyle(canvas).getPropertyValue("--font-pixel-face") || "monospace";
    // Re-read now and then, so the drops follow a scene change.
    let rain = "#86cde0";
    let gold = "#f2b46d";
    let colourClock = Infinity;
    const readColours = () => {
      const css = getComputedStyle(canvas);
      rain = css.getPropertyValue("--glow-2").trim() || rain;
      gold = css.getPropertyValue("--glow").trim() || gold;
    };

    let w = 0;
    let h = 0;
    const fit = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    fit();
    const resize = new ResizeObserver(fit);
    resize.observe(canvas);

    let visible = true;
    const seen = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    seen.observe(canvas);

    const drops: Drop[] = [];
    const particles: Particle[] = [];
    const floaters: Floater[] = [];
    let spawnClock = 0;

    const spawn = () => {
      const s = gardenStore.get();
      const r = lerp(6, 8.5, Math.random());
      drops.push({
        x: lerp(r * 2, w - r * 2, Math.random()),
        y: reduced ? lerp(h * 0.15, h * 0.75, Math.random()) : -r * 2,
        r,
        vy: reduced ? 0 : lerp(55, 95, Math.random()),
        sway: Math.random() * Math.PI * 2,
        golden: Math.random() < goldenChance(s),
        age: 0,
        life: reduced ? 4 : Infinity,
      });
    };

    const burst = (x: number, y: number, golden: boolean, count: number, power: number) => {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
        const v = power * lerp(0.5, 1, Math.random());
        particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: lerp(0.4, 0.7, Math.random()), golden });
      }
    };

    const take = (i: number) => {
      const d = drops[i];
      drops.splice(i, 1);
      const value = catchDrop(d.golden);
      burst(d.x, d.y, d.golden, d.golden ? 14 : 8, d.golden ? 150 : 110);
      floaters.push({ x: d.x, y: d.y - d.r * 2, text: `+${formatNumber(value)}`, age: 0, golden: d.golden });
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      // Generous hit area: these are small and moving, and fingers are big.
      let best = -1;
      let bestDist = Infinity;
      drops.forEach((d, i) => {
        const dist = Math.hypot(d.x - px, d.y - d.r * 0.4 - py);
        if (dist < d.r * 2.2 + 12 && dist < bestDist) {
          best = i;
          bestDist = dist;
        }
      });
      if (best >= 0) take(best);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      if (!drops.length) return;
      // The lowest drop is the one about to be lost.
      let lowest = 0;
      drops.forEach((d, i) => {
        if (d.y > drops[lowest].y) lowest = i;
      });
      take(lowest);
    };

    canvas.addEventListener("pointerdown", onPointer);
    canvas.addEventListener("keydown", onKey);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);

      for (const d of drops) {
        const x = d.x + Math.sin(t * 1.6 + d.sway) * 2.5;
        const fade = reduced ? Math.min(1, d.age * 3, (d.life - d.age) * 2) : 1;
        ctx.globalAlpha = fade;
        teardrop(ctx, x, d.y, d.r);
        const fill = ctx.createLinearGradient(0, d.y - d.r * 1.85, 0, d.y + d.r);
        if (d.golden) {
          fill.addColorStop(0, "#fff4c2");
          fill.addColorStop(1, gold);
          ctx.shadowColor = gold;
          ctx.shadowBlur = 14;
        } else {
          fill.addColorStop(0, "rgba(220,240,250,0.35)");
          fill.addColorStop(1, rain);
          ctx.shadowColor = rain;
          ctx.shadowBlur = 6;
        }
        ctx.fillStyle = fill;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.beginPath();
        ctx.ellipse(x - d.r * 0.35, d.y - d.r * 0.15, d.r * 0.22, d.r * 0.35, -0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      for (const p of particles) {
        ctx.globalAlpha = 1 - p.age / p.life;
        ctx.fillStyle = p.golden ? gold : rain;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = "center";
      ctx.font = `16px ${pixelFont}`;
      for (const f of floaters) {
        ctx.globalAlpha = Math.max(0, 1 - f.age / 0.9);
        ctx.fillStyle = f.golden ? gold : "#eaf6fb";
        ctx.fillText(f.text, f.x, f.y - f.age * 34);
      }
      ctx.globalAlpha = 1;
    };

    const stop = animate((t, dt) => {
      if (!visible || document.hidden) return;

      colourClock += dt;
      if (colourClock > 1) {
        colourClock = 0;
        readColours();
      }

      spawnClock += dt * 1000;
      const interval = spawnInterval(gardenStore.get());
      if (spawnClock >= interval) {
        spawnClock = 0;
        if (drops.length < MAX_DROPS && w > 0) spawn();
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.age += dt;
        d.y += d.vy * dt;
        if (d.y + d.r >= h) {
          burst(d.x, h - 1, d.golden, 5, 70);
          drops.splice(i, 1);
        } else if (d.age > d.life) {
          drops.splice(i, 1);
        }
      }
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.age += dt;
        p.vy += 380 * dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.age > p.life) particles.splice(i, 1);
      }
      for (let i = floaters.length - 1; i >= 0; i--) {
        floaters[i].age += dt;
        if (floaters[i].age > 0.9) floaters.splice(i, 1);
      }
      draw(t);
    });

    return () => {
      stop();
      resize.disconnect();
      seen.disconnect();
      canvas.removeEventListener("pointerdown", onPointer);
      canvas.removeEventListener("keydown", onKey);
    };
  }, [reduced]);

  return (
    <canvas
      ref={ref}
      tabIndex={0}
      role="application"
      aria-label={label}
      className="focus-visible:ring-glow absolute inset-0 h-full w-full cursor-pointer touch-manipulation rounded-[inherit] focus-visible:ring-2 focus-visible:outline-none"
    />
  );
};

export default CatchGame;
