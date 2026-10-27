import { useId, type ReactNode } from "react";
import { getScene, type SceneId } from "@/lib/home/scenes";
import { photoThumb } from "./PhotoScene";

/**
 * Thumbnails for the scene picker: each scene drawn small enough to read
 * at 40px, so the picker shows where you're going rather than two colours.
 */

const Rain = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#060a18" />
        <stop offset="0.65" stopColor="#241c3e" />
        <stop offset="1" stopColor="#0d1124" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" fill={`url(#${id}-sky)`} />
    <path d="M0 40V25h5v-6h6v8h4V16h6v10h4v-5h6v6h5v-4h4v17Z" fill="#0b1026" />
    {[
      [7, 22], [13, 29], [17, 19], [18, 24], [27, 23], [32, 29], [36, 26], [8, 33], [22, 31],
    ].map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="1.4" height="1.6" fill="#ffd59a" opacity="0.85" />
    ))}
    <circle cx="10" cy="37" r="4" fill="#ffb464" opacity="0.35" />
    <circle cx="30" cy="36" r="5" fill="#7ed0e4" opacity="0.25" />
    <g stroke="#c8d8ff" strokeWidth="0.6" opacity="0.55" strokeLinecap="round">
      {[4, 11, 19, 26, 34, 15, 30].map((x, i) => (
        <line key={x} x1={x} y1={2 + (i % 3) * 5} x2={x + 0.8} y2={8 + (i % 3) * 5} />
      ))}
    </g>
  </>
);

const Hill = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a66c4" />
        <stop offset="0.7" stopColor="#a7d0f2" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" fill={`url(#${id}-sky)`} />
    <ellipse cx="27" cy="9" rx="8" ry="3" fill="#fff" opacity="0.85" />
    <ellipse cx="22" cy="10.5" rx="5" ry="2.2" fill="#fff" opacity="0.7" />
    <path d="M0 26C8 22 16 23 24 25s12 0 16-2v17H0Z" fill="#6fae74" />
    <path d="M0 31C10 27 22 27 40 33v7H0Z" fill="#3f8a47" />
    <rect x="29.4" y="20" width="0.9" height="4" fill="#3b2b1f" />
    <circle cx="29.8" cy="19.5" r="2.6" fill="#2f6d39" />
    <g stroke="#fff" strokeWidth="0.55" opacity="0.6" strokeLinecap="round">
      {[5, 12, 18, 33, 9, 25].map((x, i) => (
        <line key={x} x1={x} y1={4 + (i % 3) * 6} x2={x + 0.7} y2={9 + (i % 3) * 6} />
      ))}
    </g>
  </>
);

const Sunset = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#2a1b4a" />
        <stop offset="0.5" stopColor="#a8406c" />
        <stop offset="1" stopColor="#ffb46a" />
      </linearGradient>
      <linearGradient id={`${id}-sea`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#c46677" />
        <stop offset="1" stopColor="#24122f" />
      </linearGradient>
    </defs>
    <rect width="40" height="25" fill={`url(#${id}-sky)`} />
    <path d="M18 25a8 8 0 0 1 16 0Z" fill="#ffe6a8" />
    <rect y="25" width="40" height="15" fill={`url(#${id}-sea)`} />
    <g fill="#ffe2a8">
      <rect x="22" y="27" width="8" height="0.8" opacity="0.8" />
      <rect x="23.5" y="30" width="5" height="0.8" opacity="0.6" />
      <rect x="21" y="33" width="10" height="0.8" opacity="0.4" />
    </g>
    <path d="M0 25v-2.5c4-1 8-.8 11 2.5Z" fill="#2b1636" />
  </>
);

