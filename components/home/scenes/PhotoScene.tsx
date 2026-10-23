"use client";

import type { CSSProperties, ReactNode } from "react";
import { lerp, seeded } from "./canvas";

/**
 * Picture scenes: photographs with a little motion layered on. Each photo
 * sits in a box with its own aspect ratio, sized to cover the window, so
 * anything placed on it (glitter on the sea, fireflies in the grass) can be
 * given in the photo's own percentages and stays put at any window shape.
 *
 * The motion is all CSS transform and opacity, so the photograph itself is
 * never repainted.
 */

export type PhotoId = "aurora" | "forest" | "space" | "sunset";

const ASPECT: Record<PhotoId, number> = {
  aurora: 16 / 9,
  forest: 2560 / 1667,
  space: 16 / 9,
  sunset: 16 / 9,
};

export const photoSrc = (id: PhotoId) => `/home/scenes/${id}.webp`;
export const photoThumb = (id: PhotoId) => `/home/scenes/${id}-thumb.webp`;

type Pt = [x: number, y: number];

/** A box in the photo's proportions that covers the viewport, centred. */
const CoverBox = ({ id, children }: { id: PhotoId; children?: ReactNode }) => {
  const ar = ASPECT[id];
  return (
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      style={{ width: `max(100vw, calc(100dvh * ${ar}))`, height: `max(100dvh, calc(100vw / ${ar}))` }}
    >
      {children}
    </div>
  );
};

/** Whether a point lies inside a polygon (even-odd). */
function inside([x, y]: Pt, poly: Pt[]) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/**
 * Seeded points in a box, optionally kept to a polygon, so each scene's
 * sparkles land in the same places every visit and only where they belong.
 */
function points(seed: number, count: number, box: [number, number, number, number], within?: Pt[]) {
  const rand = seeded(seed);
  const out: { x: number; y: number; a: number; b: number }[] = [];
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const p: Pt = [lerp(box[0], box[2], rand()), lerp(box[1], box[3], rand())];
    const a = rand();
    const b = rand();
    if (!within || inside(p, within)) out.push({ x: p[0], y: p[1], a, b });
  }
  return out;
}

/** Twinkling points of light: stars, glitter on water. */
const Twinkles = ({
  seed,
  count,
  box,
  within,
  color,
  size = [1, 2.4],
  speed = [2, 5],
}: {
  seed: number;
  count: number;
  box: [number, number, number, number];
  within?: Pt[];
  color: string;
  size?: [number, number];
  speed?: [number, number];
}) => (
  <>
    {points(seed, count, box, within).map((p, i) => {
      const s = lerp(size[0], size[1], p.a);
      return (
        <span
          key={i}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: s,
            height: s,
            background: color,
            boxShadow: `0 0 ${s * 3}px ${color}`,
            animation: `home-flicker ${lerp(speed[0], speed[1], p.b)}s ease-in-out ${-p.a * 5}s infinite`,
          }}
        />
      );
    })}
  </>
);

/** Motes that rise and drift: dust in the light. */
const Motes = ({ seed, count, box, color, rise = -160 }: {
  seed: number;
  count: number;
  box: [number, number, number, number];
  color: string;
  rise?: number;
}) => (
  <>
    {points(seed, count, box).map((p, i) => {
      const s = lerp(2, 4, p.a);
      const d = lerp(9, 17, p.b);
      return (
        <span
          key={i}
          className="absolute rounded-full"
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: s,
              height: s,
              background: color,
              boxShadow: `0 0 ${s * 3}px 1px ${color}`,
              "--drift": `${(p.a - 0.5) * 60}px`,
              "--rise": `${rise * lerp(0.6, 1.2, p.b)}px`,
              animation: `home-rise ${d}s ease-in-out ${-p.b * d}s infinite`,
            } as CSSProperties
          }
        />
      );
    })}
  </>
);

/** Fireflies: wandering in loops near the ground, blinking slowly. */
const Fireflies = ({ seed, count, box }: { seed: number; count: number; box: [number, number, number, number] }) => (
  <>
    {points(seed, count, box).map((p, i) => (
      <span
        key={i}
        className="absolute"
        style={
          {
            left: `${p.x}%`,
            top: `${p.y}%`,
            "--drift": `${(p.a - 0.5) * 70}px`,
            animation: `home-wander ${lerp(5, 10, p.b)}s ease-in-out ${-p.a * 8}s infinite`,
          } as CSSProperties
        }
      >
        <span
          className="block size-1.5 rounded-full bg-[#f2ff9a] shadow-[0_0_10px_3px_rgb(220_255_120/0.55)]"
          style={{ animation: `home-flicker ${lerp(2, 4.5, p.a)}s ease-in-out ${-p.b * 4}s infinite` }}
        />
      </span>
    ))}
  </>
);

