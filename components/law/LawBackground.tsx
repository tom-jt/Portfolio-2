"use client";

import { useEffect, useState } from "react";
import { useIsDark } from "@/hooks/use-is-dark";
import GuillocheRings from "./GuillocheRings";

/**
 * Three quiet layers, all cheap:
 *
 *  1. furniture   — static, asymmetric edge decoration
 *  2. filaments   — SVG sine paths drifting on a CSS transform
 *  3. grain       — paper tooth, so the flat ground is not plastic
 *
 * The engraved ring watermark that used to live here is gone: seals are now
 * placed within the sections themselves rather than pinned to the viewport.
 *
 * This replaced a WebGL version (ReactBits Threads). That ran a fragment
 * shader over the whole viewport every frame and was visibly laggy. Nothing
 * here costs per-frame JavaScript: the only animation is a transform on two
 * groups, which the compositor handles, and everything else is static.
 */

const VB_W = 1200;
const VB_H = 600;
/** Paths are drawn to twice the viewBox so translateX(-50%) loops seamlessly. */
const SPAN = VB_W * 2;
/** Must divide DRIFT exactly, or the loop seam shows. */
const WAVELENGTH = 400;
/**
 * How far each strand travels before repeating, in viewBox user units.
 * A whole number of wavelengths, and no more than SPAN - VB_W so the path
 * still covers the viewport at the end of the travel.
 */
const DRIFT = WAVELENGTH * 3;

function wavePath(y: number, amp: number) {
  const half = WAVELENGTH / 2;
  let d = `M 0 ${y}`;
  let dir = -1;
  for (let x = 0; x < SPAN; x += half) {
    const c1 = x + half / 3;
    const c2 = x + (half * 2) / 3;
    d += ` C ${c1} ${y + dir * amp}, ${c2} ${y + dir * amp}, ${x + half} ${y}`;
    dir *= -1;
  }
  return d;
}

/**
 * Clustered near the middle so they read as one woven ribbon. Kept few and
 * faint: an earlier pass used eleven strands at triple this opacity and the
 * background started competing with the type instead of supporting it.
 */
const FILAMENTS = Array.from({ length: 7 }, (_, i) => ({
  y: 262 + i * 12,
  amp: 14 + (i % 4) * 7,
  duration: 38 + i * 5,
  opacity: 0.3 + (i % 3) * 0.11,
}));

/** Clears the centre so the hero text never sits on top of a strand. */
const CENTRE_CLEAR =
  "radial-gradient(ellipse 46% 42% at 50% 50%, transparent 35%, black 78%)";

const GRAIN =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.45'/%3E%3C/svg%3E";

const LawBackground = () => {
  const isDark = useIsDark();
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () => setReduced(mq.matches);
    read();
    mq.addEventListener("change", read);
    return () => mq.removeEventListener("change", read);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* 1 — edge furniture. Deliberately unbalanced: rings bleed off the
             left only, the standing rule sits right of centre, and the ticks
             take one diagonal pair of corners rather than all four. Symmetry
             here would read as a frame; asymmetry reads as composition. */}
      <GuillocheRings
        size={760}
        rings={7}
        opacity={isDark ? 0.3 : 0.26}
        className="absolute top-[14%] -left-96"
      />

      {/* A single standing rule, off-centre */}
      <div
        className="bg-gold-hair absolute inset-y-0 right-[4.5%] w-px opacity-45"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, black 22%, black 78%, transparent)",
        }}
      />

      {/* Two corners only, on a diagonal */}
      <div className="border-gold-hair absolute top-10 right-10 h-16 w-16 border-t border-r opacity-50" />
      <div className="border-gold-hair absolute bottom-10 left-10 h-24 w-24 border-b border-l opacity-50" />

      {/* A short diagonal, tucked into the lower right */}
      <div className="bg-gold-hair absolute right-[6%] bottom-[22%] h-px w-40 rotate-[38deg] opacity-30" />

      {/* 2 — drifting filaments */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        preserveAspectRatio="none"
        fill="none"
        style={{ maskImage: CENTRE_CLEAR, WebkitMaskImage: CENTRE_CLEAR }}
      >
        {FILAMENTS.map((f, i) => (
          <g
            key={i}
            style={
              reduced
                ? undefined
                : ({
                    animation: `law-drift ${f.duration}s linear infinite`,
                    // Opposite directions on alternate strands so they weave.
                    animationDirection: i % 2 ? "reverse" : "normal",
                    // Resolve lengths against the viewBox, then travel an
                    // exact whole number of wavelengths.
                    transformBox: "view-box",
                    "--law-drift-distance": `${DRIFT}px`,
                  } as React.CSSProperties)
            }
          >
            <path
              d={wavePath(f.y, f.amp)}
              stroke="var(--gold)"
              strokeWidth="1.1"
              opacity={f.opacity * (isDark ? 1 : 0.85)}
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ))}
      </svg>

      {/* 3 — paper tooth */}
      <div
        className="absolute inset-0 mix-blend-overlay"
        style={{
          backgroundImage: `url("${GRAIN}")`,
          opacity: isDark ? 0.16 : 0.1,
        }}
      />
    </div>
  );
};

export default LawBackground;
