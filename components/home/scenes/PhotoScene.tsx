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

export type PhotoId = "aurora" | "forest" | "space" | "sunset" | "alps" | "autumn" | "majula" | "moonlight";

const ASPECT: Record<PhotoId, number> = {
  aurora: 16 / 9,
  forest: 2560 / 1667,
  space: 16 / 9,
  sunset: 16 / 9,
  alps: 16 / 9,
  autumn: 3 / 2,
  majula: 16 / 9,
  moonlight: 16 / 9,
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

/**
 * A long soft streak of cloud drifting to and fro across the sky, blended
 * onto the photo so it thickens what's there rather than pasting over it.
 */
const CloudStreak = ({
  x,
  y,
  width,
  height,
  color,
  period,
  delay = 0,
  travel = 12,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  period: number;
  delay?: number;
  /** How far it drifts each way, in % of its own width. */
  travel?: number;
}) => (
  <span
    className="absolute -translate-x-1/2 -translate-y-1/2"
    style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${height}%` }}
  >
    <span
      className="absolute inset-0 mix-blend-screen"
      style={
        {
          background: `radial-gradient(ellipse closest-side, ${color}, transparent)`,
          "--dx": `${travel}%`,
          animation: `home-drift ${period}s ease-in-out ${delay}s infinite alternate`,
        } as CSSProperties
      }
    />
  </span>
);

/** Tiles for falling rain and snow, drawn once as SVG. 200px square, so a
 *  layer sliding down by whole tiles loops without a seam. */
const svgTile = (body: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'>${body}</svg>`)}")`;

const RAIN_TILE = svgTile(
  points(71, 14, [0, 0, 100, 100])
    .map((p) => `<line x1='${p.x * 2}' y1='${p.y * 2}' x2='${p.x * 2}' y2='${p.y * 2 + 18 + p.a * 22}' stroke='white' stroke-opacity='${(0.25 + p.b * 0.4).toFixed(2)}' stroke-width='1'/>`)
    .join(""),
);

const snowTile = (seed: number, count: number, size: [number, number]) =>
  svgTile(
    points(seed, count, [0, 0, 100, 100])
      .map((p) => `<circle cx='${p.x * 2}' cy='${p.y * 2}' r='${lerp(size[0], size[1], p.a).toFixed(1)}' fill='white' fill-opacity='${(0.5 + p.b * 0.5).toFixed(2)}'/>`)
      .join(""),
  );

/**
 * A sheet of falling rain or snow: a tile repeated over the scene, sliding
 * down two tiles a loop. `scale` sizes the tile, so a nearer layer can have
 * bigger, faster drops; `sway` swings snow gently side to side.
 */
const Fall = ({
  tile,
  period,
  scale = 1,
  opacity = 1,
  sway,
}: {
  tile: string;
  period: number;
  scale?: number;
  opacity?: number;
  sway?: number;
}) => {
  const size = 200 * scale;
  return (
    <span
      className="absolute -inset-x-[5%] inset-y-0 overflow-hidden"
      style={sway ? ({ "--drift": `${sway}px`, animation: `home-wander ${period * 1.7}s ease-in-out infinite` } as CSSProperties) : undefined}
    >
      <span
        className="absolute inset-x-0 bottom-0"
        style={
          {
            top: -size * 2,
            opacity,
            backgroundImage: tile,
            backgroundSize: `${size}px ${size}px`,
            "--tile": `${size * 2}px`,
            animation: `home-fall-sheet ${period}s linear infinite`,
          } as CSSProperties
        }
      />
    </span>
  );
};

