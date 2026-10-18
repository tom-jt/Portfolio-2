import { cn } from "@/lib/utils";

type Corner = "tl" | "tr" | "bl" | "br";

interface GoldCornersProps {
  /** Defaults to the diagonal pair, which reads lighter than all four. */
  corners?: Corner[];
  /** Gap between the bracket and the box it sits outside, in px. */
  offset?: number;
  /** Length of the long (horizontal) arm, in px. */
  length?: number;
  /**
   * Short arm as a fraction of the long one. The deliberate asymmetry stops
   * the brackets reading as crop marks.
   */
  ratio?: number;
  className?: string;
}

/**
 * Hairline brackets floating outside a box's corners, each arm fading away
 * from the corner. Renders in an absolutely-positioned layer, so the parent
 * needs `relative` and the brackets never affect layout.
 */
const ARMS: Record<Corner, { box: string; h: string; v: string }> = {
  tl: {
    box: "top-0 left-0",
    h: "top-0 left-0 bg-linear-to-r from-gold-hair from-40% to-transparent",
    v: "top-0 left-0 bg-linear-to-b from-gold-hair from-40% to-transparent",
  },
  tr: {
    box: "top-0 right-0",
    h: "top-0 right-0 bg-linear-to-l from-gold-hair from-40% to-transparent",
    v: "top-0 right-0 bg-linear-to-b from-gold-hair from-40% to-transparent",
  },
  bl: {
    box: "bottom-0 left-0",
    h: "bottom-0 left-0 bg-linear-to-r from-gold-hair from-40% to-transparent",
    v: "bottom-0 left-0 bg-linear-to-t from-gold-hair from-40% to-transparent",
  },
  br: {
    box: "bottom-0 right-0",
    h: "bottom-0 right-0 bg-linear-to-l from-gold-hair from-40% to-transparent",
    v: "bottom-0 right-0 bg-linear-to-t from-gold-hair from-40% to-transparent",
  },
};

const GoldCorners = ({
  corners = ["tl", "br"],
  offset = 15,
  length = 96,
  ratio = 0.5,
  className,
}: GoldCornersProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute", className)}
      style={{ inset: -offset }}
    >
      {corners.map((c) => {
        const arm = ARMS[c];
        return (
          <div key={c} className={cn("absolute", arm.box)}>
            <span
              className={cn("absolute block h-px", arm.h)}
              style={{ width: length }}
            />
            <span
              className={cn("absolute block w-px", arm.v)}
              style={{ height: Math.round(length * ratio) }}
            />
          </div>
        );
      })}
    </div>
  );
};

export default GoldCorners;
