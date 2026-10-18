"use client";
import { useScroll, useTransform, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface TimelineEntry {
  title: string;
  content: React.ReactNode;
}

/**
 * Adapted from the Aceternity timeline. Changes from the registry version:
 * the hardcoded heading and page background are gone (the section supplies
 * its own), colours read from tokens, and the scroll-linked progress line is
 * gold rather than purple-to-blue.
 */
export const Timeline = ({
  data,
  className,
}: {
  data: TimelineEntry[];
  className?: string;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  // The registry version measured once on mount, which reads stale after web
  // fonts land and reflow the entries. Observe instead.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setHeight(el.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 10%", "end 50%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.1], [0, 1]);

  return (
    <div className={cn("w-full", className)} ref={containerRef}>
      <div ref={ref} className="relative mx-auto w-full pb-20">
        {data.map((item, index) => (
          <div key={index} className="flex justify-start pt-10 md:gap-10 md:pt-32">
            <div className="sticky top-40 z-40 flex max-w-xs flex-col items-center self-start md:w-full md:flex-row lg:max-w-sm">
              <div className="bg-background absolute left-3 flex h-10 w-10 items-center justify-center rounded-full">
                <div className="border-gold bg-gold-soft h-4 w-4 rounded-full border-2" />
              </div>
              <h3 className="text-accent-text font-display hidden text-4xl font-medium md:block md:pl-20 md:text-5xl">
                {item.title}
              </h3>
            </div>

            <div className="relative w-full pr-4 pl-20 md:pl-4">
              <h3 className="text-accent-text font-display mb-4 block text-left text-3xl font-medium md:hidden">
                {item.title}
              </h3>
              {item.content}
            </div>
          </div>
        ))}

        {/* Track */}
        <div
          style={{ height: height + "px" }}
          className="via-gold-hair absolute top-0 left-8 w-0.5 overflow-hidden bg-linear-to-b from-transparent to-transparent mask-[linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
        >
          {/* Scroll-linked progress */}
          <motion.div
            style={{ height: heightTransform, opacity: opacityTransform }}
            className="from-gold via-gold-highlight absolute inset-x-0 top-0 w-0.5 rounded-full bg-linear-to-t to-transparent from-0% via-35%"
          />
        </div>
      </div>
    </div>
  );
};