/** A soft round glow, breathing in and out, blended onto the photo. */
const Glow = ({ x, y, size, color, period, delay = 0 }: { x: number; y: number; size: number; color: string; period: number; delay?: number }) => (
  <span
    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-screen"
    style={
      {
        left: `${x}%`,
        top: `${y}%`,
        width: `${size}%`,
        aspectRatio: "1",
        background: `radial-gradient(circle, ${color}, transparent 65%)`,
        "--from": 0.35,
        "--to": 1,
        animation: `home-pulse ${period}s ease-in-out ${delay}s infinite alternate`,
      } as CSSProperties
    }
  />
);

/**
 * A band of light at an angle: a sunbeam or an aurora curtain. Evenly bright
 * across most of its width with a short soft edge, and a brighter core, so
 * it reads as a shaft with a shape rather than a haze; it fades along its
 * length from a mask, and sways slowly side to side.
 */
const Beam = ({
  x,
  y,
  width,
  length,
  angle,
  color,
  period,
  delay = 0,
  fade = "linear-gradient(to bottom, transparent, black 18%, rgb(0 0 0 / 0.55) 65%, transparent)",
}: {
  x: number;
  y: number;
  width: number;
  length: number;
  angle: number;
  color: string;
  period: number;
  delay?: number;
  fade?: string;
}) => (
  <span
    className="absolute origin-top"
    style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${length}%`, transform: `rotate(${angle}deg)` }}
  >
    <span
      className="absolute inset-0 mix-blend-screen"
      style={{
        background: `linear-gradient(to right, transparent, ${color} 16%, ${color} 84%, transparent), linear-gradient(to right, transparent 30%, ${color} 50%, transparent 70%)`,
        maskImage: fade,
        WebkitMaskImage: fade,
        animation: `home-sway-beam ${period}s ease-in-out ${delay}s infinite alternate`,
      }}
    />
  </span>
);

/**
 * A veil of colour drifting over the nebula: a long band of blues, violets
 * and teals sliding slowly past, and three clouds of colour wandering and
 * fading in turn, so the hue over any part of the sky keeps changing. All
 * transform and opacity, so it costs the compositor, not a repaint.
 */
const SpaceVeil = () => (
  <span className="absolute inset-0 overflow-hidden mix-blend-screen" style={{ opacity: 0.55 }}>
    <span
      className="absolute inset-y-0 left-0 w-[300%]"
      style={{
        background:
          "linear-gradient(110deg, rgb(30 50 140 / 0.35), rgb(130 40 170 / 0.3) 20%, rgb(20 120 160 / 0.3) 40%, rgb(60 30 140 / 0.35) 60%, rgb(170 50 140 / 0.28) 80%, rgb(30 50 140 / 0.35))",
        animation: "home-veil 110s ease-in-out infinite alternate",
      }}
    />
    {[
      { x: 20, y: 30, color: "rgb(90 120 255 / 0.4)", period: 34, delay: 0 },
      { x: 65, y: 45, color: "rgb(220 90 255 / 0.32)", period: 41, delay: -14 },
      { x: 40, y: 70, color: "rgb(60 220 220 / 0.3)", period: 47, delay: -27 },
    ].map((b, i) => (
      <span
        key={i}
        className="absolute size-[70%] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          left: `${b.x}%`,
          top: `${b.y}%`,
          background: `radial-gradient(circle, ${b.color}, transparent 65%)`,
          animation: `home-roam ${b.period}s ease-in-out ${b.delay}s infinite alternate`,
        }}
      />
    ))}
  </span>
);

// The sea in the sunset, traced inside the shoreline and the rocks.
const SUNSET_WATER: Pt[] = [
  [20, 45],
  [100, 45],
  [100, 96],
  [70, 98],
  [56, 91],
  [46, 84],
  [34, 76],
  [30, 66],
  [26, 54],
];

// The aurora's curtains fade in and out along their whole length.
const CURTAIN = "linear-gradient(to bottom, transparent, black 25%, black 70%, transparent)";

const OVERLAY: Record<PhotoId, () => ReactNode> = {
  aurora: () => (
    <>
      {/* Curtains leaning as the rays in the photo do, down past the hills. */}
      <Beam x={32} y={-6} width={22} length={70} angle={22} color="rgb(110 255 205 / 0.4)" period={13} fade={CURTAIN} />
      <Beam x={46} y={-8} width={16} length={66} angle={26} color="rgb(140 245 255 / 0.34)" period={17} delay={-5} fade={CURTAIN} />
      <Beam x={20} y={-4} width={14} length={60} angle={18} color="rgb(185 140 255 / 0.3)" period={11} delay={-8} fade={CURTAIN} />
      {/* Their light on the lake. */}
      <Glow x={34} y={66} size={34} color="rgb(110 255 205 / 0.18)" period={9} />
      <Twinkles seed={5} count={26} box={[4, 3, 60, 32]} color="#ffffff" />
      <Twinkles seed={9} count={18} box={[14, 60, 56, 76]} color="#ffd6ec" size={[1, 2]} speed={[1.2, 3]} />
      <Fireflies seed={13} count={18} box={[2, 68, 98, 94]} />
    </>
  ),
  forest: () => (
    <>
      {/* Sunbeams falling from the top left, as the light in the photo does. */}
      <Beam x={-8} y={4} width={16} length={170} angle={-42} color="rgb(255 245 205 / 0.3)" period={22} />
      <Beam x={6} y={-6} width={22} length={170} angle={-44} color="rgb(255 240 190 / 0.26)" period={28} delay={-9} />
      <Beam x={24} y={-14} width={13} length={170} angle={-46} color="rgb(255 248 215 / 0.24)" period={25} delay={-15} />
      <Motes seed={17} count={26} box={[5, 30, 70, 95]} color="rgb(255 245 205 / 0.85)" rise={-120} />
    </>
  ),
  space: () => (
    <>
      <SpaceVeil />
      {/* Glows over the photo's own coloured stars. */}
      <Glow x={43} y={42} size={16} color="rgb(80 160 255 / 0.5)" period={7} />
      <Glow x={47.5} y={44} size={9} color="rgb(200 100 255 / 0.5)" period={5} delay={-2} />
      <Glow x={32} y={33} size={8} color="rgb(80 255 170 / 0.4)" period={6} delay={-3} />
      <Glow x={54} y={37} size={10} color="rgb(255 150 90 / 0.4)" period={8} delay={-1} />
      <Glow x={13} y={54} size={14} color="rgb(255 120 90 / 0.35)" period={9} delay={-4} />
      <Glow x={72} y={46} size={11} color="rgb(110 210 255 / 0.35)" period={7} delay={-5} />
      <Glow x={54} y={62} size={6} color="rgb(80 255 170 / 0.4)" period={5} delay={-2.5} />
      <Twinkles seed={41} count={60} box={[0, 0, 100, 100]} color="#ffffff" size={[0.8, 2.2]} speed={[2, 6]} />
      {[0, -6, -11].map((delay, i) => (
        <span
          key={i}
          className="absolute h-px w-24 bg-[linear-gradient(to_left,transparent,white)]"
          style={{ left: `${60 + i * 12}%`, top: `${12 + i * 14}%`, animation: `home-shoot 17s ease-out ${delay}s infinite` }}
        />
      ))}
    </>
  ),
  sunset: () => (
    <>
      <Glow x={47.5} y={41} size={30} color="rgb(255 170 120 / 0.45)" period={7} />
      {/* Glitter only on the water: thickest in the sun's path. */}
      <Twinkles seed={53} count={44} box={[41, 45, 56, 72]} within={SUNSET_WATER} color="#fff0d8" size={[1.2, 2.8]} speed={[0.8, 2]} />
      <Twinkles seed={59} count={34} box={[26, 46, 100, 96]} within={SUNSET_WATER} color="#ffd6ef" size={[1, 2]} speed={[1, 2.6]} />
    </>
  ),
};

/** How each photo moves as a whole: a slow zoom, or for the nebula a turn. */
const MOTION: Partial<Record<PhotoId, string>> = {
  sunset: "home-slow-zoom 120s ease-in-out infinite alternate",
  aurora: "home-slow-zoom 140s ease-in-out infinite alternate",
  space: "home-turn 60s ease-in-out infinite alternate",
};

const PhotoScene = ({ id }: { id: PhotoId }) => (
  <div data-home-photo className="absolute inset-0 overflow-hidden">
    <CoverBox id={id}>
      <div className="absolute inset-0 origin-center" style={{ animation: MOTION[id] }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a full-bleed background; next/image adds nothing here */}
        <img src={photoSrc(id)} alt="" draggable={false} className="absolute inset-0 size-full object-cover select-none" />
        {OVERLAY[id]()}
      </div>
    </CoverBox>
    {/* A little weight at the edges, where the cards sit. */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.35)_100%)]" />
  </div>
);

export default PhotoScene;