const Cafe = ({ id }: { id: string }) => (
  <>
    <defs>
      <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.3" r="0.6">
        <stop offset="0" stopColor="#ffbe74" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ffbe74" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="40" height="40" fill="#2a1a12" />
    <rect x="7" y="6" width="26" height="20" rx="1" fill="#131a2e" />
    <circle cx="13" cy="21" r="3" fill="#ffb464" opacity="0.35" />
    <circle cx="26" cy="19" r="2.5" fill="#e89ac0" opacity="0.3" />
    <g stroke="#9fc4e8" strokeWidth="0.55" opacity="0.6" strokeLinecap="round">
      {[10, 15, 21, 27, 31].map((x, i) => (
        <line key={x} x1={x} y1={8 + (i % 2) * 4} x2={x + 0.6} y2={13 + (i % 2) * 4} />
      ))}
    </g>
    <path d="M7 16h26M20 6v20" stroke="#4a2e1e" strokeWidth="1.2" />
    <rect x="7" y="6" width="26" height="20" rx="1" fill="none" stroke="#5a3a26" strokeWidth="1.5" />
    <rect width="40" height="40" fill={`url(#${id}-lamp)`} />
    <path d="M20 0v4" stroke="#1a0f0a" strokeWidth="0.6" />
    <path d="M17 6l1.5-2h3L23 6Z" fill="#c88a4a" />
    <rect y="30" width="40" height="10" fill="#4a2f1d" />
    <rect y="30" width="40" height="0.8" fill="#7a5235" />
    <path d="M24 30v-3.5h4.5V30Z" fill="#efe3d0" />
    <path d="M25 25.5c.6-1 .6-1.8 0-2.8M27 25.5c.6-1 .6-1.8 0-2.8" stroke="#fff" strokeWidth="0.5" opacity="0.45" fill="none" />
  </>
);

const Library = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0a1230" />
        <stop offset="1" stopColor="#2a2a4a" />
      </linearGradient>
      <radialGradient id={`${id}-lamp`} cx="0.3" cy="0.78" r="0.5">
        <stop offset="0" stopColor="#ffc478" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffc478" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="40" height="40" fill="#17120e" />
    {/* Bookcases either side, two shelves of spines each. */}
    {[0, 29].map((x) => (
      <g key={x}>
        <rect x={x} y="0" width="11" height="30" fill="#24170f" />
        {[9, 19, 29].map((y) => (
          <rect key={y} x={x} y={y} width="11" height="1" fill="#3a2516" />
        ))}
        {[0, 1].map((row) =>
          ["#5a2a24", "#2f4a3a", "#6b5230", "#3a3550", "#7a4a2a"].map((c, i) => (
            <rect key={`${row}-${i}`} x={x + 1 + i * 2} y={row * 10 + 3 + (i % 2)} width="1.6" height={6 - (i % 2)} fill={c} />
          )),
        )}
      </g>
    ))}
    {/* The arched window, the moon, and its glazing bars. */}
    <path d="M14 26V12a6 6 0 0 1 12 0v14Z" fill={`url(#${id}-sky)`} stroke="#1a100a" strokeWidth="1.2" />
    <circle cx="22.5" cy="10.5" r="1.6" fill="#e9eefc" />
    <path d="M20 6v20M14 15h12" stroke="#1a100a" strokeWidth="0.6" />
    <g stroke="#a9bdf0" strokeWidth="0.4" opacity="0.5">
      <line x1="16" y1="16" x2="16" y2="19" />
      <line x1="23" y1="18" x2="23" y2="21" />
      <line x1="18" y1="9" x2="18" y2="12" />
    </g>
    {/* The desk, and the green banker's lamp lighting it. */}
    <rect y="31" width="40" height="9" fill="#2e1b0f" />
    <rect x="5" y="34" width="30" height="6" fill="#1f3a2a" />
    <rect width="40" height="40" fill={`url(#${id}-lamp)`} />
    <rect x="11.6" y="27" width="0.8" height="7" fill="#b8893a" />
    <ellipse cx="12" cy="34" rx="3" ry="0.8" fill="#c79a4a" />
    <path d="M8 27.5q0-3 4-3.2q4 .2 4 3.2Z" fill="#1a5a34" />
    <ellipse cx="12" cy="27.5" rx="4" ry="0.5" fill="#ffe2a8" />
  </>
);

