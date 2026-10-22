"use client";

import { usePrefs } from "@/lib/home/prefs";
import { getScene } from "@/lib/home/scenes";
import { useNow } from "@/lib/home/store";
import { cn } from "@/lib/utils";

function greetingFor(hour: number) {
  if (hour < 5) return "Still up?";
  if (hour < 12) return "Good morning.";
  if (hour < 17) return "Good afternoon.";
  if (hour < 22) return "Good evening.";
  return "Late one tonight.";
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
const Greeting = () => {
  const now = useNow(60_000);
  const { scene } = usePrefs();
  const date = now ? new Date(now) : null;

  return (
    <div id="top" className="scroll-mt-24 pt-8 pb-8 sm:pt-12 sm:pb-10">
      <h1
        className={cn(
          "font-display min-h-[1.1em] text-5xl leading-[1.05] tracking-tight italic transition-opacity duration-700 sm:text-7xl",
          date ? "opacity-100" : "opacity-0",
        )}
      >
        {date ? greetingFor(date.getHours()) : "Hello."}
      </h1>
      <p className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base">
        <span className={cn("transition-opacity duration-700", date ? "opacity-100" : "opacity-0")}>
          {date ? `${dateFormat.format(date)} · ${timeFormat.format(date)}` : " "}
        </span>
        <span aria-hidden="true" className="bg-glass-edge hidden h-4 w-px sm:block" />
        <span className="text-foreground/75">{getScene(scene).tagline}</span>
      </p>
    </div>
  );
};

export default Greeting;
