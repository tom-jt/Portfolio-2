"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, lerp } from "@/components/home/scenes/canvas";
import { formatNumber } from "@/lib/home/format";
import {
  catchDrop,
  catchLadybug,
  DIAMOND_CHANCE,
  DIAMOND_SHOWER,
  gardenStore,
  goldenChance,
  hasMonsoon,
  ladybugMayAppear,
  type DropKind,
  soakDrop,
  spawnInterval,
} from "@/lib/home/garden";

/**
 * The garden's window: raindrops run down it, and clicking (or tapping, or
 * pressing Space) catches them for drops. Golden ones are worth far more.
 * Drops left to land still pay a little, which rich soil raises. Now and
 * then a diamond drop falls, worth five golden ones and followed by a golden
 * shower; and a ladybug may crawl along the soil, bringing luck if caught.
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
  kind: DropKind;
  age: number;
  life: number;
}

/** Which palette a spark or floater is drawn in. */
type Tone = "rain" | "gold" | "diamond" | "bug";

interface Ladybug {
  x: number;
  dir: 1 | -1;
  speed: number;
  age: number;
  /** Only with reduced motion, when it sits still and then leaves. */
  life: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  tone: Tone;
}
interface Floater {
  x: number;
  y: number;
  text: string;
  age: number;
  tone: Tone;
  /** A landed drop's small payout, shown smaller and dimmer than a catch. */
  faint?: boolean;
}

const MAX_DROPS = 12;
const DIAMOND = "#c8f6ff";
const BUG = "#e5483f";
/** Chance a ladybug appears in any second it is allowed to: one every few
 *  minutes on average. */