const Dawn = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#9a7cb2" />
        <stop offset="0.55" stopColor="#f0a48e" />
        <stop offset="1" stopColor="#ffd58a" />
      </linearGradient>
      <radialGradient id={`${id}-lamp`} cx="0.5" cy="0.3" r="0.6">
        <stop offset="0" stopColor="#ffd696" stopOpacity="0.6" />
        <stop offset="1" stopColor="#ffd696" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="40" height="40" fill="#2c2338" />
    <rect x="11" y="4" width="25" height="20" fill={`url(#${id}-sky)`} />
    <circle cx="27" cy="18" r="2.6" fill="#fff4d6" />
    <path d="M11 24v-5h4v-2l2.5-2 2.5 2v3h4v-3h3l2 -2 2 2v1h5v6Z" fill="#3a2a44" />
    <g fill="#cdb3b0">
      {[5, 7, 9, 11].map((y) => (
        <rect key={y} x="11" y={y} width="25" height="1.2" />
      ))}
    </g>
    <rect x="11" y="4" width="25" height="20" fill="none" stroke="#4a3852" strokeWidth="1.4" />
    <rect x="9.5" y="24" width="28" height="1.6" fill="#6a4f62" />
    {/* The cat asleep on the sill, and the plant beside it. */}
    <path d="M14.5 24c0-2.2 1.8-3.4 4-3.4s3.6 1 3.6 2.4c1.2-.2 1.8.4 1.8 1Z" fill="#d9905e" />
    <path d="M22.4 21.6l.5-1.6.8 1.2ZM23.6 21.4l1-1.4.3 1.6Z" fill="#d9905e" />
    <path d="M31 24l.6-2h2.8l.6 2Z" fill="#e9a88a" />
    <path d="M31.5 22c-1 .4-1.6 1.2-2 2.4M34.5 22c.8.6 1.2 1.6 1.2 2.8" stroke="#5f9a64" strokeWidth="0.6" fill="none" />
    {/* Light through the blinds, and through the open window below them. */}
    <g fill="#ffc896" opacity="0.18">
      <path d="M11 7 L2 12 L2 13.4 L11 8.4Z" />
      <path d="M11 10 L2 15 L2 16.4 L11 11.4Z" />
      <path d="M20 16 L6 24 L6 28 L20 20Z" />
    </g>
    <rect y="31" width="40" height="9" fill="#5a3a3c" />
    <rect y="31" width="40" height="0.8" fill="#e8b39a" />
    {/* The lamp lighting a notebook and pen, a clock, the mug, and the books. */}
    <ellipse cx="14" cy="29" rx="9" ry="5" fill={`url(#${id}-lamp)`} />
    <path d="M6 31l1.2-3h9.6l1.2 3Z" fill="#fbf1e4" />
    <path d="M12 28v3" stroke="#c9b8c8" strokeWidth="0.4" />
    <path d="M13.5 30l3-1.6" stroke="#3a2c3e" strokeWidth="0.6" strokeLinecap="round" />
    <path d="M20.5 30.6 L20.8 24 L16.5 22.6" stroke="#4f7a6c" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    <ellipse cx="20.5" cy="30.6" rx="2" ry="0.6" fill="#6f9a8a" />
    <path d="M16.8 22.2 L15 25.6 L18.8 26.4 L17.6 22.4Z" fill="#5f8a7a" />
    <path d="M15 25.6 L18.8 26.4" stroke="#ffe6b0" strokeWidth="0.8" />
    <circle cx="3.5" cy="28.6" r="2" fill="#9a7cb2" />
    <circle cx="3.5" cy="28.6" r="1.4" fill="#f6ead8" />
    <rect x="25" y="27" width="3.4" height="4" rx="0.6" fill="#f2c3a8" />
    <path d="M26.4 25.8c.5-.8.5-1.4 0-2.2" stroke="#fff" strokeWidth="0.5" opacity="0.45" fill="none" />
    <rect x="30.5" y="29.6" width="8" height="1.4" fill="#7a4a6a" />
    <rect x="31" y="28.4" width="7" height="1.2" fill="#d99a6c" />
    <rect x="31.6" y="27.3" width="6" height="1.1" fill="#4f5f8a" />
  </>
);

