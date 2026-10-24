import { useId } from "react";
import type { PotId } from "@/lib/home/cosmetics";
import type { PlantId } from "@/lib/home/garden";
import { cn } from "@/lib/utils";

/** The "mixed" pots: each plant in its own colour. */
const POT: Record<PlantId, string> = {
  moss: "#b86a4b",
  fern: "#d9cbb4",
  mint: "#7f9c86",
  monstera: "#3e4b70",
  bonsai: "#9ab8a8",
  moonflower: "#6c4a7f",
  lotus: "#4f8fa6",
  willow: "#8a6e52",
  cloudbloom: "#c9d6ea",
};

/** Foliage for each plant, drawn upward from the soil line at y=32. */
const FOLIAGE: Record<PlantId, React.ReactNode> = {
  moss: (
    <g>
      <circle cx="14" cy="30" r="4.5" fill="#5f8f4e" />
      <circle cx="26" cy="30" r="4.5" fill="#5f8f4e" />
      <circle cx="20" cy="28" r="5.5" fill="#79a85f" />
      <circle cx="16.5" cy="26.8" r="2.6" fill="#8fbd6c" />
      <circle cx="23.5" cy="27.2" r="2.2" fill="#8fbd6c" />
    </g>
  ),
  fern: (
    <g fill="#5ea36a">
      {[-62, -32, 0, 32, 62].map((deg) => (
        <g key={deg} transform={`rotate(${deg} 20 32)`}>
          <ellipse cx="20" cy="21" rx="3.4" ry="11" />
          <line x1="20" y1="31" x2="20" y2="11" stroke="#3f7d4a" strokeWidth="0.8" />
        </g>
      ))}
    </g>
  ),
  mint: (
    <g>
      {[
        [13, -14],
        [20, 0],
        [27, 14],
      ].map(([x, lean]) => (
        <g key={x} transform={`rotate(${lean} 20 32)`}>
          <line x1="20" y1="32" x2="20" y2="10" stroke="#4f8b5d" strokeWidth="1.3" />
          {[14, 20, 26].map((y) => (
            <g key={y}>
              <ellipse cx="16.6" cy={y} rx="3.4" ry="2.4" fill="#7cc58f" />
              <ellipse cx="23.4" cy={y - 2} rx="3.4" ry="2.4" fill="#6ab57f" />
            </g>
          ))}
        </g>
      ))}
    </g>
  ),
  monstera: (
    <g>
      <path d="M20 32 C19 26 15 22 11 19 M20 32 C21 25 25 21 29 18 M20 32 L20 12" stroke="#2f6b45" strokeWidth="1.3" fill="none" />
      {[
        [11, 18, -25],
        [29, 17, 25],
        [20, 11, 0],
      ].map(([cx, cy, rot]) => (
        <g key={`${cx}`} transform={`rotate(${rot} ${cx} ${cy})`}>
          <ellipse cx={cx} cy={cy} rx="7" ry="6.2" fill="#3f8a5a" />
          <path
            d={`M${cx} ${cy} l-5.5 -2.5 M${cx} ${cy} l-5.8 1.6 M${cx} ${cy} l5.5 -2.5 M${cx} ${cy} l5.8 1.6`}
            stroke="#2a6342"
            strokeWidth="1"
          />
        </g>
      ))}
    </g>
  ),
  bonsai: (
    <g>
      <path d="M19 32 C17 27 23 25 21 21 C19.5 18 15 18 13 15" stroke="#6b4a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M21 22 C24 20 27 19 29 16" stroke="#6b4a3a" strokeWidth="2" fill="none" strokeLinecap="round" />
      <ellipse cx="12.5" cy="13" rx="7" ry="4" fill="#4f8a55" />
      <ellipse cx="28.5" cy="14" rx="6" ry="3.6" fill="#66a364" />
      <ellipse cx="20" cy="9" rx="5.5" ry="3.4" fill="#5a9a5d" />
    </g>
  ),
  moonflower: (
    <g>
      <path d="M20 32 C20 24 21 18 20 12" stroke="#4f8b5d" strokeWidth="1.4" fill="none" />
      <ellipse cx="15" cy="25" rx="4.2" ry="2.2" fill="#5f9e6c" transform="rotate(-30 15 25)" />
      <ellipse cx="25" cy="21" rx="4.2" ry="2.2" fill="#5f9e6c" transform="rotate(30 25 21)" />
      <g style={{ filter: "drop-shadow(0 0 3px rgba(240,236,255,0.9))" }}>
        {[0, 72, 144, 216, 288].map((deg) => (
          <ellipse key={deg} cx="20" cy="6.5" rx="3" ry="4.6" fill="#f5f1ff" transform={`rotate(${deg} 20 11)`} />
        ))}
        <circle cx="20" cy="11" r="2.2" fill="#ffe9a8" />
      </g>
    </g>
  ),
  lotus: (
    <g>
      <ellipse cx="20" cy="30.5" rx="12" ry="2.6" fill="#3f8a5a" />
      <path d="M20 30.5 L27 28.6" stroke="#2f6b45" strokeWidth="0.8" />
      {[-48, -24, 0, 24, 48].map((deg) => (
        <ellipse key={deg} cx="20" cy="21" rx="3.2" ry="7" fill={deg === 0 ? "#ffd3e2" : "#f4a8c4"} transform={`rotate(${deg} 20 28)`} />
      ))}
      <ellipse cx="20" cy="24.5" rx="2.6" ry="2" fill="#ffe08a" />
    </g>
  ),
  willow: (
    <g>
      <path d="M20 32 C20 26 19 20 20 13" stroke="#6b4a3a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <ellipse cx="20" cy="12" rx="11" ry="5.5" fill="#6aa564" />
      {[10, 13.5, 17, 20.5, 24, 27.5, 31].map((x, i) => (
        <path
          key={x}
          d={`M${x} 13 C${x - 0.6} 18 ${x + 0.4} 22 ${x - 0.3} ${25 + (i % 3) * 1.6}`}
          stroke={i % 2 ? "#7dbb6e" : "#5a9a5d"}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      ))}
    </g>
  ),
  cloudbloom: (
    <g>
      <path d="M20 32 C19 27 21 22 20 17" stroke="#4f8b5d" strokeWidth="1.4" fill="none" />
      <ellipse cx="16" cy="27" rx="3.6" ry="1.8" fill="#5f9e6c" transform="rotate(-25 16 27)" />
      <g style={{ filter: "drop-shadow(0 0 3px rgba(200,225,255,0.8))" }}>
        <circle cx="15" cy="13" r="4.4" fill="#eef4ff" />
        <circle cx="20.5" cy="10.5" r="5.4" fill="#f7faff" />
        <circle cx="25.8" cy="13.4" r="4.2" fill="#e6efff" />
        <rect x="12" y="13" width="17" height="4" rx="2" fill="#eef4ff" />
      </g>
      {[15.5, 20.5, 25.5].map((x, i) => (
        <path key={x} d={`M${x} ${19.5 + i % 2} q-0.9 1.6 0 2.4 q0.9 -0.8 0 -2.4Z`} fill="#8fc8f0" />
      ))}
    </g>
  ),
};