/** Leaves drifting down, each turning over as it falls. */
const Leaves = ({ seed, count, box }: { seed: number; count: number; box: [number, number, number, number] }) => {
  const colours = ["#ff6a2a", "#ffa733", "#d9441f", "#ffd25a", "#b8391c"];
  return (
    <>
      {points(seed, count, box).map((p, i) => {
        const d = lerp(10, 20, p.b);
        const s = lerp(12, 22, p.a);
        return (
          <span
            key={i}
            className="absolute"
            style={
              {
                left: `${p.x}%`,
                top: `${p.y}%`,
                "--drift": `${lerp(-120, 160, p.a)}px`,
                "--fall": `${lerp(55, 90, p.b)}vh`,
                "--spin": `${lerp(-300, 300, p.b)}deg`,
                animation: `home-leaf ${d}s linear ${-p.a * d}s infinite`,
              } as CSSProperties
            }
          >
            <span
              className="block"
              style={{
                width: s,
                height: s * 0.7,
                background: colours[i % colours.length],
                borderRadius: "0 80% 0 80%",
                // A dark edge, so it stands out from the leaves still on the trees.
                boxShadow: "0 1px 4px rgb(30 10 0 / 0.6)",
                animation: `home-flutter ${lerp(1.2, 2.4, p.a)}s ease-in-out ${-p.b * 2}s infinite alternate`,
              }}
            />
          </span>
        );
      })}
    </>
  );
};

/**
 * A bonfire: tongues of flame licking upward from its base, each flickering
 * at its own pace, over a glow that breathes with them. (x, y) is the base
 * of the fire, `size` its height, all in % of the photo.
 */