const Greenhouse = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#5f8db8" />
        <stop offset="0.5" stopColor="#a9c6da" />
        <stop offset="0.62" stopColor="#6f9c62" />
        <stop offset="1" stopColor="#4d7a46" />
      </linearGradient>
      <radialGradient id={`${id}-bulb`}>
        <stop offset="0" stopColor="#ffd68c" stopOpacity="0.8" />
        <stop offset="1" stopColor="#ffd68c" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="40" height="40" fill={`url(#${id}-sky)`} />
    <ellipse cx="8" cy="23" rx="9" ry="5" fill="#5f8a74" opacity="0.7" />
    <ellipse cx="32" cy="22" rx="10" ry="6" fill="#5f8a74" opacity="0.7" />
    {/* Rain outside. */}
    <g stroke="#f0f8ff" strokeWidth="0.4" opacity="0.6" strokeLinecap="round">
      {[3, 9, 15, 24, 30, 36, 6, 33].map((x, i) => (
        <line key={i} x1={x} y1={2 + (i % 3) * 5} x2={x + 0.2} y2={5 + (i % 3) * 5} />
      ))}
    </g>
    {/* The frame converging down the aisle, and the far end. */}
    <g stroke="#d6e0da" strokeWidth="0.8" fill="none" opacity="0.9">
      <path d="M-2 26V8L20-6 42 8v18" strokeWidth="1.4" />
      <path d="M5 26V11L20 1l15 10v15" />
      <path d="M11 24V14.5L20 9l9 5.5V24" />
      <path d="M15 23v-6.5l5-3 5 3V23" />
      <path d="M-2 8 15 16.5M42 8 25 16.5M20-6v19M-2 17h17M42 17H25" opacity="0.6" />
    </g>
    <rect x="18.6" y="18" width="2.8" height="5" fill="#4d6458" stroke="#d6e0da" strokeWidth="0.4" />
    {/* Bulbs slung across. */}
    <path d="M3 12q17 6 34 0" stroke="#1e221e" strokeWidth="0.4" fill="none" />
    {[7, 13.5, 20, 26.5, 33].map((x) => (
      <g key={x}>
        <circle cx={x} cy={12 + Math.sin(((x - 3) / 34) * Math.PI) * 3} r="2.4" fill={`url(#${id}-bulb)`} />
        <circle cx={x} cy={12 + Math.sin(((x - 3) / 34) * Math.PI) * 3} r="0.6" fill="#ffe2a8" />
      </g>
    ))}
    {/* Mossy floor and staging, ferns along the aisle. */}
    <path d="M17 23h6l6 17H11Z" fill="#4a5244" />
    <path d="M0 26l17-3-6 17H0Z" fill="#3d4a33" />
    <path d="M40 26l-17-3 6 17h11Z" fill="#3d4a33" />
    <path d="M17 23 11 40h-2l7-17Z M23 23l6 17h2l-7-17Z" fill="#16261b" />
    <path d="M16.6 24.5 10.8 40M23.4 24.5 29.2 40" stroke="#4f7f3c" strokeWidth="1.2" />
    <path d="M14.5 31h11M13.6 34.5h12.8" stroke="#3f6b35" strokeWidth="0.4" opacity="0.8" />
    {[
      [14, 30, 1.6],
      [26, 30, 1.6],
      [12.5, 35, 2],
      [27.5, 35, 2],
    ].map(([x, y, s]) => (
      <path
        key={`${x}-${y}`}
        d={`M${x} ${y}q${(x < 20 ? 1 : -1) * s} -${s * 1.5} ${(x < 20 ? 2 : -2) * s} -${s * 0.6}M${x} ${y}q0 -${s * 1.6} ${(x < 20 ? 0.8 : -0.8) * s} -${s * 1.8}`}
        stroke="#5f8f42"
        strokeWidth="0.6"
        fill="none"
      />
    ))}
    {[
      [5, 27, 2.6],
      [11, 25, 1.8],
      [29, 25, 1.8],
      [35, 27, 2.6],
    ].map(([x, y, s]) => (
      <g key={x}>
        <ellipse cx={x} cy={y - s} rx={s * 1.3} ry={s} fill="#3f7a40" />
        <path d={`M${x - s * 0.6} ${y - s * 0.4}h${s * 1.2}l-${s * 0.2} ${s}h-${s * 0.8}Z`} fill="#8a5236" />
      </g>
    ))}
    <path d="M16.2 25v4M15.4 25.5v3M23.8 25v4M24.6 25.5v3" stroke="#3f7a40" strokeWidth="0.6" strokeLinecap="round" />
    <circle cx="34" cy="23.2" r="0.6" fill="#d9584a" />
    <circle cx="6" cy="23.6" r="0.6" fill="#e88aa6" />
    {/* Trailing baskets. */}
    <path d="M9 4v6M31 4v6" stroke="#2a302a" strokeWidth="0.3" />
    <path d="M7 10h4l-1 1.4h-2Z M29 10h4l-1 1.4h-2Z" fill="#4a3a2a" />
    <path d="M8 11v6M9.4 11v8M10.4 11v5M30 11v5M31.4 11v8M32.6 11v6" stroke="#3f7a40" strokeWidth="0.7" strokeLinecap="round" />
    {/* A palm leaning in, dark against the glass. */}
    <path d="M-1 4q8 1 13 7" stroke="#14291b" strokeWidth="0.5" fill="none" />
    {[2, 4.5, 7, 9.5].map((x, i) => (
      <path key={x} d={`M${x} ${4.4 + i * 1.4}l${-1 + i * 0.2} 4M${x} ${4.4 + i * 1.4}l2.6 -1.6`} stroke="#14291b" strokeWidth="0.7" strokeLinecap="round" />
    ))}
  </>
);

