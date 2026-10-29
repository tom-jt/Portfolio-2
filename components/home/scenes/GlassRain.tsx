"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { animate, cappedDpr, fitCanvas, lerp, onResize } from "./canvas";

/**
 * Rain on a window pane, over whatever view is behind it: drops landing on
 * the glass, a few growing heavy enough to run down, swallowing the drops in
 * their path and leaving a trail of beads behind, and (if the view has none
 * of its own) rain falling outside. One canvas, the size of the screen.
 */

type Rgb = string;

/** What the drops look like against the view: the light they gather, and
 *  the tint of their bodies. */
export interface GlassLook {
  /** The light a drop gathers along its lower edge, high on the pane. */
  high: Rgb;
  /** And low on the pane. */
  low: Rgb;
  /** How far down the pane the low light starts, 0 to 1. */
  split: number;
  /** The drop's body, from its middle to its rim. */
  body: [string, string, string];
  /** Draw rain falling outside, for a view that has none of its own. */
  streaks?: boolean;
}

/** At night, over a city: drops nearly clear and a little darker than what's
 *  behind them, low ones catching the warm street light, high ones the
 *  cooler sky. */
export const NIGHT_GLASS: GlassLook = {
  high: "176,204,255",
  low: "255,206,150",
  split: 0.55,
  body: ["rgba(150,170,215,0.08)", "rgba(20,28,52,0.28)", "rgba(4,8,20,0.6)"],
  streaks: true,
};

/**
 * A drop on glass: tinted by its body, with a bright crescent along its
 * lower edge where it gathers the light, and a pin of reflection on top.
 */
function dropSprite(r: number, dpr: number, light: Rgb, body: GlassLook["body"]) {
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

  const fill = g.createRadialGradient(c, c - r * 0.3, r * 0.1, c, c, r);
  fill.addColorStop(0, body[0]);
  fill.addColorStop(0.75, body[1]);
  fill.addColorStop(1, body[2]);
  g.fillStyle = fill;
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

const GlassRain = ({ look, className = "" }: { look: GlassLook; className?: string }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const front = ref.current;
    if (!front) return;

    let stop = () => {};

    const setup = () => {
      stop();
      const dpr = cappedDpr(1.5);
      const { ctx, w, h } = fitCanvas(front, dpr);
      const sprites = (light: Rgb): Sprite[] =>
        Array.from({ length: 9 }, (_, i) => dropSprite(i + 1, dpr, light, look.body));
      const lowSprites = sprites(look.low);
      const highSprites = sprites(look.high);
      const spriteFor = (bead: Bead) => {
        const set = bead.y > h * look.split ? lowSprites : highSprites;
        return set[Math.min(set.length - 1, Math.max(0, Math.round(bead.r) - 1))];
      };
      const drawBead = (bead: Bead, alpha = 1, stretch = 1, into = ctx) => {
        const s = spriteFor(bead);
        const k = bead.r / s.r;
        const size = (s.r + s.pad) * 2 * k;
        into.globalAlpha = alpha;
        into.drawImage(s.canvas, bead.x - size / 2, bead.y - (size * stretch) / 2, size, size * stretch);
      };

      // The resting beads: hundreds of them, and most frames none changes, so
      // they live on a layer of their own rather than being drawn one by one
      // every frame. A bead that lands is added to it as it lands; one that a
      // runner swallows has the layer redrawn, at most ten times a second.
      // (It sits under the runner that took it, so the wait never shows.)
      const beadLayer = document.createElement("canvas");
      beadLayer.width = front.width;
      beadLayer.height = front.height;
      const beadCtx = beadLayer.getContext("2d")!;
      beadCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      let beadsGone = true;
      let redrawnAt = -Infinity;
      const addBead = (bead: Bead) => {
        beads.push(bead);
        drawBead(bead, 1, 1, beadCtx);
      };
      const drawBeads = (now: number) => {
        if (beadsGone && now - redrawnAt >= 0.1) {
          beadCtx.clearRect(0, 0, w, h);
          for (const bead of beads) drawBead(bead, 1, 1, beadCtx);
          beadsGone = false;
          redrawnAt = now;
        }
        ctx.globalAlpha = 1;
        ctx.drawImage(beadLayer, 0, 0, w, h);
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

      const streakCount = look.streaks ? Math.min(260, Math.max(80, Math.round(area / 7000))) : 0;
      const streaks: Streak[][] = STREAK_LAYERS.map((layer) =>
        Array.from({ length: Math.round(streakCount * layer.share) }, () => ({
          x: Math.random() * w,
          y: Math.random() * h,
          len: lerp(layer.len[0], layer.len[1], Math.random()),
          speed: lerp(layer.speed[0], layer.speed[1], Math.random()),
        })),
      );

      const drawGlass = (now = 0) => {
        for (const t of trails) drawBead(t, Math.min(1, t.life / t.max) * 0.9);
        drawBeads(now);
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

      stop = animate((t, dt) => {
        ctx.clearRect(0, 0, w, h);

        // Rain outside the window.
        if (streakCount) {
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
        }

        // New drops landing on the glass.
        beadClock += dt * 26;
        while (beadClock >= 1) {
          beadClock -= 1;
          if (beads.length < beadTarget) addBead(newBead());
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
      });
    };

    setup();
    const stopResize = onResize(setup);
    return () => {
      stop();
      stopResize();
    };
  }, [reduced, look]);

  return <canvas ref={ref} className={`absolute inset-0 h-full w-full ${className}`} />;
};

export default GlassRain;