const Fire = ({ x, y, size }: { x: number; y: number; size: number }) => (
  <span className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: 0, height: 0 }}>
    {[
      { dx: 0, w: 0.55, h: 1, color: "255 190 90", period: 0.9, delay: 0 },
      { dx: -0.22, w: 0.4, h: 0.72, color: "255 140 50", period: 0.7, delay: -0.3 },
      { dx: 0.24, w: 0.38, h: 0.66, color: "255 150 60", period: 0.8, delay: -0.5 },
      { dx: 0.05, w: 0.28, h: 0.55, color: "255 240 190", period: 0.6, delay: -0.2 },
    ].map((f, i) => (
      <span
        key={i}
        className="absolute bottom-0 origin-bottom mix-blend-screen"
        style={{
          left: `${f.dx * size}vh`,
          width: `${f.w * size}vh`,
          height: `${f.h * size}vh`,
          transform: "translateX(-50%)",
          background: `radial-gradient(ellipse 50% 60% at 50% 70%, rgb(${f.color} / 0.95), rgb(${f.color} / 0.45) 45%, transparent 70%)`,
          borderRadius: "50% 50% 45% 45% / 70% 70% 30% 30%",
          animation: `home-flame ${f.period}s ease-in-out ${f.delay}s infinite alternate`,
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
          // Hidden unless animating: with reduced motion they'd sit there as lines.
          style={{ left: `${60 + i * 12}%`, top: `${12 + i * 14}%`, opacity: 0, animation: `home-shoot 17s ease-out ${delay}s infinite` }}
        />
      ))}
    </>
  ),
  alps: () => (
    <>
      {/* Long streaks of cloud drifting over the peaks. */}
      <CloudStreak x={30} y={9} width={70} height={9} color="rgb(255 255 255 / 0.45)" period={70} />
      <CloudStreak x={72} y={17} width={60} height={8} color="rgb(240 248 255 / 0.4)" period={90} delay={-30} />
      <CloudStreak x={50} y={30} width={80} height={7} color="rgb(255 255 255 / 0.3)" period={110} delay={-55} />
      <CloudStreak x={15} y={36} width={50} height={6} color="rgb(235 245 255 / 0.28)" period={80} delay={-12} />
      {/* A light rain, two sheets deep. */}
      <Fall tile={RAIN_TILE} period={1.6} opacity={0.35} />
      <Fall tile={RAIN_TILE} period={1.1} scale={1.6} opacity={0.25} />
    </>
  ),
  autumn: () => (
    <>
      {/* Warm light wandering through the canopy and over the path. */}
      <Glow x={48} y={42} size={42} color="rgb(255 190 110 / 0.35)" period={9} />
      <Glow x={22} y={28} size={30} color="rgb(255 140 60 / 0.3)" period={12} delay={-4} />
      <Glow x={70} y={60} size={34} color="rgb(255 110 60 / 0.25)" period={14} delay={-7} />
      <Glow x={45} y={85} size={40} color="rgb(255 120 70 / 0.25)" period={11} delay={-2} />
      <Motes seed={83} count={14} box={[30, 40, 70, 80]} color="rgb(255 215 150 / 0.7)" rise={-90} />
      <Leaves seed={89} count={34} box={[0, -8, 100, 40]} />
    </>
  ),
  majula: () => (
    <>
      {/* The bonfire's light on the stones, breathing with the flames. */}
      <Glow x={43.5} y={74} size={34} color="rgb(255 160 70 / 0.45)" period={1.7} />
      <Glow x={43.5} y={76} size={14} color="rgb(255 210 130 / 0.55)" period={0.9} delay={-0.4} />
      <Fire x={43.5} y={78} size={9} />
      <Motes seed={97} count={26} box={[40, 58, 47, 76]} color="rgb(255 150 60 / 0.95)" rise={-260} />
      <Motes seed={101} count={10} box={[41, 62, 46, 74]} color="rgb(255 220 150 / 0.9)" rise={-180} />
    </>
  ),
  moonlight: () => (
    <>
      <Glow x={60} y={21} size={22} color="rgb(210 230 255 / 0.4)" period={8} />
      {/* Streaks of white cloud moving past the moon. */}
      <CloudStreak x={40} y={12} width={70} height={8} color="rgb(230 240 255 / 0.32)" period={80} />
      <CloudStreak x={70} y={24} width={55} height={7} color="rgb(220 235 255 / 0.3)" period={100} delay={-40} />
      <CloudStreak x={25} y={32} width={60} height={6} color="rgb(230 240 255 / 0.22)" period={95} delay={-20} />
      {/* Snow, a far sheet of fine flakes and a nearer one of bigger flakes. */}
      <Fall tile={snowTile(103, 26, [0.6, 1.4])} period={16} opacity={0.6} sway={18} />
      <Fall tile={snowTile(107, 12, [1.2, 2.4])} period={10} scale={1.5} opacity={0.75} sway={30} />
      <Frost id="moonlight" />
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

/** Fine white speckle for frost on glass: sparse grains from fractal noise. */
const FROST_GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='240' height='240'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1.7 -0.6'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23f)'/%3E%3C/svg%3E";

/** Where the frost gathers: thick at the edges of the pane, clear in the middle. */
const FROST_EDGE = "radial-gradient(ellipse at center, transparent 42%, rgb(0 0 0 / 0.55) 68%, black 92%)";

/**
 * Frost on the window: the view goes soft and pale towards the edges of the
 * pane, with a fine grain of ice crystals over it. The blurred copy is drawn
 * once and only moves with the photo, so the snow never makes it repaint.
 */
function Frost({ id }: { id: PhotoId }) {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element -- a blurred copy of the background */}
      <img
        src={photoSrc(id)}
        alt=""
        draggable={false}
        className="absolute inset-0 size-full scale-105 object-cover blur-[8px] brightness-110 saturate-[0.8] select-none"
        style={{ maskImage: FROST_EDGE, WebkitMaskImage: FROST_EDGE }}
      />
      <span
        className="absolute inset-0 mix-blend-screen"
        style={{
          backgroundImage: `url("${FROST_GRAIN}")`,
          backgroundSize: "240px",
          opacity: 0.5,
          maskImage: FROST_EDGE,
          WebkitMaskImage: FROST_EDGE,
        }}
      />
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_48%,rgb(225_238_255/0.16)_100%)]" />
      <FrostBlooms />
    </>
  );
}

