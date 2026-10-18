import { cn } from "@/lib/utils";

interface SealMarkProps {
  size?: number;
  className?: string;
  /** Draws the rings on with a stroke-dash animation. Used by the curtain. */
  animate?: boolean;
  initials?: string;
  /** Inline colour override; beats the default `text-gold` class. */
  style?: React.CSSProperties;
}

const OUTER_R = 47;
const INNER_R = 40;
const OUTER_C = 2 * Math.PI * OUTER_R;
const INNER_C = 2 * Math.PI * INNER_R;

/**
 * Wax-seal monogram. Inherits `currentColor`, so colour it with `text-gold`
 * (or anything else) at the call site rather than hardcoding a fill.
 */
const SealMark = ({
  size = 112,
  className,
  animate = false,
  initials = "TL",
  style,
}: SealMarkProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
      className={cn("text-gold", className)}
      style={style}
    >
      <circle
        cx="50"
        cy="50"
        r={OUTER_R}
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray={animate ? OUTER_C : undefined}
        strokeDashoffset={animate ? OUTER_C : undefined}
        style={
          animate
            ? { animation: "seal-draw 900ms ease-out 80ms forwards" }
            : undefined
        }
      />
      <circle
        cx="50"
        cy="50"
        r={INNER_R}
        stroke="currentColor"
        strokeWidth="1.1"
        opacity="0.75"
        strokeDasharray={animate ? INNER_C : undefined}
        strokeDashoffset={animate ? INNER_C : undefined}
        style={
          animate
            ? { animation: "seal-draw 900ms ease-out 220ms forwards" }
            : undefined
        }
      />
      {/* Four hairline ticks at the quarters — a seal's register marks. */}
      {[0, 90, 180, 270].map((deg) => (
        <line
          key={deg}
          x1="50"
          y1="3"
          x2="50"
          y2="9"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.9"
          transform={`rotate(${deg} 50 50)`}
        />
      ))}
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        style={{
          fontFamily: "var(--font-cormorant), serif",
          fontSize: "34px",
          fontWeight: 600,
          letterSpacing: "0.06em",
        }}
      >
        {initials}
      </text>
    </svg>
  );
};

export default SealMark;
