"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";

/**
 * The certificate frame, promoted out of the hero so it can follow the page.
 *
 * It is positioned in *document* space rather than fixed to the viewport.
 * That is what makes it sit still while you read a section: the box is the
 * section's own box, so it simply scrolls with the content. It only animates
 * when the active section changes — when the viewport's midpoint crosses into
 * the next one — and then it snaps to that whole section.
 */

const SECTIONS = ["home", "me", "timeline", "contact"];
/**
 * Contact carries its own arch, so the frame does not enclose it. Rather than
 * fading out, it stays parked on the last framed section above — which is why
 * this resolves to a *target* section instead of just hiding.
 */
const UNFRAMED = new Set(["contact"]);

/** Breathing room so the rule never runs into the section's text. */
const PAD = 56;
/** The hero starts at the top of the document; clear the navbar. */
const NAV_CLEARANCE = 112;
/** ...and pull its lower edge in, so the landing frame closes on screen. */
const HERO_BOTTOM_INSET = 88;

const CornerTick = ({ at }: { at: "tl" | "tr" | "bl" | "br" }) => {
  const pos = {
    tl: "top-0 left-0 border-t-2 border-l-2",
    tr: "top-0 right-0 border-t-2 border-r-2",
    bl: "bottom-0 left-0 border-b-2 border-l-2",
    br: "bottom-0 right-0 border-b-2 border-r-2",
  }[at];
  return <div className={`border-gold absolute h-8 w-8 ${pos}`} />;
};

interface Box {
  top: number;
  height: number;
}

const SectionFrame = () => {
  const [box, setBox] = useState<Box | null>(null);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const vh = window.innerHeight;
      const centre = window.scrollY + vh / 2;

      const rects = SECTIONS.map((id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const top = r.top + window.scrollY;
        return { id, top, bottom: top + r.height };
      });

      // The section containing the viewport's midpoint wins, so handover
      // happens halfway rather than the instant a boundary appears.
      //
      // Containment and the fallback are tracked separately on purpose. When
      // they shared one variable, the first section that merely *failed* to
      // contain the midpoint latched it — so whenever the midpoint sat in the
      // gap between two sections, the frame jumped to the top of the page.
      let contained = -1;
      let nearestIndex = -1;
      let nearest = Infinity;
      rects.forEach((r, i) => {
        if (!r) return;
        if (centre >= r.top && centre < r.bottom) {
          contained = i;
          return;
        }
        const dist = Math.min(
          Math.abs(centre - r.top),
          Math.abs(centre - r.bottom),
        );
        if (dist < nearest) {
          nearest = dist;
          nearestIndex = i;
        }
      });

      const activeIndex = contained !== -1 ? contained : nearestIndex;
      if (activeIndex === -1) return;

      // Walk back to the nearest framed section. Doing this by index rather
      // than by remembering the previous box means a reload straight into the
      // contact section still parks the frame on the timeline.
      let target = activeIndex;
      while (target > 0 && UNFRAMED.has(SECTIONS[target])) target -= 1;

      const r = rects[target];
      if (!r) return;

      const isHero = target === 0;
      const top = isHero ? NAV_CLEARANCE : r.top - PAD;
      const bottom = isHero ? r.bottom - HERO_BOTTOM_INSET : r.bottom + PAD;

      const next = { top, height: Math.max(bottom - top, 200) };
      setBox((prev) =>
        prev &&
        Math.abs(prev.top - next.top) < 1 &&
        Math.abs(prev.height - next.height) < 1
          ? prev
          : next,
      );
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Sections reflow when the web fonts land.
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
    };
  }, []);

  if (!box) return null;

  return (
    <motion.div
      aria-hidden="true"
      initial={false}
      animate={{ top: box.top, height: box.height }}
      transition={{ type: "spring", stiffness: 110, damping: 24, mass: 0.9 }}
      className="pointer-events-none absolute inset-x-[5vw] z-0 hidden sm:block"
    >
      <div className="border-gold-hair absolute inset-0 border" />
      <CornerTick at="tl" />
      <CornerTick at="tr" />
      <CornerTick at="bl" />
      <CornerTick at="br" />
    </motion.div>
  );
};

export default SectionFrame;
