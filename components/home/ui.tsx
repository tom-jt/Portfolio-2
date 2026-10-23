"use client";

import type { ComponentProps, ComponentType, ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Glass for the small controls that sit straight on the scene (chips, the
 * tab bar). Built from separate utilities rather than home-glass so that
 * an open state can swap the border colour and focus rings still show. No
 * backdrop blur, like home-glass: see globals.css.
 */
export const chipGlass =
  "bg-glass border border-glass-edge text-foreground shadow-[inset_0_1px_0_var(--glass-highlight),0_18px_40px_-24px_rgb(0_0_0/0.7)]";

/** Text that acts as a button, underlined so it never passes for plain
 *  text: faintly at rest, fully on hover. Colour and size are the caller's. */
export const textButton =
  "cursor-pointer rounded underline decoration-current/35 decoration-1 underline-offset-[3px] transition hover:text-foreground hover:decoration-current focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

/** Interactive chip: chipGlass plus hover and focus states. */
export const chipButton = `${chipGlass} cursor-pointer transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none`;

/**
 * "card" is a frosted-glass card floating over the scene. "bare" drops the
 * glass for when the container already is glass, like the phone's sheet.
 */
export type PanelChrome = "card" | "bare";

export const Panel = ({
  id,
  title,
  icon: Icon,
  actions,
  className,
  chrome = "card",
  children,
}: {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
  chrome?: PanelChrome;
  children: ReactNode;
}) => (
  <section
    id={id}
    aria-labelledby={`${id}-title`}
    className={cn(
      "relative flex flex-col",
      chrome === "card" && "home-glass rounded-[1.75rem] p-5",
      className,
    )}
  >
    <header className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Icon className="text-glow size-4 shrink-0" />
        <h2
          id={`${id}-title`}
          className="font-display text-[1.65rem] leading-none tracking-tight"
        >
          {title}
        </h2>
      </div>
      {actions}
    </header>
    {children}
  </section>
);

export const IconButton = ({
  label,
  className,
  children,
  ...props
}: ComponentProps<"button"> & { label: string }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={cn(
      "border-glass-edge text-foreground/80 hover:text-foreground focus-visible:ring-ring grid size-10 shrink-0 cursor-pointer place-items-center rounded-full border bg-white/4 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

export const PrimaryButton = ({
  className,
  children,
  ...props
}: ComponentProps<"button">) => (
  <button
    type="button"
    className={cn(
      "bg-glow text-primary-foreground focus-visible:ring-glow focus-visible:ring-offset-background inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-full px-6 text-sm font-semibold shadow-[0_8px_30px_-8px_var(--glow)] transition hover:brightness-110 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
      className,
    )}
    {...props}
  >
    {children}
  </button>
);

/** A row of mutually exclusive options, like the timer modes. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "border-glass-edge flex rounded-full border bg-black/15 p-1",
        className,
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "focus-visible:ring-ring flex-1 cursor-pointer rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap transition focus-visible:ring-2 focus-visible:outline-none",
            value === o.value
              ? "text-foreground bg-white/12 shadow-[inset_0_1px_0_rgb(255_255_255/0.08)]"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const Switch = ({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
}) => (
  <label className="flex cursor-pointer items-center justify-between gap-4 py-1.5">
    <span className="text-sm">
      {label}
      {hint && (
        <span className="text-muted-foreground block text-xs">{hint}</span>
      )}
    </span>
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "focus-visible:ring-ring relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition focus-visible:ring-2 focus-visible:outline-none",
        checked ? "bg-glow" : "bg-white/15",
      )}
    >
      <span
        className={cn(
          "absolute top-1 left-1 size-4 rounded-full bg-white shadow transition-transform",
          checked && "translate-x-5",
        )}
      />
    </button>
  </label>
);

/** Small muted label used above groups inside panels. */
export const Eyebrow = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <p
    className={cn(
      "text-muted-foreground text-xs font-medium",
      className,
    )}
  >
    {children}
  </p>
);

/** A number with − and + buttons, for minute settings. */
export const Stepper = ({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) => (
  <div className="flex items-center justify-between gap-4 py-1.5">
    <span className="text-sm">{label}</span>
    <div className="flex items-center gap-2">
      <IconButton
        label={`less ${label}`}
        className="size-8"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - step))}
      >
        <Minus className="size-3.5" />
      </IconButton>
      <span className="font-pixel w-16 text-center text-sm tabular-nums" aria-live="polite">
        {format(value)}
      </span>
      <IconButton
        label={`more ${label}`}
        className="size-8"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + step))}
      >
        <Plus className="size-3.5" />
      </IconButton>
    </div>
  </div>
);
