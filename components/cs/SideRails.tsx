"use client";

import { useEffect, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { cn } from "@/lib/utils";
import {
  GLASS_BLUR,
  GLASS_SCROLL_THRESHOLD,
  GLASS_SHADOW,
  GLASS_TRANSITION,
} from "@/components/shared/glass";

/**
 * Fills the empty margins on wide screens with an IDE-gutter motif: a file
 * path and branch down the left, scroll position and the active section down
 * the right, joined by hairlines.
 *
 * Mirrors the navbar: sitting further out and bare on the landing, then
 * condensing into a glass capsule and sliding inward on the same scroll
 * threshold, with the same spring and the same surface values.
 *
 * Hidden below xl, where there are no spare margins to decorate.
 */

const SECTIONS = [
  { id: "home", label: "home" },
  { id: "me", label: "about" },
  { id: "projects", label: "projects" },
  { id: "contact", label: "contact" },
];

const railText =
  "font-mono text-[11px] tracking-[0.22em] uppercase text-zinc-600 dark:text-zinc-300";

const Rail = ({
  side,
  visible,
  children,
}: {
  side: "left" | "right";
  visible: boolean;
  children: React.ReactNode;
}) => (
  <div
    className={`pointer-events-none fixed ${side}-0 top-1/2 z-20 hidden -translate-y-1/2 px-3 xl:block`}
  >
    <motion.div
      animate={{
        backdropFilter: visible ? GLASS_BLUR : "none",
        boxShadow: visible ? GLASS_SHADOW : "none",
        opacity: visible ? 1 : 0,
        // Further out on the landing, sliding in as the capsule forms.
        x: visible ? 0 : side === "left" ? -26 : 26,
      }}
      transition={GLASS_TRANSITION}
      className={cn(
        "flex flex-col items-center gap-6 rounded-full bg-transparent px-3.5 py-9",
        visible && "bg-nav-surface/80",
      )}
    >
      {children}
    </motion.div>
  </div>
);

const SideRails = () => {
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setVisible(latest > GLASS_SCROLL_THRESHOLD);
  });

  const progress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  // A raw 0–1 MotionValue would resolve to 0–1 *pixels* as a height.
  const progressHeight = useTransform(progress, (v) => `${v * 100}%`);

  const [pct, setPct] = useState(0);
  const [active, setActive] = useState("home");

  useEffect(() => {
    const unsub = progress.on("change", (v) => setPct(Math.round(v * 100)));
    return () => unsub();
  }, [progress]);

  // Which section is nearest the middle of the viewport.
  useEffect(() => {
    const onScroll = () => {
      const mid = window.innerHeight / 2;
      let best = SECTIONS[0].id;
      let bestDist = Infinity;
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = s.id;
        }
      }
      setActive(best);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <Rail side="left" visible={visible}>
        {/* Fixed height. The label is vertical text, so its *height* grows
            with the word ("home" vs "projects") and would otherwise shove
            the progress track up and down on every section change. */}
        <span
          className={`${railText} flex h-32 items-center justify-center [writing-mode:vertical-rl]`}
        >
          {active}
        </span>

        {/* Scroll progress */}
        <div className="relative h-40 w-px overflow-hidden bg-zinc-300 dark:bg-zinc-700">
          <motion.div
            className="absolute inset-x-0 top-0 bg-zinc-700 dark:bg-zinc-100"
            style={{ height: progressHeight }}
          />
        </div>

        {/* Fixed width for the same reason: "100%" is a character wider
            than "99%" and would otherwise widen the whole capsule. */}
        <span
          className="w-[4ch] text-center font-mono text-[11px] tabular-nums text-zinc-600 dark:text-zinc-300"
          aria-hidden="true"
        >
          {String(pct).padStart(2, "0")}%
        </span>
      </Rail>

      <Rail side="right" visible={visible}>
        <div className="h-24 w-px bg-linear-to-b from-transparent to-zinc-400 dark:to-zinc-500" />
        <span className={`${railText} [writing-mode:vertical-rl] rotate-180`}>
          ~/portfolio — main
        </span>
        <span
          className="font-mono text-[11px] text-zinc-600 dark:text-zinc-300"
          aria-hidden="true"
        >
          <span className="animate-pulse">_</span>
        </span>
        <div className="h-24 w-px bg-linear-to-t from-transparent to-zinc-400 dark:to-zinc-500" />
      </Rail>
    </>
  );
};

export default SideRails;