const Train = ({ id }: { id: string }) => (
  <>
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#060a1c" />
        <stop offset="0.7" stopColor="#14214a" />
        <stop offset="1" stopColor="#24345e" />
      </linearGradient>
      <radialGradient id={`${id}-lamp`} cx="0.82" cy="0.66" r="0.5">
        <stop offset="0" stopColor="#ffb464" stopOpacity="0.45" />
        <stop offset="1" stopColor="#ffb464" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect width="40" height="40" fill="#120f1a" />
    <rect x="3" y="5" width="34" height="21" rx="2.5" fill={`url(#${id}-sky)`} />
    <circle cx="29" cy="10" r="1.8" fill="#edf1fc" />
    <circle cx="29" cy="10" r="4" fill="#cdd8ff" opacity="0.15" />
    {[
      [7, 9], [12, 7], [19, 11], [23, 8], [34, 13],
    ].map(([x, y]) => (
      <rect key={`${x}-${y}`} x={x} y={y} width="0.6" height="0.6" fill="#e6ebff" opacity="0.7" />
    ))}
    <path d="M3 18Q10 15.5 17 17.5T37 16.5V26H3Z" fill="#16224a" />
    <path d="M3 20.5Q12 19.5 20 20.5T37 20V26H3Z" fill="#0b1330" />
    <circle cx="9" cy="18.6" r="1.6" fill="#070b1c" />
    <circle cx="14" cy="19" r="1.2" fill="#070b1c" />
    <rect x="21" y="18.6" width="2" height="1.4" fill="#0a0f22" />
    <rect x="21.6" y="19" width="0.6" height="0.6" fill="#ffcf7a" />
    <path d="M3 23.5Q7 21.5 11 23T19 22.5T28 23T37 22.5V26H3Z" fill="#03050d" />
    <rect x="17.4" y="5" width="0.9" height="21" fill="#04060e" />
    <rect x="15.4" y="8.4" width="5" height="0.7" fill="#04060e" />
    <path d="M3 9.2Q10 11 15.6 8.8M20.2 8.8Q28 11 37 9.4" stroke="#04060e" strokeWidth="0.35" fill="none" />
    <g stroke="#d2deff" strokeWidth="0.45" opacity="0.4" strokeLinecap="round">
      {[
        [8, 13], [14, 21], [24, 15], [31, 21], [35, 12], [27, 7],
      ].map(([x, y]) => (
        <line key={`${x}-${y}`} x1={x} y1={y} x2={x - 2.4} y2={y + 1.7} />
      ))}
    </g>
    <rect x="3" y="5" width="34" height="1.6" fill="#a8916f" />
    <rect x="3" y="5" width="34" height="21" rx="2.5" fill="none" stroke="#21171a" strokeWidth="1.6" />
    <rect y="26" width="40" height="14" fill="#160f14" />
    {/* The heater under the window, the carpet, and a suitcase on it. */}
    <rect x="13" y="32" width="18" height="3" rx="0.6" fill="#221a1d" />
    <path d="M14.5 33h15M14.5 34h15" stroke="#0c0809" strokeWidth="0.4" />
    <rect y="37" width="40" height="3" fill="#1c1020" />
    <rect x="19.5" y="33.6" width="5" height="4" rx="0.6" fill="#6e4126" />
    <path d="M18 26.2h20.5l1.5 3.2H16.4Z" fill="#4e3122" />
    <rect x="1.5" y="25.6" width="37" height="1" fill="#3e281d" />
    <rect x="31.6" y="23.6" width="0.6" height="3.4" fill="#a07c42" />
    <path d="M30.4 20.6h3l1 2.6h-5Z" fill="#f6c27a" />
    <ellipse cx="25" cy="27.6" rx="1.8" ry="0.5" fill="#ddd2c0" />
    <path d="M24 25.6h2l-.2 1.8h-1.6Z" fill="#efe6d8" />
    {/* The seat's curved back, its lace cloth, the armrest and a coat. */}
    <path d="M0 40V19.5Q5 19.5 8.5 21.6Q10 22.4 10 24V40Z" fill="#3c1426" />
    <path d="M0 19.3Q5 19.3 8.4 21.4V24.2Q5 22.4 0 22.6Z" fill="#e8dcc6" />
    <rect x="8.6" y="27" width="4.6" height="1.6" rx="0.8" fill="#5a2038" />
    <path d="M11 26.8h2.4l.3 5.2h-2.8Z" fill="#8a6844" />
    <rect width="40" height="40" fill={`url(#${id}-lamp)`} />
  </>
);