/** Where frost gathers across the pane, and how long each patch takes. */
const BLOOMS = [
  { x: 30, y: 38, size: 34, period: 23, delay: 0 },
  { x: 62, y: 58, size: 40, period: 29, delay: -9 },
  { x: 48, y: 22, size: 26, period: 19, delay: -14 },
  { x: 18, y: 70, size: 30, period: 26, delay: -5 },
  { x: 80, y: 32, size: 28, period: 31, delay: -20 },
  { x: 50, y: 80, size: 36, period: 24, delay: -12 },
];

/**
 * Frost across the whole pane, not only its edges: a faint grain over all
 * the glass, patches of crystals that slowly spread and thaw in turn, and
 * a fog of condensation drifting over it. Transform and opacity only.
 */
function FrostBlooms() {
  const grain = `url("${FROST_GRAIN}")`;
  return (
    <>
      <span className="absolute inset-0 mix-blend-screen" style={{ backgroundImage: grain, backgroundSize: "240px", opacity: 0.16 }} />
      <span
        className="absolute -inset-[10%] bg-[radial-gradient(ellipse_at_30%_40%,rgb(220_235_255/0.14),transparent_55%),radial-gradient(ellipse_at_70%_65%,rgb(220_235_255/0.12),transparent_50%)]"
        style={{ animation: "home-fog 40s ease-in-out infinite alternate" }}
      />
      {BLOOMS.map((b, i) => {
        const mask = "radial-gradient(circle, black 20%, rgb(0 0 0 / 0.5) 45%, transparent 70%)";
        return (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${b.x}%`, top: `${b.y}%`, width: `${b.size}%`, aspectRatio: "1" }}
          >
            <span
              className="absolute inset-0 mix-blend-screen"
              style={{
                background: `${grain} 0 0 / 200px, radial-gradient(circle, rgb(235 244 255 / 0.28), rgb(235 244 255 / 0.08) 55%, transparent 70%)`,
                maskImage: mask,
                WebkitMaskImage: mask,
                animation: `home-frost ${b.period}s ease-in-out ${b.delay}s infinite alternate`,
              }}
            />
          </span>
        );
      })}
    </>
  );
}

/**
 * How each photo moves as a whole: a slow zoom and pan. (Never a rotation:
 * Chrome draws a turning layer tile by tile, and on a dark photo the seams
 * between tiles show as faint straight lines.)
 */
const MOTION: Partial<Record<PhotoId, string>> = {
  sunset: "home-slow-zoom 120s ease-in-out infinite alternate",
  aurora: "home-slow-zoom 140s ease-in-out infinite alternate",
  space: "home-slow-zoom 90s ease-in-out infinite alternate",
  alps: "home-slow-zoom 150s ease-in-out infinite alternate",
  moonlight: "home-slow-zoom 130s ease-in-out infinite alternate",
};

/**
 * Photos seen through glass go soft, as the rainy window's city does; what's
 * layered on them (snow, frost) stays sharp, on or near the pane. Scaled up a
 * little so the blur never shows a soft edge.
 */
const BEHIND_GLASS: Partial<Record<PhotoId, string>> = {
  moonlight: "scale-[1.05] blur-[3px] saturate-[1.1]",
};

const PhotoScene = ({ id }: { id: PhotoId }) => (
  <div data-home-photo className="absolute inset-0 overflow-hidden">
    <CoverBox id={id}>
      <div className="absolute inset-0 origin-center" style={{ animation: MOTION[id] }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a full-bleed background; next/image adds nothing here */}
        <img
          src={photoSrc(id)}
          alt=""
          draggable={false}
          className={`absolute inset-0 size-full object-cover select-none ${BEHIND_GLASS[id] ?? ""}`}
        />
        {OVERLAY[id]()}
      </div>
    </CoverBox>
    {/* A little weight at the edges, where the cards sit. */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.35)_100%)]" />
  </div>
);

export default PhotoScene;
