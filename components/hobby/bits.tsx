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
export const ProgressMark = ({ progress, size = 13 }: { progress: Progress; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className={PROGRESS_CLASS[progress]}>
    <circle
      cx="12"
      cy="12"
      r="8"
      fill={progress === "Done" ? "var(--t-solid)" : "none"}
      stroke="var(--t-solid)"
      strokeWidth="2.2"
    />
    {progress === "Progressing" && <path d="M12 4a8 8 0 0 1 0 16z" fill="var(--t-solid)" />}
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

export const ProgressBadge = ({
  progress,
  large = false,
}: {
  progress: Progress;
  large?: boolean;
}) => (
  <span
    className={cn(
      "hb-chip inline-flex shrink-0 items-center",
      PROGRESS_CLASS[progress],
      large ? "gap-1.5 rounded-[10px] py-1 pr-3 pl-2 text-sm" : "gap-1.5 rounded-lg py-0.5 pr-2 pl-1.5 text-xs",
    )}
  >
    <ProgressMark progress={progress} size={large ? 15 : 13} />
    {progress}
  </span>
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
      large ? "rounded-lg px-2.5 py-1 text-[13px]" : "rounded-md px-2 py-0.5 text-xs",
      className,
    )}
  >
    {tag.name}
    {children}
  </span>
);

/** The hobby's outline mark, as a watermark. */
export const Mark = ({ d, className, strokeWidth = 0.6 }: { d: string; className?: string; strokeWidth?: number }) => (
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
          : { backgroundImage: `radial-gradient(circle at ${at}, rgb(var(--hb-rgb) / 0.38), transparent 62%)` }
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
        <Mark d={mark} className={cn("text-hb-ink absolute opacity-50", markClassName)} />
      )}
    </span>
  );
};
