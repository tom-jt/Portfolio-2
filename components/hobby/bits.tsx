/* eslint-disable @next/next/no-img-element -- card pictures come from
   YouTube and from any page a card links to, so next/image's host list
   can't cover them. */

import { cn } from "@/lib/utils";
import type { Progress, Tag } from "@/lib/hobby/model";

const PROGRESS_CLASS: Record<Progress, string> = {
  Todo: "hb-p-todo",
  Progressing: "hb-p-progressing",
  Done: "hb-p-done",
};

/** Empty, half, or ticked, so progress reads without colour too. */
export const ProgressMark = ({
  progress,
  size = 13,
}: {
  progress: Progress;
  size?: number;
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    className={PROGRESS_CLASS[progress]}
  >
    <circle
      cx="12"
      cy="12"
      r="8"
      fill={progress === "Done" ? "var(--t-solid)" : "none"}
      stroke="var(--t-solid)"
      strokeWidth="2.2"
    />
    {progress === "Progressing" && (
      <path d="M12 4a8 8 0 0 1 0 16z" fill="var(--t-solid)" />
    )}
    {progress === "Done" && (
      <path
        d="M8.5 12.2l2.4 2.4 4.6-4.8"
        fill="none"
        stroke="var(--hb-on)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

export const TagChip = ({
  tag,
  large = false,
  className,
  children,
}: {
  tag: Pick<Tag, "name" | "colour">;
  large?: boolean;
  className?: string;
  children?: React.ReactNode;
}) => (
  <span
    className={cn(
      "hb-chip inline-flex items-center",
      `hb-tag-${tag.colour}`,
      large
        ? "rounded-lg px-2.5 py-1 text-[13px]"
        : "rounded-md px-2 py-0.5 text-xs",
      className,
    )}
  >
    {tag.name}
    {children}
  </span>
);

/** The hobby's outline mark, as a watermark. */
export const Mark = ({
  d,
  className,
  strokeWidth = 0.6,
}: {
  d: string;
  className?: string;
  strokeWidth?: number;
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    className={className}
  >
    <path d={d} />
  </svg>
);

/** A card's picture, or the hobby's own placeholder when it has none. */
export const Thumb = ({
  image,
  mark,
  spot,
  className,
  markClassName,
}: {
  image: string | null;
  mark: string;
  /** Which corner the placeholder's glow sits in, so a grid of them varies. */
  spot: number;
  className?: string;
  markClassName?: string;
}) => {
  const at = ["85% 15%", "15% 85%", "80% 90%"][spot % 3];
  return (
    <span
      className={cn("bg-hb-thumb relative block overflow-hidden", className)}
      style={
        image
          ? undefined
          : {
              backgroundImage: `radial-gradient(circle at ${at}, rgb(var(--hb-rgb) / 0.38), transparent 62%)`,
            }
      }
    >
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <Mark
          d={mark}
          className={cn("text-hb-ink absolute opacity-50", markClassName)}
        />
      )}
    </span>
  );
};

/** A small, stable number from a card id, for tilts and which cards get tape. */
export const hashOf = (id: string) =>
  [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

/** A polaroid's tilt, between -2.4 and 2.4 degrees, the same on every visit. */
export const tiltOf = (id: string) => ((hashOf(id) % 49) - 24) / 10;

/**
 * Rough ink: wobbly edges and a few gaps, as if rubber-stamped. Rendered once
 * on the page; stamps refer to it by id.
 */
export const InkFilter = () => (
  <svg width="0" height="0" className="absolute" aria-hidden="true">
    <filter id="hb-ink" x="-15%" y="-15%" width="130%" height="130%">
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.9"
        numOctaves="2"
        seed="4"
        result="n"
      />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" result="d" />
      <feTurbulence
        type="fractalNoise"
        baseFrequency="1.6"
        numOctaves="1"
        seed="11"
        result="s"
      />
      <feColorMatrix
        in="s"
        type="matrix"
        values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  -2 0 0 0 1.75"
        result="m"
      />
      <feComposite in="d" in2="m" operator="in" />
    </filter>
  </svg>
);

const STAMP_WORDS: Record<Progress, string> = {
  Done: "done",
  Progressing: "progressing",
  Todo: "todo",
};

/**
 * Progress as a rubber stamp in the hobby's ink: a ringed tick for done, a
 * box for in progress, a dashed grey oval for next up. The shape tells them
 * apart without colour, and the label says the plain value.
 */
export const Stamp = ({
  progress,
  size = 1,
  className,
}: {
  progress: Progress;
  size?: number;
  className?: string;
}) => {
  const hand = { fontFamily: "var(--font-nanum)" };
  const label = `Progress: ${progress === "Todo" ? "To do" : progress}`;
  if (progress === "Done") {
    return (
      <svg
        role="img"
        aria-label={label}
        width={58 * size}
        height={58 * size}
        viewBox="0 0 92 92"
        filter="url(#hb-ink)"
        className={cn("shrink-0 opacity-90", className)}
      >
        <circle
          cx="46"
          cy="46"
          r="42"
          fill="none"
          stroke="var(--hb-paper-ink)"
          strokeWidth="3.4"
        />
        <circle
          cx="46"
          cy="46"
          r="35"
          fill="none"
          stroke="var(--hb-paper-ink)"
          strokeWidth="1.6"
        />
        <text
          x="46"
          y="44"
          textAnchor="middle"
          fontSize="25"
          fill="var(--hb-paper-ink)"
          style={hand}
        >
          {STAMP_WORDS.Done}
        </text>
        <path
          d="M30 53l9 8 20-18"
          stroke="var(--hb-paper-ink)"
          strokeWidth="3.6"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (progress === "Progressing") {
    return (
      <svg
        role="img"
        aria-label={label}
        width={104 * size}
        height={36 * size}
        viewBox="0 0 130 46"
        filter="url(#hb-ink)"
        className={cn("shrink-0 opacity-90", className)}
      >
        <rect
          x="3"
          y="3"
          width="124"
          height="40"
          rx="6"
          fill="none"
          stroke="var(--hb-paper-ink)"
          strokeWidth="3"
        />
        <text
          x="65"
          y="31"
          textAnchor="middle"
          fontSize="27"
          fill="var(--hb-paper-ink)"
          style={hand}
        >
          {STAMP_WORDS.Progressing}
        </text>
      </svg>
    );
  }
  return (
    <svg
      role="img"
      aria-label={label}
      width={80 * size}
      height={36 * size}
      viewBox="0 0 100 46"
      filter="url(#hb-ink)"
      className={cn("shrink-0 opacity-90", className)}
    >
      <rect
        x="3"
        y="3"
        width="94"
        height="40"
        rx="20"
        fill="none"
        stroke="#7a7383"
        strokeWidth="2.6"
        strokeDasharray="6 5"
      />
      <text
        x="50"
        y="31"
        textAnchor="middle"
        fontSize="27"
        fill="#7a7383"
        style={hand}
      >
        {STAMP_WORDS.Todo}
      </text>
    </svg>
  );
};

/** A tag written in by hand, in the tag's own ink: #sleights. */
export const TagNote = ({
  tag,
  className,
}: {
  tag: Pick<Tag, "name" | "colour">;
  className?: string;
}) => (
  <span
    className={cn(
      `hb-tag-${tag.colour} font-hand text-(--t-ink) leading-none`,
      className,
    )}
  >
    #{tag.name.toLowerCase()}
  </span>
);
