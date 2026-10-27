"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Ban, Check, Lock, Palette } from "lucide-react";
import { describeUnlock, isUnlocked } from "@/lib/home/cosmetics";
import { levelFromXp, totalXp, useGarden } from "@/lib/home/garden";
import { activeTheme, setPrefs, usePrefs } from "@/lib/home/prefs";
import {
  getAmbience,
  SCENES,
  type SceneId,
  type SceneMeta,
} from "@/lib/home/scenes";
import { PET_ROWS, PETS, petSheet } from "@/lib/home/pets";
import { describeTheme, sceneTheme, THEMES } from "@/lib/home/themes";
import { cn } from "@/lib/utils";
import { ScenePreview } from "./scenes/previews";
import { IconButton, textButton } from "./ui";

/** One colour theme in the picker: a tile of its glass and glows, named. */
const Swatch = ({
  name,
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  name: string;
  title: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    aria-pressed={active}
    aria-label={title}
    title={title}
    disabled={disabled}
    onClick={onClick}
    className={cn(
      "focus-visible:ring-ring flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl px-1 pt-2 pb-1.5 transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-55",
      active ? "bg-white/10" : "enabled:hover:bg-white/6",
    )}
  >
    {children}
    <span
      className={cn(
        "text-[0.7rem]",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {name}
    </span>
  </button>
);

const TILE =
  "border-glass-edge relative size-10 overflow-hidden rounded-lg border";

/** One scene in the picker: its thumbnail, name and sound, or its lock. */
const SceneRow = ({
  s,
  level,
  active,
  onPick,
}: {
  s: SceneMeta;
  level: number;
  active: boolean;
  onPick: () => void;
}) => {
  const locked = level < s.unlockLevel;
  return (
    <li>
      <button
        type="button"
        disabled={locked}
        aria-pressed={active}
        onClick={onPick}
        className={cn(
          "focus-visible:ring-ring flex w-full cursor-pointer items-center gap-2 rounded-xl p-1.5 text-left transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
          active ? "bg-white/10" : "hover:bg-white/6",
        )}
      >
        <span className="border-glass-edge relative size-10 shrink-0 overflow-hidden rounded-lg border">
          <ScenePreview
            scene={s.id}
            className={cn("size-full", locked && "opacity-45")}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block text-sm leading-tight font-medium",
              locked && "text-muted-foreground",
            )}
          >
            {s.name}
          </span>
          <span className="text-muted-foreground mt-0.5 block text-xs leading-tight">
            {locked ? `level ${s.unlockLevel}` : getAmbience(s.ambience).label}
          </span>
        </span>
        {locked ? (
          <Lock className="text-muted-foreground size-3.5 shrink-0" />
        ) : active ? (
          <Check className="text-glow size-3.5 shrink-0" />
        ) : null}
      </button>
    </li>
  );
};

/**
 * Scene and colour picker. Locked scenes show the garden level that opens
 * them. Colours stay open on a pick, so they can be tried one after another.
 */
const SceneSwitcher = () => {
  const prefs = usePrefs();
  const { scene, theme, pet } = prefs;
  // Like the sound: the scene's own colours unless others are picked.
  const wearing = activeTheme(prefs);
  const own = sceneTheme(scene);
  const garden = useGarden();
  const level = levelFromXp(totalXp(garden));
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const pick = (id: SceneId) => {
    setPrefs({ scene: id });
    setOpen(false);
  };

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
            // Scenes and colours side by side where there's room, each
            // scrolling on its own; stacked, scrolling together, on phones.
            className="bg-glass-strong border-glass-edge absolute top-12 right-0 z-50 flex max-h-[calc(100dvh-5rem)] w-[min(18rem,calc(100vw-2rem))] origin-top-right flex-col gap-2 overflow-y-auto rounded-2xl border p-2 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)] md:w-[min(48rem,calc(100vw-2rem))] md:flex-row md:overflow-hidden"
          >
            <div className="md:w-[28rem] md:shrink-0 md:overflow-y-auto">
              <p className="text-muted-foreground px-2.5 pt-1.5 pb-2 text-xs font-medium">
                classic scenes
              </p>
              <ul className="grid gap-1 md:grid-cols-2">
                {SCENES.filter((s) => !s.photo).map((s) => (
                  <SceneRow
                    key={s.id}
                    s={s}
                    level={level}
                    active={s.id === scene}
                    onPick={() => pick(s.id)}
                  />
                ))}
              </ul>
              <p className="text-muted-foreground px-2.5 pt-4 pb-2 text-xs font-medium">
                picture scenes
              </p>
              <ul className="grid gap-1 md:grid-cols-2">
                {SCENES.filter((s) => s.photo).map((s) => (
                  <SceneRow
                    key={s.id}
                    s={s}
                    level={level}
                    active={s.id === scene}
                    onPick={() => pick(s.id)}
                  />
                ))}
              </ul>
            </div>

            <div className="md:border-glass-edge md:min-w-0 md:flex-1 md:overflow-y-auto md:border-l md:pl-2">
              <div className="flex items-center justify-between gap-2 px-2.5 pt-4 pb-1 md:pt-1.5">
                <p className="text-muted-foreground text-xs font-medium">
                  colours
                </p>
                {theme && (
                  <button
                    type="button"
                    onClick={() => setPrefs({ theme: null })}
                    className={cn(textButton, "text-muted-foreground text-xs")}
                  >
                    match scene
                  </button>
                )}
              </div>
              <ul className="grid grid-cols-4 gap-1">
                {THEMES.map((t) => {
                  const locked = !isUnlocked(t.unlock, garden);
                  return (
                    <li key={t.id}>
                      <Swatch
                        name={t.name}
                        title={
                          locked && t.unlock
                            ? `${t.name}: ${describeUnlock(t.unlock)}`
                            : describeTheme(t)
                        }
                        active={wearing === t.id}
                        disabled={locked}
                        // Picking the scene's own goes back to following it.
                        onClick={() =>
                          setPrefs({ theme: t.id === own ? null : t.id })
                        }
                      >
                        <span
                          data-home-swatch={t.id}
                          className={cn(
                            TILE,
                            "bg-glass-strong grid place-items-center",
                            wearing === t.id && "ring-glow ring-2",
                          )}
                        >
                          {/* Locked ones still show their colours, as a preview. */}
                          <span className="size-5 rounded-full bg-[linear-gradient(135deg,var(--glow)_50%,var(--glow-2)_50%)]" />
                          {locked && (
                            <span className="absolute inset-0 grid place-items-center bg-black/45">
                              <Lock className="size-3.5 text-white/85" />
                            </span>
                          )}
                        </span>
                      </Swatch>
                    </li>
                  );
                })}
              </ul>
              <p className="text-muted-foreground px-2.5 pt-2 pb-1 text-xs">
                {theme
                  ? describeTheme(THEMES.find((t) => t.id === theme)!)
                  : `following the scene${own ? `: ${THEMES.find((t) => t.id === own)!.hint}` : ""}`}
              </p>

              <p className="text-muted-foreground px-2.5 pt-4 pb-1 text-xs font-medium">
                pets
              </p>
              <ul className="grid grid-cols-4 gap-1">
                <li>
                  <Swatch
                    name="none"
                    title="no pet"
                    active={!pet}
                    onClick={() => setPrefs({ pet: null })}
                  >
                    <span
                      className={cn(
                        TILE,
                        "grid place-items-center bg-white/4",
                        !pet && "ring-glow ring-2",
                      )}
                    >
                      <Ban className="text-muted-foreground size-4" />
                    </span>
                  </Swatch>
                </li>
                {PETS.map((p) => {
                  const locked = !isUnlocked(p.unlock, garden);
                  return (
                    <li key={p.id}>
                      <Swatch
                        name={p.name}
                        title={
                          locked
                            ? `${p.name}: ${describeUnlock(p.unlock)}`
                            : p.name
                        }
                        active={pet === p.id}
                        disabled={locked}
                        onClick={() => setPrefs({ pet: p.id })}
                      >
                        <span
                          className={cn(
                            TILE,
                            "bg-white/4",
                            pet === p.id && "ring-glow ring-2",
                          )}
                        >
                          {/* Its first idle frame, facing you, at the tile's size. */}
                          <span
                            className="absolute inset-0"
                            style={{
                              backgroundImage: `url(${petSheet(p.id)})`,
                              backgroundSize: `${12 * 40}px ${PET_ROWS * 40}px`,
                              backgroundPosition: "0 0",
                              imageRendering: "pixelated",
                            }}
                          />
                          {locked && (
                            <span className="absolute inset-0 grid place-items-center bg-black/45">
                              <Lock className="size-3.5 text-white/85" />
                            </span>
                          )}
                        </span>
                      </Swatch>
                    </li>
                  );
                })}
              </ul>
              {/* The sprites are CC BY 4.0, which asks for this credit. */}
              <p className="text-muted-foreground px-2.5 pt-2 pb-1 text-[0.65rem] normal-case">
                pets by{" "}
                <a
                  href="https://frakassets.itch.io/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-current/35 underline-offset-[3px] hover:decoration-current"
                >
                  Frakassets
                </a>{" "}
                (CC BY 4.0)
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SceneSwitcher;