/** A pot style's paint, as an SVG fill plus whatever detail it carries. */
function potPaint(pot: PotId, plant: PlantId, gid: string) {
  switch (pot) {
    case "classic":
      return { fill: POT[plant] };
    case "terracotta":
      return { fill: "#c0714f" };
    case "porcelain":
      return { fill: "#eef0f4", detail: <rect x="10.6" y="39.4" width="18.8" height="1.6" fill="#4a6fb5" /> };
    case "stone":
      return {
        fill: "#8a8f8a",
        detail: (
          <g fill="#6f9a55">
            <circle cx="12" cy="31.6" r="1.6" />
            <circle cx="15" cy="31.2" r="1.2" />
            <circle cx="27" cy="31.5" r="1.5" />
            <circle cx="19" cy="40" r="0.9" opacity="0.8" />
          </g>
        ),
      };
    case "copper":
      return {
        fill: `url(#${gid})`,
        gradient: ["#d9894f", "#8a4b2a"],
      };
    case "midnight":
      return {
        fill: "#1e2547",
        detail: (
          <g fill="#cfd8ff">
            <circle cx="14" cy="39" r="0.5" />
            <circle cx="21" cy="42" r="0.45" />
            <circle cx="25.5" cy="38.4" r="0.55" />
            <circle cx="17.5" cy="44" r="0.4" />
          </g>
        ),
      };
    case "gilded":
      return { fill: `url(#${gid})`, gradient: ["#f6d977", "#b3862a"] };
    case "diamond":
      // Ice-pale facets, and a glint that catches the light.
      return {
        fill: `url(#${gid})`,
        gradient: ["#f4fdff", "#8fd3f2"],
        detail: (
          <g>
            <path d="M12 35.5 L16 46 M20 35.5 V46 M28 35.5 L24 46 M10 31 L14 35.5 M30 31 L26 35.5" stroke="#ffffff" strokeWidth="0.5" opacity="0.7" />
            <path d="M17 38.5 L20 35.5 L23 38.5 L20 44 Z" fill="#ffffff" opacity="0.35" />
            <path d="M26.5 37.5 l0.6 -1.7 l0.6 1.7 l1.7 0.6 l-1.7 0.6 l-0.6 1.7 l-0.6 -1.7 l-1.7 -0.6 Z" fill="#ffffff" />
          </g>
        ),
      };

    // Made for each scene.
    case "slick":
      // Rainy window: wet, glossy navy, with drops running down it.
      return {
        fill: `url(#${gid})`,
        gradient: ["#34508a", "#141c33"],
        detail: (
          <g fill="#ffffff">
            <rect x="12.5" y="36.5" width="1.4" height="8" rx="0.7" opacity="0.35" />
            <ellipse cx="22" cy="39" rx="0.8" ry="1.1" opacity="0.6" />
            <ellipse cx="25.5" cy="42.5" rx="0.7" ry="1" opacity="0.5" />
          </g>
        ),
      };
    case "daisy":
      // The hill: meadow-green glaze, painted with daisies.
      return {
        fill: "#7fb77e",
        detail: (
          <g>
            {[
              [15, 40],
              [24.5, 42.5],
            ].map(([x, y]) => (
              <g key={x}>
                {[0, 72, 144, 216, 288].map((d) => (
                  <circle key={d} cx={x + 1.5 * Math.cos((d * Math.PI) / 180)} cy={y + 1.5 * Math.sin((d * Math.PI) / 180)} r="0.9" fill="#ffffff" />
                ))}
                <circle cx={x} cy={y} r="0.8" fill="#ffd34d" />
              </g>
            ))}
          </g>
        ),
      };
    case "dusk":
      // The sunset: glazed from sun-orange down to evening violet.
      return { fill: `url(#${gid})`, gradient: ["#ffa06b", "#6b3a8a"] };
    case "stoneware":
      // The café: speckled cream stoneware with a brown dipped rim.
      return {
        fill: "#e9dcc6",
        detail: (
          <g>
            <rect x="8" y="31" width="24" height="2.4" rx="1" fill="#7a4a2a" />
            {[
              [13, 38],
              [18, 42],
              [23, 37.5],
              [26, 41],
              [15.5, 44],
              [21, 40],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#8a6a4a" />
            ))}
          </g>
        ),
      };
    case "borealis":
      // The aurora lake: deep teal into violet, a band of light across it.
      return {
        fill: `url(#${gid})`,
        gradient: ["#2a7a74", "#3f2a74"],
        detail: (
          <path d="M10 40 Q14 37 18 40 T26 40 T31 39" stroke="#8ff5cf" strokeWidth="1.1" fill="none" opacity="0.8" />
        ),
      };
    case "bark":
      // The sunlit forest: a hollowed log, grain and a knot.
      return {
        fill: "#6b4a32",
        detail: (
          <g stroke="#4a3221" strokeWidth="0.6" fill="none">
            <path d="M13 36 Q12.5 41 14 46 M18 36 Q19 41 17.5 46 M24 36 Q23 41 24.5 46 M28 36 Q28.5 40 27 45" />
            <ellipse cx="21" cy="41" rx="1.4" ry="1" />
          </g>
        ),
      };
    case "nebula":
      // The nebula: violet into deep blue, stars and a drift of pink gas.
      return {
        fill: `url(#${gid})`,
        gradient: ["#4a2f8a", "#121a44"],
        detail: (
          <g>
            <ellipse cx="19" cy="40" rx="6" ry="2.4" fill="#ff8fd0" opacity="0.28" />
            {[
              [13, 38],
              [24, 37.5],
              [27, 42],
              [16, 43.5],
              [21, 44.5],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r="0.45" fill="#ffffff" />
            ))}
          </g>
        ),
      };
    case "coral":
      // The tropical sunset: coral pink, ridged like a shell.
      return {
        fill: "#ff8a73",
        detail: (
          <g stroke="#ffc2b2" strokeWidth="0.6" fill="none" opacity="0.8">
            <path d="M13 36 Q15 41 14 46 M17 36 Q18 41 17.5 46 M21 36 V46 M25 36 Q24 41 24.5 46 M28.5 36 Q27 41 27 45" />
          </g>
        ),
      };
    case "enamel":
      // The alpine hill: white enamel with a blue rim and an edelweiss.
      return {
        fill: "#f4f6f8",
        detail: (
          <g>
            <rect x="8" y="31" width="24" height="4.5" rx="1.2" fill="#2f5fa8" />
            <rect x="9" y="32.2" width="22" height="0.7" fill="#ffffff" opacity="0.3" />
            {[0, 60, 120, 180, 240, 300].map((d) => (
              <ellipse
                key={d}
                cx={20 + 1.8 * Math.cos((d * Math.PI) / 180)}
                cy={40.5 + 1.8 * Math.sin((d * Math.PI) / 180)}
                rx="1.1"
                ry="0.6"
                transform={`rotate(${d} ${20 + 1.8 * Math.cos((d * Math.PI) / 180)} ${40.5 + 1.8 * Math.sin((d * Math.PI) / 180)})`}
                fill="#dfe6e0"
                stroke="#b8c4bb"
                strokeWidth="0.2"
              />
            ))}
            <circle cx="20" cy="40.5" r="0.9" fill="#e8d35a" />
          </g>
        ),
      };
    case "maple":
      // The autumn path: rust glaze with a gold maple leaf.
      return {
        fill: "#b5532a",
        detail: (
          <path
            d="M20 36.5 l0.8 2.2 1.5 -0.8 -0.4 2 2.1 -0.3 -1.2 1.6 1.4 0.8 -2.6 0.2 0.3 1.2 -1.6 -0.7 V45 h-0.6 v-2.3 l-1.6 0.7 0.3 -1.2 -2.6 -0.2 1.4 -0.8 -1.2 -1.6 2.1 0.3 -0.4 -2 1.5 0.8 Z"
            fill="#f2b33d"
          />
        ),
      };
    case "ashen":
      // Majula: grey stone, cracked, with an ember glowing inside.
      return {
        fill: "#5b5753",
        detail: (
          <g>
            <path d="M15 35.5 L17 39 L15.5 41.5 L18.5 46" stroke="#ff9a3c" strokeWidth="0.8" fill="none" style={{ filter: "drop-shadow(0 0 1.5px #ff7a2a)" }} />
            <path d="M25 37 L23.5 40 L25.5 43" stroke="#ff9a3c" strokeWidth="0.6" fill="none" opacity="0.8" />
          </g>
        ),
      };
    case "frost":
      // Moonlight: icy blue, rimed with frost.
      return {
        fill: `url(#${gid})`,
        gradient: ["#eef7ff", "#9cc4e8"],
        detail: (
          <g stroke="#ffffff" strokeWidth="0.45" opacity="0.85">
            <path d="M13 38 l2 2 M15 38 l-2 2 M14 37.6 v2.8 M25 41 l2 2 M27 41 l-2 2 M26 40.6 v2.8" />
            <rect x="8" y="31" width="24" height="1.4" rx="0.7" fill="#ffffff" stroke="none" opacity="0.7" />
          </g>
        ),
      };
  }
}

