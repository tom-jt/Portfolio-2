"use client";

import type { CSSProperties, ReactNode } from "react";
import { seeded } from "@/components/home/scenes/canvas";
import type { DecorId } from "@/lib/home/cosmetics";

/**
 * Seasonal and holiday decor for the garden window: a few dozen small
 * elements moved by CSS animations, so it costs next to nothing beside the
 * catch game's canvas. Layout is seeded, so a decor looks the same on every
 * visit. With reduced motion each piece rests where it would be mid-fall.
 */

type Piece = { left: number; size: number; duration: number; delay: number; drift: number; spin: number; rest: number };

function pieces(seed: number, count: number, size: [number, number], duration: [number, number]): Piece[] {
  const rand = seeded(seed);
  const between = ([a, b]: [number, number]) => a + (b - a) * rand();
  return Array.from({ length: count }, () => {
    const d = between(duration);
    return {
      left: rand() * 100,
      size: between(size),
      duration: d,
      // Negative, so the window is already full when it opens.
      delay: -rand() * d,
      drift: (rand() - 0.5) * 70,
      spin: (rand() - 0.5) * 720,
      rest: 15 + rand() * 170,
    };
  });
}

/** A piece that falls the height of the window, drifting and spinning. */
const Faller = ({ p, children }: { p: Piece; children: ReactNode }) => (
  <span
    data-fall
    className="absolute top-0"
    style={
      {
        left: `${p.left}%`,
        width: p.size,
        height: p.size,
        "--drift": `${p.drift}px`,
        "--spin": `${p.spin}deg`,
        "--rest": `${p.rest}px`,
        animation: `home-fall ${p.duration}s linear ${p.delay}s infinite`,
      } as CSSProperties
    }
  >
    {children}
  </span>
);

const Petal = ({ hue }: { hue: string }) => (
  <svg viewBox="0 0 10 10" className="size-full">
    <path d="M5 0 C9 2 9 7 5 10 C1 7 1 2 5 0Z" fill={hue} opacity="0.9" />
  </svg>
);

const Leaf = ({ hue }: { hue: string }) => (
  <svg viewBox="0 0 10 10" className="size-full">
    <path d="M1 9 C1 3 4 1 9 1 C9 6 7 9 1 9Z" fill={hue} />
    <path d="M1.5 8.5 L8 2" stroke="rgb(0 0 0 / 0.25)" strokeWidth="0.6" />
  </svg>
);

const Flake = () => <span className="block size-full rounded-full bg-white/80 shadow-[0_0_4px_rgb(255_255_255/0.6)]" />;

const Snow = ({ seed, count }: { seed: number; count: number }) => (
  <>
    {pieces(seed, count, [2, 4.5], [7, 12]).map((p, i) => (
      <Faller key={i} p={p}>
        <Flake />
      </Faller>
    ))}
  </>
);

const Pumpkin = ({ className, delay }: { className: string; delay: number }) => (
  <svg viewBox="0 0 24 20" className={className} aria-hidden="true">
    <path d="M12 4 C12 2 13 1 14.5 0.6" stroke="#4f6b32" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    <ellipse cx="7" cy="12" rx="6" ry="7" fill="#d8691e" />
    <ellipse cx="17" cy="12" rx="6" ry="7" fill="#d8691e" />
    <ellipse cx="12" cy="12" rx="6.5" ry="7.6" fill="#ee7d25" />
    <g fill="#ffd36b" style={{ animation: `home-flicker 2.6s ease-in-out ${delay}s infinite` }}>
      <path d="M7.5 9.5 l2 2.6 h-4 Z" />
      <path d="M16.5 9.5 l2 2.6 h-4 Z" />
      <path d="M7 14.5 q5 3.4 10 0 l-1.6 1.4 -1.3 -1 -1.1 1.2 -1.1 -1.2 -1.3 1 Z" />
    </g>
  </svg>
);

const Lantern = ({ left, length, delay }: { left: string; length: number; delay: number }) => (
  <span
    className="absolute top-0 origin-top"
    style={{ left, animation: `home-sway 3.4s ease-in-out ${delay}s infinite alternate` }}
  >
    <span className="mx-auto block w-px bg-[#e6b450]/70" style={{ height: length }} />
    <svg viewBox="0 0 20 30" className="block w-5" aria-hidden="true">
      <rect x="6" y="0" width="8" height="3" rx="1" fill="#e6b450" />
      <ellipse cx="10" cy="13" rx="9" ry="10" fill="#d62e2e" />
      <ellipse cx="10" cy="13" rx="9" ry="10" fill="url(#lantern-glow)" />
      <path d="M4 6 Q10 13 4 20 M16 6 Q10 13 16 20 M10 3 V23" stroke="#a51d1d" strokeWidth="0.8" fill="none" />
      <rect x="6" y="22" width="8" height="2.5" rx="1" fill="#e6b450" />
      <path d="M8.5 25 V30 M10 25 V30.5 M11.5 25 V30" stroke="#e6b450" strokeWidth="0.8" />
    </svg>
  </span>
);

