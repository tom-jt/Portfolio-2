"use client";

import SectionTitle from "@/components/shared/SectionTitle";
import { Timeline as ScrollTimeline } from "@/components/ui/timeline";
import { milestones } from "@/data/law/timeline";
import GoldCorners from "@/components/law/GoldCorners";
import GuillocheRings from "@/components/law/GuillocheRings";

const Timeline = () => {
  const data = milestones.map((m, i) => ({
    title: m.period,
    content: (
      <div className="border-border bg-card relative border p-7">
        {/* Alternate the diagonal so consecutive entries don't stack. */}
        <GoldCorners corners={i % 2 === 0 ? ["tl", "br"] : ["tr", "bl"]} />
        <p className="font-display text-2xl leading-tight font-semibold">
          {m.org}
        </p>
        <p className="text-accent-text mt-1 text-sm font-semibold tracking-[0.14em] uppercase">
          {m.role}
        </p>
        <p className="text-muted-foreground mt-4 text-base leading-relaxed">
          {m.body}
        </p>
        {m.tags.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2">
            {m.tags.map((t) => (
              <span
                key={t}
                className="border-gold-hair text-muted-foreground border px-3 py-1 text-xs tracking-wide"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    ),
  }));

  return (
    <section
      id="timeline"
      className="flex w-full scroll-mt-32 flex-col items-center gap-6"
    >
      <SectionTitle eyebrow="Timeline" title="What Did I Do?" as="h2" />

      <div className="relative w-full">
        {/* Decorative seals down the length of the record. */}
        <GuillocheRings
          size={340}
          rings={6}
          opacity={0.42}
          className="pointer-events-none absolute top-[10%] -right-24 -z-10"
        />
        <GuillocheRings
          size={210}
          rings={5}
          opacity={0.38}
          className="pointer-events-none absolute top-[46%] -left-28 -z-10"
        />
        <GuillocheRings
          size={420}
          rings={7}
          opacity={0.32}
          className="pointer-events-none absolute right-[18%] bottom-[4%] -z-10"
        />
        <ScrollTimeline data={data} />
      </div>
    </section>
  );
};

export default Timeline;