/** Growth stage from how many are owned: a sprout, then fuller, then full. */
export const stageFor = (count: number) => (count >= 25 ? 3 : count >= 10 ? 2 : 1);

const SCALE = { 1: 0.72, 2: 0.86, 3: 1 } as const;

const PlantSprite = ({
  id,
  stage = 3,
  size = 40,
  locked = false,
  pot = "classic",
  className,
}: {
  id: PlantId;
  stage?: 1 | 2 | 3;
  size?: number;
  locked?: boolean;
  pot?: PotId;
  className?: string;
}) => {
  const s = SCALE[stage];
  const gid = useId().replace(/:/g, "");
  const paint = potPaint(pot, id, gid);
  return (
    <svg
      viewBox="0 0 40 48"
      width={size}
      height={size * 1.2}
      aria-hidden="true"
      className={cn(locked && "opacity-40 brightness-0 invert-[0.35]", className)}
    >
      {paint.gradient && (
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={paint.gradient[0]} />
            <stop offset="1" stopColor={paint.gradient[1]} />
          </linearGradient>
        </defs>
      )}
      <g transform={`translate(20 32) scale(${s}) translate(-20 -32)`}>{FOLIAGE[id]}</g>
      <rect x="8" y="31" width="24" height="4.5" rx="1.2" fill={paint.fill} />
      <path d="M9.5 35.5 H30.5 L28 46 H12 Z" fill={paint.fill} />
      {paint.detail}
      <path d="M9.5 35.5 H30.5 L30.1 37.2 H9.9 Z" fill="black" opacity="0.18" />
      <rect x="9" y="31.6" width="22" height="1" rx="0.5" fill="white" opacity="0.18" />
    </svg>
  );
};

export default PlantSprite;
