"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Lock, Palette } from "lucide-react";
import { levelFromXp, useGarden } from "@/lib/home/garden";
import { setPrefs, usePrefs } from "@/lib/home/prefs";
import { getAmbience, SCENES } from "@/lib/home/scenes";
import { describeTheme, THEMES } from "@/lib/home/themes";
import { cn } from "@/lib/utils";
import { ScenePreview } from "./scenes/previews";
import { IconButton } from "./ui";

/** One colour theme in the picker: a tile of its glass and glows, named. */
const Swatch = ({
  name,
  title,
  active,
  onClick,
  children,
}: {
  name: string;
  title: string;
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={active}
    title={title}
    onClick={onClick}
    className={cn(
      "focus-visible:ring-ring flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl px-1 pt-2 pb-1.5 transition focus-visible:ring-2 focus-visible:outline-none",
      active ? "bg-white/10" : "hover:bg-white/6",
    )}
  >
    {children}
    <span className={cn("text-[0.7rem]", active ? "text-foreground" : "text-muted-foreground")}>
      {name}
    </span>
  </button>
);

const TILE = "border-glass-edge relative size-10 overflow-hidden rounded-lg border";

/**
 * Scene and colour picker. Locked scenes show the garden level that opens
 * them. Colours stay open on a pick, so they can be tried one after another.
 */
const SceneSwitcher = () => {
  const { scene, theme } = usePrefs();
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
        label="Scene and colours"
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
            className="bg-glass-strong border-glass-edge absolute top-12 right-0 z-50 max-h-[calc(100dvh-5rem)] w-72 origin-top-right overflow-y-auto rounded-2xl border p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] backdrop-blur-xl"
          >
            <p className="text-muted-foreground px-2.5 pt-1.5 pb-2 text-xs font-medium">
              scene
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
                      <span className="border-glass-edge relative size-11 shrink-0 overflow-hidden rounded-lg border">
                        <ScenePreview
                          scene={s.id}
                          className={cn("size-full", locked && "opacity-45")}
                        />
                      </span>
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
                          {locked ? `level ${s.unlockLevel}` : getAmbience(s.ambience).label}
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

            <p className="text-muted-foreground px-2.5 pt-4 pb-1 text-xs font-medium">
              colours
            </p>
            <ul className="grid grid-cols-4 gap-1">
              <li>
                <Swatch
                  name="scene"
                  title="the scene's own colours"
                  active={!theme}
                  onClick={() => setPrefs({ theme: null })}
                >
                  <span className={cn(TILE, !theme && "ring-glow ring-2")}>
                    <ScenePreview scene={scene} className="size-full" />
                  </span>
                </Swatch>
              </li>
              {THEMES.map((t) => (
                <li key={t.id}>
                  <Swatch
                    name={t.name}
                    title={describeTheme(t)}
                    active={theme === t.id}
                    onClick={() => setPrefs({ theme: t.id })}
                  >
                    <span
                      data-home-swatch={t.id}
                      className={cn(TILE, "bg-glass-strong grid place-items-center", theme === t.id && "ring-glow ring-2")}
                    >
                      <span className="size-5 rounded-full bg-[linear-gradient(135deg,var(--glow)_50%,var(--glow-2)_50%)]" />
                    </span>
                  </Swatch>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground px-2.5 pt-2 pb-1 text-xs">
              {theme ? describeTheme(THEMES.find((t) => t.id === theme)!) : "following the scene"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SceneSwitcher;
