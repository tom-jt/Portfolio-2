import { cn } from "@/lib/utils";

interface GuillocheRingsProps {
  /** Rendered width in px, or any CSS length via className instead. */
  size?: number;
  /** Number of concentric rings. */
  rings?: number;
  /**
   * `half` centres the rings on the bottom edge, so only the upper arcs
   * render — an arch sitting on whatever rule follows it.
   */
  half?: boolean;
  /**
   * With `half`, trims a further fraction of the half-circle off the bottom
   * (0.25 = another quarter). Because the element is anchored to the bottom
   * of its container, a shorter box lowers the arcs by exactly that amount
   * rather than scaling them — nothing renders below the cut, so it cannot
   * spill past the page or disturb the content it sits behind.
   */
  crop?: number;
  /** Per-ring stroke opacity. */
  opacity?: number;
  className?: string;
}

const BOX = 400;
const OUTER = 196;

/**
 * Thin concentric rings — engraved-watermark decoration. Deliberately not the
 * monogram seal: at large sizes the "TL" reads as a logo drop rather than as
 * background, so the plain rings carry the same motif without competing.
 */
const GuillocheRings = ({
  size,
  rings = 6,
  half = false,
  crop = 0,
  opacity = 0.16,
  className,
}: GuillocheRingsProps) => {
  // Centre stays at the middle of the box; for `half` the viewBox is cropped
  // to the top of it, so the circles are cut exactly on their diameter.
  const cy = BOX / 2;
  const height = half ? (BOX / 2) * (1 - Math.min(Math.max(crop, 0), 0.9)) : BOX;
  // Innermost ring sits at ~35% of the outer, which keeps the spacing even.
  const inner = OUTER * 0.35;
  const step = rings > 1 ? (OUTER - inner) / (rings - 1) : 0;

  return (
    <svg
      aria-hidden="true"
      width={size}
      viewBox={`0 0 ${BOX} ${height}`}
      fill="none"
      className={cn("text-gold", className)}
    >
      {Array.from({ length: rings }, (_, i) => (
        <circle
          key={i}
          cx={BOX / 2}
          cy={cy}
          r={inner + i * step}
          stroke="currentColor"
          strokeWidth="0.7"
          opacity={opacity}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
};

export default GuillocheRings;
