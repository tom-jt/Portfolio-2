"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Droplet } from "lucide-react";
import SceneSwitcher from "@/components/home/SceneSwitcher";
import SiteSwitcher from "@/components/shared/SiteSwitcher";
import { formatNumber } from "@/lib/home/format";
import { levelProgress, useGarden } from "@/lib/home/garden";
import { useHydrated } from "@/lib/home/store";
import { cn, scrollToId } from "@/lib/utils";

/** Level ring and drop count. Rewards land just below it as toasts. */
const HudChip = () => {
  const garden = useGarden();
  const hydrated = useHydrated();
  const { level, into, span } = levelProgress(garden.xp);
  const r = 13;
  const c = 2 * Math.PI * r;

  return (
    <button
      type="button"
      onClick={() => scrollToId("garden")}
      aria-label={`Garden level ${level}, ${Math.floor(garden.drops)} drops. Go to the garden.`}
      className={cn(
        "border-glass-edge focus-visible:ring-ring flex h-10 cursor-pointer items-center gap-2 rounded-full border bg-white/4 pr-3.5 pl-1 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none",
        // Stored progress is only known after hydration; fade in rather than
        // flash "Lv 1 · 0" at returning visitors.
        hydrated ? "opacity-100" : "opacity-0",
      )}
    >
      <span className="relative grid size-8 place-items-center">
        <svg viewBox="0 0 32 32" className="absolute inset-0 -rotate-90">
          <circle cx="16" cy="16" r={r} fill="none" stroke="currentColor" strokeOpacity="0.12" strokeWidth="2.5" />
          <circle
            cx="16"
            cy="16"
            r={r}
            fill="none"
            stroke="var(--glow)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - into / span)}
            className="transition-[stroke-dashoffset] duration-700"
          />
        </svg>
        <span className="font-pixel text-xs">{level}</span>
      </span>
      <span className="font-pixel text-glow-2 flex items-center gap-1 text-sm tabular-nums">
        <Droplet className="size-3.5" />
        {formatNumber(garden.drops)}
      </span>
    </button>
  );
};

const TopBar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-80 transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "bg-glass-strong/70 border-glass-edge border-b backdrop-blur-xl"
          : "border-b border-transparent",
      )}
    >
      <div className="mx-auto flex h-16 max-w-[90rem] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
        <a href="#top" className="group flex min-w-0 items-center gap-2.5">
          <Image
            src="/images/logos/LogoSimpleDarkTrans.png"
            alt=""
            width={30}
            height={30}
            className="opacity-90 transition group-hover:opacity-100"
          />
          <span className="font-display truncate text-[1.6rem] leading-none italic">
            tom&rsquo;s room
          </span>
        </a>

        <nav aria-label="Home controls" className="flex items-center gap-2 sm:gap-3">
          <HudChip />
          <SceneSwitcher />
          <span aria-hidden="true" className="bg-glass-edge mx-1 hidden h-6 w-px sm:block" />
          <div className="text-nav-fg hidden items-center gap-4 sm:flex">
            <SiteSwitcher to="cs" className="hover:text-nav-fg-hover" />
            <SiteSwitcher to="law" className="hover:text-nav-fg-hover" />
          </div>
        </nav>
      </div>
    </header>
  );
};

export default TopBar;
