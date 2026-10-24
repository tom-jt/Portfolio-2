"use client";

import type { CSSProperties, ReactNode } from "react";
import { seeded } from "@/components/home/scenes/canvas";
import type { DecorId } from "@/lib/home/cosmetics";

/**
 * Decor for the garden window: the seasons, the holidays, and one made for
 * each scene. A few dozen small elements moved by CSS animations, so it costs
 * next to nothing beside the catch game's canvas. Layout is seeded, so a
 * decor looks the same on every visit. With reduced motion each piece rests
 * where it would be mid-fall.
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

/** Things placed at seeded spots, each wandering on its own loop. */
function spots(seed: number, count: number, box: [x0: number, y0: number, x1: number, y1: number]) {
  const rand = seeded(seed);
  return Array.from({ length: count }, () => ({
    x: box[0] + (box[2] - box[0]) * rand(),
    y: box[1] + (box[3] - box[1]) * rand(),
    a: rand(),
    b: rand(),
  }));
}

/** Rising sparks or wisps, fading as they go: embers, steam. */
const Risers = ({ seed, count, box, className, rise, duration }: {
  seed: number;
  count: number;
  box: [number, number, number, number];
  className: string;
  rise: number;
  duration: [number, number];
}) => (
  <>
    {spots(seed, count, box).map((p, i) => {
      const d = duration[0] + (duration[1] - duration[0]) * p.b;
      return (
        <span
          key={i}
          className={`absolute ${className}`}
          style={
            {
              left: `${p.x}%`,
              top: `${p.y}%`,
              "--drift": `${(p.a - 0.5) * 30}px`,
              "--rise": `${rise * (0.7 + p.b * 0.5)}px`,
              animation: `home-rise ${d}s ease-out ${-p.a * d}s infinite`,
            } as CSSProperties
          }
        />
      );
    })}
  </>
);

/** Crossing the window from left to right, at a height and pace each. */
const Crosser = ({ top, duration, delay, bob = 0, children }: {
  top: string;
  duration: number;
  delay: number;
  bob?: number;
  children: ReactNode;
}) => (
  <span
    className="absolute left-0"
    style={
      {
        top,
        "--across": "calc(100cqw + 40px)",
        "--bob": `${bob}px`,
        animation: `home-cross ${duration}s linear ${delay}s infinite`,
      } as CSSProperties
    }
  >
    {children}
  </span>
);

const MapleLeaf = ({ hue }: { hue: string }) => (
  <svg viewBox="0 0 20 20" className="size-full">
    <path
      d="M10 1 L11.6 5.6 L14.6 4 L13.8 8 L18 7.4 L15.6 10.6 L18.4 12.2 L13.2 12.6 L13.8 15 L10.6 13.6 L10.6 19 L9.4 19 L9.4 13.6 L6.2 15 L6.8 12.6 L1.6 12.2 L4.4 10.6 L2 7.4 L6.2 8 L5.4 4 L8.4 5.6 Z"
      fill={hue}
    />
  </svg>
);

const Gull = () => (
  <svg viewBox="0 0 16 6" className="block w-4" aria-hidden="true">
    <path d="M0 4 Q4 0 8 4 Q12 0 16 4" stroke="#2a1d33" strokeWidth="1.2" fill="none" strokeLinecap="round" />
  </svg>
);

/** A butterfly: two pairs of wings beating, wandering in loops. */
const Butterfly = ({ hue, delay }: { hue: string; delay: number }) => (
  <svg viewBox="0 0 14 10" className="block w-3.5 overflow-visible" aria-hidden="true">
    <g style={{ transformOrigin: "7px 5px", animation: `home-flap 0.22s ease-in-out ${delay}s infinite alternate` }}>
      <ellipse cx="4" cy="3.6" rx="3.6" ry="3" fill={hue} />
      <ellipse cx="10" cy="3.6" rx="3.6" ry="3" fill={hue} />
      <ellipse cx="4.6" cy="7.4" rx="2.4" ry="2" fill={hue} opacity="0.85" />
      <ellipse cx="9.4" cy="7.4" rx="2.4" ry="2" fill={hue} opacity="0.85" />
    </g>
    <rect x="6.5" y="2" width="1" height="7" rx="0.5" fill="#2a2420" />
  </svg>
);

