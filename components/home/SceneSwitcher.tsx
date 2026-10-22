"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Lock, Palette } from "lucide-react";
import { levelFromXp, useGarden } from "@/lib/home/garden";
import { setPrefs, usePrefs } from "@/lib/home/prefs";
import { SCENES } from "@/lib/home/scenes";
import { cn } from "@/lib/utils";
import { IconButton } from "./ui";

/** Scene picker. Locked scenes show the garden level that opens them. */
const SceneSwitcher = () => {
  const { scene } = usePrefs();
  const level = levelFromXp(useGarden().xp);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <IconButton
        label="Change scene"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        <Palette className="size-4" />
      </IconButton>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="bg-glass-strong border-glass-edge absolute top-12 right-0 z-50 w-72 origin-top-right rounded-2xl border p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl"
          >
            <p className="text-muted-foreground px-2.5 pt-1.5 pb-2 text-[0.68rem] font-semibold tracking-[0.22em] uppercase">
              Scene
            </p>
            <ul className="flex flex-col gap-1">
              {SCENES.map((s) => {
                const locked = level < s.unlockLevel;
                const active = s.id === scene;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      disabled={locked}
                      aria-pressed={active}
                      onClick={() => {
                        setPrefs({ scene: s.id });
                        setOpen(false);
                      }}
                      className={cn(
                        "focus-visible:ring-ring flex w-full cursor-pointer items-center gap-3 rounded-xl p-2 text-left transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
                        active ? "bg-white/10" : "hover:bg-white/6",
                      )}
                    >
                      <span
                        className={cn(
                          "border-glass-edge size-10 shrink-0 rounded-lg border",
                          locked && "opacity-35 grayscale",
                        )}
                        style={{
                          background: `linear-gradient(160deg, ${s.swatch[0]} 35%, ${s.swatch[1]})`,
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block text-sm font-medium",
                            locked && "text-muted-foreground",
                          )}
                        >
                          {s.name}
                        </span>
                        <span className="text-muted-foreground block text-xs">
                          {locked
                            ? `Reach garden level ${s.unlockLevel}`
                            : s.ambienceLabel}
                        </span>
                      </span>
                      {locked ? (
                        <Lock className="text-muted-foreground size-4" />
                      ) : active ? (
                        <Check className="text-glow size-4" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="text-muted-foreground px-2.5 pt-2 pb-1 text-xs">
              More scenes open up as your garden grows.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SceneSwitcher;