const BULBS = ["#ff5f5f", "#ffd35c", "#6fe08a", "#6fb8ff", "#ff8fe0"];
/** Four dips of fairy-light wire across the top, in a 100×14 box. */
const WIRE = "M0 2 Q12.5 12 25 2 Q37.5 12 50 2 Q62.5 12 75 2 Q87.5 12 100 2";

const DECOR: Record<DecorId, () => ReactNode> = {
  spring: () =>
    pieces(11, 12, [6, 9], [9, 15]).map((p, i) => (
      <Faller key={i} p={p}>
        <Petal hue={i % 3 ? "#f7b6cb" : "#fde3ec"} />
      </Faller>
    )),
  summer: () => {
    const rand = seeded(23);
    return Array.from({ length: 9 }, (_, i) => (
      <span
        key={i}
        className="absolute"
        style={
          {
            left: `${8 + rand() * 84}%`,
            top: `${20 + rand() * 55}%`,
            "--drift": `${(rand() - 0.5) * 40}px`,
            animation: `home-wander ${6 + rand() * 5}s ease-in-out ${-rand() * 6}s infinite`,
          } as CSSProperties
        }
      >
        <span
          className="block size-1.5 rounded-full bg-[#e9ff8a] shadow-[0_0_8px_2px_rgb(220_255_120/0.6)]"
          style={{ animation: `home-flicker ${1.8 + rand() * 2}s ease-in-out ${-rand() * 3}s infinite` }}
        />
      </span>
    ));
  },
  autumn: () =>
    pieces(37, 10, [8, 12], [8, 13]).map((p, i) => (
      <Faller key={i} p={p}>
        <Leaf hue={["#e07a2f", "#c9472b", "#d9a23a", "#8f5a2c"][i % 4]} />
      </Faller>
    )),
  winter: () => (
    <>
      <Snow seed={41} count={22} />
      {/* Frost settling along the sill. */}
      <span className="absolute inset-x-0 bottom-3.5 h-2.5 bg-[linear-gradient(to_top,rgb(255_255_255/0.45),transparent)]" />
    </>
  ),
  halloween: () => (
    <>
      <span className="absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(ellipse_at_bottom,rgb(255_130_40/0.22),transparent_70%)]" />
      <Pumpkin className="absolute bottom-3 left-2 w-8" delay={0} />
      <Pumpkin className="absolute right-3 bottom-3 w-6" delay={1.1} />
    </>
  ),
  festive: () => (
    <>
      <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-6 w-full" aria-hidden="true">
        <path d={WIRE} stroke="#2c3a2c" strokeWidth="0.6" fill="none" />
      </svg>
      {Array.from({ length: 13 }, (_, i) => {
        const x = (i + 0.5) * (100 / 13);
        // On the wire: each dip is a quadratic from y=2 down to 7 and back.
        const t = (x % 25) / 25;
        const y = 2 + 20 * t * (1 - t);
        return (
          <span
            key={i}
            className="absolute size-2 rounded-full"
            style={{
              left: `calc(${x}% - 4px)`,
              top: `calc(${(y / 14) * 1.5}rem - 3px)`,
              background: BULBS[i % BULBS.length],
              boxShadow: `0 0 8px 1px ${BULBS[i % BULBS.length]}`,
              animation: `home-flicker ${2 + (i % 3) * 0.7}s ease-in-out ${-(i * 0.37)}s infinite`,
            }}
          />
        );
      })}
      <Snow seed={53} count={10} />
    </>
  ),
  lunar: () => (
    <>
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <radialGradient id="lantern-glow" cx="0.4" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#ffb36b" stopOpacity="0.8" />
            <stop offset="1" stopColor="#ffb36b" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <Lantern left="14%" length={14} delay={0} />
      <Lantern left="48%" length={6} delay={-1.2} />
      <Lantern left="80%" length={18} delay={-2.1} />
    </>
  ),
};

const GardenDecor = ({ decor }: { decor: DecorId }) => (
  <div data-home-decor aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    {DECOR[decor]()}
  </div>
);

export default GardenDecor;