const LADYBUG_PER_SECOND = 1 / 150;

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

    let bug: Ladybug | null = null;
    let bugClock = 0;

    const spawn = (stagger = 0, force?: DropKind) => {
      const s = gardenStore.get();
      const roll = Math.random();
      const kind: DropKind =
        force ?? (roll < DIAMOND_CHANCE ? "diamond" : roll < goldenChance(s) ? "golden" : "plain");
      const r = lerp(6, 8.5, Math.random()) * (kind === "diamond" ? 1.15 : 1);
      drops.push({
        x: lerp(r * 2, w - r * 2, Math.random()),
        y: reduced ? lerp(h * 0.15, h * 0.75, Math.random()) : -r * 2 - stagger,
        r,
        vy: reduced ? 0 : lerp(55, 95, Math.random()),
        sway: Math.random() * Math.PI * 2,
        kind,
        age: 0,
        life: reduced ? 4 : Infinity,
      });
    };

    const burst = (x: number, y: number, tone: Tone, count: number, power: number) => {
      for (let i = 0; i < count; i++) {
        const a = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.2;
        const v = power * lerp(0.5, 1, Math.random());
        particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, age: 0, life: lerp(0.4, 0.7, Math.random()), tone });
      }
    };

    const toneOf = (kind: DropKind): Tone => (kind === "diamond" ? "diamond" : kind === "golden" ? "gold" : "rain");

    const take = (i: number) => {
      const d = drops[i];
      drops.splice(i, 1);
      const value = catchDrop(d.kind);
      // Showers are staggered so they fall in a ragged line, not one row. A
      // diamond always brings golden ones; Monsoon makes golden bring plain.
      if (d.kind === "diamond") {
        for (let k = 0; k < DIAMOND_SHOWER; k++) spawn(k * 22, "golden");
      } else if (d.kind === "golden" && hasMonsoon(gardenStore.get())) {
        for (let k = 0; k < 5; k++) spawn(k * 18, "plain");
      }
      const big = { plain: [8, 110], golden: [14, 150], diamond: [26, 190] }[d.kind];
      burst(d.x, d.y, toneOf(d.kind), big[0], big[1]);
      floaters.push({ x: d.x, y: d.y - d.r * 2, text: `+${formatNumber(value)}`, age: 0, tone: toneOf(d.kind) });
    };

    const soak = (x: number, y: number) => {
      floaters.push({ x, y, text: `+${formatNumber(soakDrop())}`, age: 0, tone: "rain", faint: true });
    };

    /** The ladybug walks along the soil, just above the bottom edge. */
    const bugY = () => h - 5;

    const takeBug = () => {
      if (!bug) return;
      catchLadybug();
      burst(bug.x, bugY(), "bug", 12, 120);
      floaters.push({ x: bug.x, y: bugY() - 14, text: "lucky!", age: 0, tone: "bug" });
      bug = null;
    };

    const onPointer = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      // The ladybug first: it is the rarer catch, and it sits low, under
      // whatever drop is about to land.
      if (bug && Math.hypot(bug.x - px, bugY() - py) < 20) return takeBug();
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
        if (d.kind === "diamond") {
          fill.addColorStop(0, "#ffffff");
          fill.addColorStop(0.5, DIAMOND);
          fill.addColorStop(1, "#b9a8ff");
          ctx.shadowColor = DIAMOND;
          ctx.shadowBlur = 20;
        } else if (d.kind === "golden") {
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
        if (d.kind === "diamond") {
          // A turning four-point glint, so it reads as a gem from across the room.
          const glint = d.r * (1.6 + Math.sin(t * 6 + d.sway) * 0.5);
          ctx.save();
          ctx.translate(x + d.r * 0.5, d.y - d.r * 0.9);
          ctx.rotate(t * 1.5);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          for (let k = 0; k < 2; k++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.ellipse(0, 0, glint, glint * 0.12, 0, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;

      if (bug) {
        const y = bugY();
        ctx.globalAlpha = reduced ? Math.min(1, bug.age * 3, (bug.life - bug.age) * 2) : 1;
        ctx.save();
        ctx.translate(bug.x, y);
        ctx.scale(bug.dir, 1);
        // Legs, three a side, scuttling.
        ctx.strokeStyle = "#1b1414";
        ctx.lineWidth = 1;
        for (let k = -1; k <= 1; k++) {
          const step = reduced ? 0 : Math.sin(t * 18 + k * 2) * 1.6;
          ctx.beginPath();
          ctx.moveTo(k * 3, 1);
          ctx.lineTo(k * 3 + step, 4.5);
          ctx.stroke();
        }
        ctx.fillStyle = "#1b1414";
        ctx.beginPath();
        ctx.arc(6, -1, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = BUG;
        ctx.shadowColor = BUG;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(0, -1.5, 6.5, 4.8, 0, Math.PI, 0);
        ctx.lineTo(6.5, 1.2);
        ctx.lineTo(-6.5, 1.2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#1b1414";
        ctx.beginPath();
        ctx.moveTo(0, -6.2);
        ctx.lineTo(0, 1.2);
        ctx.stroke();
        ctx.fillStyle = "#1b1414";
        for (const [sx, sy] of [[-3.4, -2.6], [3.2, -3], [-2, 0], [2.4, -0.2]]) {
          ctx.beginPath();
          ctx.arc(sx, sy, 1.1, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
      }

      for (const p of particles) {
        ctx.globalAlpha = 1 - p.age / p.life;
        ctx.fillStyle = p.tone === "gold" ? gold : p.tone === "diamond" ? DIAMOND : p.tone === "bug" ? BUG : rain;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.textAlign = "center";
      for (const f of floaters) {
        ctx.font = `${f.faint ? 11 : 16}px ${pixelFont}`;
        ctx.globalAlpha = Math.max(0, 1 - f.age / 0.9) * (f.faint ? 0.55 : 1);
        ctx.fillStyle = f.tone === "gold" ? gold : f.tone === "diamond" ? DIAMOND : f.tone === "bug" ? "#ffb3ad" : "#eaf6fb";
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

      // Once a second, maybe a ladybug: never within ten minutes of the last.
      bugClock += dt;
      if (bugClock >= 1) {
        bugClock = 0;
        if (!bug && w > 0 && ladybugMayAppear(gardenStore.get()) && Math.random() < LADYBUG_PER_SECOND) {
          const dir = Math.random() < 0.5 ? 1 : -1;
          bug = reduced
            ? { x: lerp(w * 0.2, w * 0.8, Math.random()), dir, speed: 0, age: 0, life: 15 }
            : { x: dir === 1 ? -12 : w + 12, dir, speed: lerp(14, 20, Math.random()), age: 0, life: Infinity };
        }
      }
      if (bug) {
        bug.age += dt;
        bug.x += bug.dir * bug.speed * dt;
        if (bug.x < -20 || bug.x > w + 20 || bug.age > bug.life) bug = null;
      }

      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.age += dt;
        d.y += d.vy * dt;
        if (d.y + d.r >= h) {
          burst(d.x, h - 1, toneOf(d.kind), 5, 70);
          drops.splice(i, 1);
          soak(d.x, h - 8);
        } else if (d.age > d.life) {
          // Reduced motion: beaded drops fade rather than land, and pay the same.
          drops.splice(i, 1);
          soak(d.x, d.y);
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
