"use client";

import {
  levelFromXp,
  titleFor,
  totalXp,
  useGardenValue,
} from "@/lib/home/garden";
import { useHydrated, useNow } from "@/lib/home/store";
import { cn } from "@/lib/utils";

function greetingFor(hour: number) {
  if (hour >= 5 && hour < 12) return "good morning";
  if (hour >= 12 && hour < 17) return "good afternoon";
  return "good evening";
}

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
});
const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

/** Time-of-day greeting. Clock-dependent, so it renders blank until hydrated. */
const Greeting = ({ className }: { className?: string }) => {
  const now = useNow(60_000);
  const date = now ? new Date(now) : null;
  const hydrated = useHydrated();
  const level = useGardenValue((s) => levelFromXp(totalXp(s)));
  const title = hydrated ? titleFor(level) : null;

  return (
    <div
      className={cn(
        "transition-opacity duration-700 [text-shadow:0_1px_12px_rgb(0_0_0/0.25)]",
        date ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      <h1 className="font-display text-[2.6rem] leading-none tracking-tight md:text-5xl lg:text-[3.5rem]">
        {date ? greetingFor(date.getHours()) : "hello"}.
      </h1>
      <p className="text-foreground/75 mt-2.5 text-[0.8rem] md:text-[0.95rem]">
        {date ? `${dateFormat.format(date)} | ${timeFormat.format(date)}` : " "}
        {/* The title for the garden level: a new one every ten levels. */}
        {date && title ? ` | ${title}` : ""}
      </p>
    </div>
  );
};

export default Greeting;
