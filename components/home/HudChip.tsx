"use client";

import { Droplet } from "lucide-react";
import { formatNumber } from "@/lib/home/format";
import { levelProgress, useGarden } from "@/lib/home/garden";
import { useHydrated } from "@/lib/home/store";
import { cn } from "@/lib/utils";
import { chipButton } from "./ui";

/** Level ring and drop count. Opens the garden. */
const HudChip = ({ open, onClick }: { open: boolean; onClick: () => void }) => {
  const garden = useGarden();
  const hydrated = useHydrated();
  const { level, into, span } = levelProgress(garden.xp);
  const r = 13;
  const c = 2 * Math.PI * r;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-label={`garden, level ${level}, ${Math.floor(garden.drops)} drops`}
      className={cn(
        chipButton,
        "flex h-10 items-center gap-2 rounded-full pr-3.5 pl-1",
        open && "border-glow/55",
        // Stored progress is only known after hydration; fade in rather than
        // flash "lv 1 · 0" at returning visitors.
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

export default HudChip;
