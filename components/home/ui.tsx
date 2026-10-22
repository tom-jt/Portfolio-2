"use client";

import type { ComponentProps, ComponentType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** A frosted-glass card over the scene. */
export const Panel = ({
  id,
  title,
  icon: Icon,
  actions,
  className,
  children,
}: {
  id: string;
  title: string;
  icon: ComponentType<{ className?: string }>;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <section
    id={id}
    aria-labelledby={`${id}-title`}
    className={cn(
      "home-glass relative flex scroll-mt-24 flex-col rounded-[1.75rem] p-5 sm:p-6",
      className,
    )}
  >
    <header className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <Icon className="text-glow size-4 shrink-0" />
        <h2
          id={`${id}-title`}
          className="font-display text-[1.65rem] leading-none tracking-tight italic"
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

/** Small uppercase label used above groups inside panels. */
export const Eyebrow = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => (
  <p
    className={cn(
      "text-muted-foreground text-[0.68rem] font-semibold tracking-[0.22em] uppercase",
      className,
    )}
  >
    {children}
  </p>
);
