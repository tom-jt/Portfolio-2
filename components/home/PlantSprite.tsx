import type { PlantId } from "@/lib/home/garden";
import { cn } from "@/lib/utils";

const POT: Record<PlantId, string> = {
  moss: "#b86a4b",
  fern: "#d9cbb4",
  mint: "#7f9c86",
  monstera: "#3e4b70",
  bonsai: "#9ab8a8",
  moonflower: "#6c4a7f",
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
};

/** Growth stage from how many are owned: a sprout, then fuller, then full. */
export const stageFor = (count: number) => (count >= 25 ? 3 : count >= 10 ? 2 : 1);

const SCALE = { 1: 0.72, 2: 0.86, 3: 1 } as const;

const PlantSprite = ({
  id,
  stage = 3,
  size = 40,
  locked = false,
  className,
}: {
  id: PlantId;
  stage?: 1 | 2 | 3;
  size?: number;
  locked?: boolean;
  className?: string;
}) => {
  const s = SCALE[stage];
  return (
    <svg
      viewBox="0 0 40 48"
      width={size}
      height={size * 1.2}
      aria-hidden="true"
      className={cn(locked && "opacity-40 brightness-0 invert-[0.35]", className)}
    >
      <g transform={`translate(20 32) scale(${s}) translate(-20 -32)`}>{FOLIAGE[id]}</g>
      <rect x="8" y="31" width="24" height="4.5" rx="1.2" fill={POT[id]} />
      <path d="M9.5 35.5 H30.5 L28 46 H12 Z" fill={POT[id]} />
      <path d="M9.5 35.5 H30.5 L30.1 37.2 H9.9 Z" fill="black" opacity="0.18" />
      <rect x="9" y="31.6" width="22" height="1" rx="0.5" fill="white" opacity="0.18" />
    </svg>
  );
};

export default PlantSprite;