/** A palm frond hanging in from a top corner, swaying a little. */
const Frond = ({ side, delay }: { side: "left" | "right"; delay: number }) => (
  <span
    className={`absolute top-0 ${side === "left" ? "left-0 origin-top-left" : "right-0 origin-top-right"}`}
    style={{ animation: `home-sway 4.5s ease-in-out ${delay}s infinite alternate` }}
  >
    <svg viewBox="0 0 60 40" className={`block w-20 ${side === "right" ? "-scale-x-100" : ""}`} aria-hidden="true">
      <path d="M0 0 Q26 6 52 30" stroke="#1d2a24" strokeWidth="1.6" fill="none" />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10;
        const x = 52 * t;
        const y = 6 * t + 24 * t * t;
        return (
          <g key={i} fill="#21362b">
            <path d={`M${x} ${y} q${-3 + i} ${8 - i * 0.3} ${-1 + i * 0.6} ${13 - i * 0.6} q2 -6 1 -13Z`} />
            <path d={`M${x} ${y} q${4 + i * 0.3} ${-4} ${8 - i * 0.2} ${-3 + i * 0.4} q-5 1 -8 3Z`} />
          </g>
        );
      })}
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

  // ------------------------------------------------- made for each scene

  // Rainy window: rain running down this pane too.
  streaks: () => (
    <>
      {pieces(61, 14, [1.5, 2], [1.2, 2.2]).map((p, i) => (
        <Faller key={i} p={{ ...p, drift: 4, spin: 0 }}>
          <span className="block h-4 w-px bg-[linear-gradient(to_bottom,transparent,rgb(200_220_255/0.55))]" />
        </Faller>
      ))}
      {spots(63, 16, [3, 8, 97, 80]).map((p, i) => (
        <span
          key={`b${i}`}
          className="absolute rounded-full bg-white/25 shadow-[inset_0_-1px_1px_rgb(255_255_255/0.4)]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: 2 + p.a * 3, height: 2 + p.a * 3.5 }}
        />
      ))}
    </>
  ),
  // The hill: seeds blowing over the grass, and a cloud going by.
  dandelions: () => (
    <>
      <Crosser top="8%" duration={46} delay={-12}>
        <span className="block h-6 w-20 rounded-full bg-[radial-gradient(ellipse,rgb(255_255_255/0.55),transparent_70%)]" />
      </Crosser>
      {pieces(67, 12, [5, 7], [12, 18]).map((p, i) => (
        <Faller key={i} p={{ ...p, drift: 60 + p.drift, spin: 90 }}>
          <svg viewBox="0 0 10 10" className="size-full" aria-hidden="true">
            <g stroke="rgb(255 255 255 / 0.8)" strokeWidth="0.6">
              {[0, 45, 90, 135].map((d) => (
                <line key={d} x1="5" y1="5" x2={5 + 4 * Math.cos((d * Math.PI) / 180)} y2={5 - 4 * Math.sin((d * Math.PI) / 180)} />
              ))}
            </g>
            <circle cx="5" cy="5" r="0.9" fill="#fff" />
          </svg>
        </Faller>
      ))}
    </>
  ),
  // The sunset: a warm band low in the window and gulls heading home.
  gulls: () => (
    <>
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgb(255_150_110/0.22),transparent)]" />
      <Crosser top="22%" duration={26} delay={-4} bob={-6}>
        <Gull />
      </Crosser>
      <Crosser top="30%" duration={31} delay={-17} bob={4}>
        <span className="block scale-75">
          <Gull />
        </span>
      </Crosser>
    </>
  ),
  // The café: warm bulbs on a wire and steam curling up.
  cosy: () => (
    <>
      <svg viewBox="0 0 100 14" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-6 w-full" aria-hidden="true">
        <path d={WIRE} stroke="#3a2416" strokeWidth="0.6" fill="none" />
      </svg>
      {Array.from({ length: 9 }, (_, i) => {
        const x = (i + 0.5) * (100 / 9);
        const t = (x % 25) / 25;
        const y = 2 + 20 * t * (1 - t);
        return (
          <span
            key={i}
            className="absolute size-2 rounded-full bg-[#ffcf8a] shadow-[0_0_10px_2px_rgb(255_190_110/0.7)]"
            style={{
              left: `calc(${x}% - 4px)`,
              top: `calc(${(y / 14) * 1.5}rem - 3px)`,
              animation: `home-flicker ${3 + (i % 3)}s ease-in-out ${-(i * 0.6)}s infinite`,
            }}
          />
        );
      })}
      <Risers seed={71} count={6} box={[20, 70, 80, 88]} rise={-90} duration={[5, 8]} className="h-6 w-3 rounded-full bg-[radial-gradient(ellipse,rgb(255_255_255/0.22),transparent_70%)]" />
    </>
  ),
  // The aurora lake: ribbons of light across the top of the window.
  ribbons: () => (
    <>
      {[
        { top: "-10%", color: "rgb(110 255 200 / 0.38)", period: 7, delay: 0 },
        { top: "4%", color: "rgb(170 130 255 / 0.3)", period: 9, delay: -3 },
      ].map((r, i) => (
        <span
          key={i}
          className="absolute left-[-10%] h-[45%] w-[120%] mix-blend-screen"
          style={{
            top: r.top,
            background: `linear-gradient(to bottom, transparent, ${r.color} 45%, transparent)`,
            borderRadius: "50%",
            animation: `home-sway-beam ${r.period}s ease-in-out ${r.delay}s infinite alternate`,
          }}
        />
      ))}
      {spots(73, 12, [4, 4, 96, 40]).map((p, i) => (
        <span
          key={i}
          className="absolute size-0.5 rounded-full bg-white"
          style={{ left: `${p.x}%`, top: `${p.y}%`, animation: `home-flicker ${2 + p.b * 3}s ease-in-out ${-p.a * 4}s infinite` }}
        />
      ))}
    </>
  ),
  // The sunlit forest: light falling through and dust turning in it.
  sunbeams: () => (
    <>
      {[
        { left: "8%", width: "16%", delay: 0 },
        { left: "38%", width: "11%", delay: -4 },
      ].map((b, i) => (
        <span
          key={i}
          className="absolute -top-1/4 h-[150%] origin-top -rotate-[32deg] mix-blend-screen"
          style={{
            left: b.left,
            width: b.width,
            background: "linear-gradient(to right, transparent, rgb(255 244 200 / 0.24) 20%, rgb(255 244 200 / 0.24) 80%, transparent)",
            maskImage: "linear-gradient(to bottom, black, transparent 85%)",
            animation: `home-sway-beam ${9 + i * 3}s ease-in-out ${b.delay}s infinite alternate`,
          }}
        />
      ))}
      <Risers seed={79} count={14} box={[5, 30, 70, 95]} rise={-50} duration={[7, 12]} className="size-1 rounded-full bg-[#fff4cc] shadow-[0_0_4px_rgb(255_240_200/0.8)]" />
    </>
  ),
  // The nebula: stars, and a small ringed planet.
  starfield: () => (
    <>
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgb(120_80_220/0.18),transparent_60%),radial-gradient(ellipse_at_20%_70%,rgb(40_160_220/0.14),transparent_60%)]" />
      {spots(83, 26, [2, 3, 98, 82]).map((p, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: 1 + p.a * 1.5,
            height: 1 + p.a * 1.5,
            boxShadow: "0 0 4px rgb(255 255 255 / 0.8)",
            animation: `home-flicker ${2 + p.b * 4}s ease-in-out ${-p.a * 5}s infinite`,
          }}
        />
      ))}
      <svg viewBox="0 0 40 24" className="absolute top-[10%] right-[8%] w-10" aria-hidden="true">
        <circle cx="20" cy="12" r="7" fill="#7f6bd6" />
        <circle cx="18" cy="10" r="7" fill="#9a88f0" opacity="0.5" />
        <ellipse cx="20" cy="12.5" rx="17" ry="4" fill="none" stroke="#d8c9ff" strokeWidth="1.2" opacity="0.8" />
      </svg>
    </>
  ),
  // The tropical sunset: palm fronds hanging in, and blossom drifting down.
  fronds: () => (
    <>
      <span className="absolute inset-x-0 bottom-0 h-2/5 bg-[linear-gradient(to_top,rgb(255_140_110/0.18),transparent)]" />
      <Frond side="left" delay={0} />
      <Frond side="right" delay={-2} />
      {pieces(89, 6, [7, 9], [12, 18]).map((p, i) => (
        <Faller key={i} p={p}>
          <Petal hue={i % 2 ? "#ff6f91" : "#ffb38a"} />
        </Faller>
      ))}
    </>
  ),
  // The alpine hill: butterflies over the meadow.
  butterflies: () =>
    spots(97, 4, [12, 30, 88, 75]).map((p, i) => (
      <span
        key={i}
        className="absolute"
        style={
          {
            left: `${p.x}%`,
            top: `${p.y}%`,
            "--drift": `${(p.a - 0.5) * 120}px`,
            animation: `home-wander ${7 + p.b * 5}s ease-in-out ${-p.a * 7}s infinite`,
          } as CSSProperties
        }
      >
        <Butterfly hue={["#ffd36b", "#9fd8ff", "#ff9ec2", "#ffffff"][i % 4]} delay={-p.b} />
      </span>
    )),
  // The autumn path: maple leaves coming down, gold light behind them.
  maples: () => (
    <>
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_0%,rgb(255_190_100/0.18),transparent_65%)]" />
      {pieces(101, 10, [10, 14], [9, 14]).map((p, i) => (
        <Faller key={i} p={p}>
          <MapleLeaf hue={["#d9432b", "#e8862f", "#f2b33d", "#a8321f"][i % 4]} />
        </Faller>
      ))}
    </>
  ),
  // Majula: embers rising off a fire just out of sight.
  embers: () => (
    <>
      <span className="absolute inset-x-0 bottom-0 h-1/2 bg-[radial-gradient(ellipse_at_bottom,rgb(255_130_50/0.28),transparent_70%)]" />
      <Risers seed={107} count={18} box={[15, 72, 85, 92]} rise={-150} duration={[3.5, 6.5]} className="size-1 rounded-full bg-[#ffb35c] shadow-[0_0_6px_2px_rgb(255_140_60/0.7)]" />
    </>
  ),
  // Moonlight: the moon behind the snow, and frost at the edges.
  moonsnow: () => (
    <>
      <span className="absolute top-[8%] right-[12%] size-8 rounded-full bg-[#eef4ff] shadow-[0_0_24px_8px_rgb(210_225_255/0.45)]" />
      <Snow seed={109} count={18} />
      <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(230_240_255/0.28)_100%)]" />
    </>
  ),
};

const GardenDecor = ({ decor }: { decor: DecorId }) => (
  // A size container, so things crossing the window know its width.
  <div data-home-decor aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden [container-type:size]">
    {DECOR[decor]()}
  </div>
);

export default GardenDecor;
