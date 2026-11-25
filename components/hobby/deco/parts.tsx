"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/** The hobby's accent, and its text shade (pale on dark, deep on paper). */
export const A = "var(--hb)";
export const I = "var(--hb-ink)";
export const CREAM = "#FFF6EC";
export const INK = "#1A1820";
export const RED = "#D63C55";
export const BLUSH = "#FFB3BD";
/** Sparkle white: cream on the dark ground, soft grey on paper. */
export const GLINT = "var(--hd-glint)";

/** Inline style with CSS custom properties in it. */
export const vars = (o: Record<string, string | number>) => o as CSSProperties;

/** The gutters were drawn on a 1200px-tall screen; tops scale with the window. */
export const vh = (y: number) => `${((y / 1200) * 100).toFixed(2)}%`;

/** A small, seeded random source, so server and client draw the same thing. */
export const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

/**
 * A block of decoration. It stops animating while it is off screen, and it
 * is hidden from assistive tech and the pointer.
 */
export const Region = ({
  className,
  style,
  children,
}: {
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.removeAttribute("data-off");
      else el.setAttribute("data-off", "");
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} aria-hidden="true" className={cn("hd", className)} style={style}>
      {children}
    </div>
  );
};

export const Spark = ({ x, y, s, c, d }: { x: number; y: number | string; s: number; c: string; d: number }) => (
  <svg
    className="hd-spark"
    style={{ left: x, top: y, animationDelay: `${d}s` }}
    width={s}
    height={s}
    viewBox="0 0 24 24"
  >
    <path d="M12 2l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill={c} />
  </svg>
);

/** A handwritten note in the hobby's ink. */
export const Note = ({
  x,
  y,
  rotate = -4,
  size = 24,
  muted,
  children,
}: {
  x: number;
  y: number | string;
  rotate?: number;
  size?: number;
  muted?: boolean;
  children: ReactNode;
}) => (
  <span
    className={cn(
      "font-hand absolute leading-[1.05] whitespace-nowrap",
      muted ? "text-muted-foreground" : "text-hb-ink",
    )}
    style={{
      left: x,
      top: y,
      fontSize: size,
      transform: `rotate(${rotate}deg)`,
    }}
  >
    {children}
  </span>
);
