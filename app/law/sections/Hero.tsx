"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import SealMark from "@/components/law/SealMark";
import GoldRule from "@/components/law/GoldRule";
import { scrollToId } from "@/lib/utils";

const Hero = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Cursor parallax. Kept to a few pixels — at hero scale anything larger
  // reads as a gimmick rather than depth.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 20 });
  const sy = useSpring(my, { stiffness: 60, damping: 20 });

  // Two layers rather than one: the whole block drifts, and the seal drifts
  // a little further on top of it, so it still leads. Their sum matches the
  // seal's previous travel.
  const blockX = useTransform(sx, [-1, 1], [-8, 8]);
  const blockY = useTransform(sy, [-1, 1], [-8, 8]);
  const sealX = useTransform(sx, [-1, 1], [-6, 6]);
  const sealY = useTransform(sy, [-1, 1], [-6, 6]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = sectionRef.current;
    if (!el) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
      my.set(((e.clientY - r.top) / r.height) * 2 - 1);
    };
    el.addEventListener("pointermove", onMove);
    return () => el.removeEventListener("pointermove", onMove);
  }, [mx, my]);

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden px-[6vw] py-28 sm:py-0"
    >
      <motion.div
        style={{ x: blockX, y: blockY }}
        className="relative flex flex-col items-center gap-8 text-center"
      >
        <motion.div style={{ x: sealX, y: sealY }}>
          <SealMark size={120} animate className="max-sm:h-24 max-sm:w-24" />
        </motion.div>

        <p className="c-eyebrow mb-0 max-sm:text-xs">LLB / BCompSci | UNSW</p>

        {/* Per-character reveal. Deliberately not GSAP SplitText: under React
            StrictMode its effect runs twice, the text gets split twice, and
            the characters collapse into one another. */}
        <h1
          className="font-display c-gold-sweep text-7xl leading-[1.05] font-medium sm:text-8xl lg:text-9xl"
          style={{ animationDelay: "1.15s" }}
          aria-label="Tom Liu"
        >
          {"Tom Liu".split("").map((ch, i) => (
            <motion.span
              key={i}
              aria-hidden="true"
              className="inline-block"
              initial={{ opacity: 0, y: 64 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.95,
                delay: 0.25 + i * 0.07,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {ch === " " ? " " : ch}
            </motion.span>
          ))}
        </h1>

        <div className="w-full max-w-sm">
          <GoldRule fade="center" />
        </div>

        <p className="text-muted-foreground max-w-xl text-xl leading-relaxed text-balance italic">
          Hoping to pass the bar rather than walk into one.
        </p>

        <button
          type="button"
          onClick={() => scrollToId("me")}
          className="border-gold-hair hover:border-gold hover:text-accent-text text-muted-foreground mt-4 cursor-pointer border px-8 py-3 text-sm font-semibold tracking-[0.18em] uppercase transition-colors"
        >
          Read on
        </button>
      </motion.div>
    </section>
  );
};

export default Hero;