const Cabin = ({ id }: { id: string }) => (
  <>
    <defs>
      <radialGradient id={`${id}-fire`} cx="0.42" cy="0.72" r="0.6">
        <stop offset="0" stopColor="#ff9a3c" stopOpacity="0.55" />
        <stop offset="1" stopColor="#ff9a3c" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-night`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0a1430" />
        <stop offset="1" stopColor="#33476e" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" fill="#2a170d" />
    {[4, 9, 14, 19, 24].map((y) => (
      <rect key={y} y={y} width="40" height="0.6" fill="#120904" opacity="0.7" />
    ))}
    <rect y="30" width="40" height="10" fill="#24130a" />
    <rect x="11" y="0" width="12" height="16" fill="#3a332c" />
    <rect x="8" y="16" width="18" height="1.8" fill="#5a3520" />
    <rect x="9" y="17.8" width="16" height="12.2" fill="#5e544a" />
    <path d="M13 30V23.5Q13 21.5 15 21.5H19Q21 21.5 21 23.5V30Z" fill="#140a06" />
    <path d="M14 29Q15 25 16 27Q17 23 18 26.5Q19 24.5 20 29Z" fill="#ffb347" />
    <path d="M15.5 29Q16.5 26.5 17 27.5Q17.6 26 18.5 29Z" fill="#fff0c0" />
    <rect x="8" y="29.6" width="18" height="1" fill="#6a6058" />
    <ellipse cx="17" cy="35" rx="9" ry="2.6" fill="#7a2a20" />
    <ellipse cx="17" cy="35" rx="5.5" ry="1.5" fill="#8a7458" />
    <rect x="29" y="7" width="8" height="10" fill={`url(#${id}-night)`} />
    <path d="M29 14.5h8v2.5h-8Z" fill="#c2d0e4" />
    <path d="M30.5 14.5l1.2-3 1.2 3ZM34 14.5l1-2.4 1 2.4Z" fill="#132239" />
    <path d="M33 7v10M29 11.8h8" stroke="#1e1209" strokeWidth="0.7" />
    <rect x="28.4" y="6.4" width="9.2" height="11.2" fill="none" stroke="#1e1209" strokeWidth="1" />
    {[
      [30.5, 8.5], [35, 9.5], [31.8, 12.6], [35.8, 13],
    ].map(([x, y]) => (
      <circle key={`${x}-${y}`} cx={x} cy={y} r="0.35" fill="#fff" />
    ))}
    <path d="M28 30V22Q28 20 30 20H33Q35 20 35 22V30Z" fill="#5a1c16" />
    <path d="M28 22Q28 20 30 20" stroke="#ff9f50" strokeWidth="0.5" fill="none" opacity="0.7" />
    <rect width="40" height="40" fill={`url(#${id}-fire)`} />
  </>
);

const PREVIEW: Partial<Record<SceneId, (p: { id: string }) => ReactNode>> = {
  rain: Rain,
  hill: Hill,
  sunset: Sunset,
  cafe: Cafe,
  library: Library,
  cabin: Cabin,
  train: Train,
  greenhouse: Greenhouse,
  dawn: Dawn,
};

export const ScenePreview = ({ scene, className }: { scene: SceneId; className?: string }) => {
  const id = useId().replace(/:/g, "");
  const Draw = PREVIEW[scene];
  const photo = getScene(scene).photo;
  if (photo || !Draw) {
    // Photo scenes show a thumbnail of the photograph itself.
    return photo ? (
      // eslint-disable-next-line @next/next/no-img-element -- a 40px thumbnail
      <img src={photoThumb(photo)} alt="" aria-hidden="true" loading="lazy" className={`object-cover ${className ?? ""}`} />
    ) : null;
  }
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={className}>
      <Draw id={id} />
    </svg>
  );
};
