"use client";

import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { Droplet, Lock, Sprout, Trophy } from "lucide-react";
import CatchGame from "@/components/home/CatchGame";
import PlantSprite, { stageFor } from "@/components/home/PlantSprite";
import { Eyebrow, Panel, Segmented } from "@/components/home/ui";
import { formatMinutes, formatNumber } from "@/lib/home/format";
import {
  ACHIEVEMENTS,
  buyPlant,
  buyUpgrade,
  catchValue,
  currentStreak,
  levelProgress,
  maxAffordable,
  nextUnlock,
  plantCost,
  plantCount,
  plantMultiplier,
  PLANTS,
  rate,
  upgradeCost,
  upgradeLevel,
  UPGRADES,
  useGarden,
  type GardenState,
} from "@/lib/home/garden";
import { useHydrated } from "@/lib/home/store";
import { cn } from "@/lib/utils";

type Amount = "1" | "10" | "max";

const BuyButton = ({
  cost,
  affordable,
  label,
  onClick,
}: {
  cost: number;
  affordable: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={!affordable}
    aria-label={`${label} for ${Math.ceil(cost)} drops`}
    className={cn(
      "font-pixel focus-visible:ring-ring flex h-9 min-w-20 shrink-0 cursor-pointer items-center justify-center gap-1 rounded-full border px-3 text-sm transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
      affordable
        ? "border-glow-2/50 bg-glow-2/10 text-glow-2 hover:bg-glow-2/20"
        : "text-muted-foreground border-glass-edge opacity-60",
    )}
  >
    <Droplet className="size-3.5" />
    {formatNumber(cost)}
  </button>
);

const LockedTag = ({ level }: { level: number }) => (
  <span className="text-muted-foreground border-glass-edge flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs">
    <Lock className="size-3" />
    Lv {level}
  </span>
);

const PlantsTab = ({ garden, level }: { garden: GardenState; level: number }) => {
  const [amount, setAmount] = useState<Amount>("1");
  const mult = plantMultiplier(garden);

  return (
    <>
      <div className="mb-2 flex items-center justify-between gap-3">
        <Eyebrow>Buy</Eyebrow>
        <Segmented
          label="How many to buy"
          options={[
            { value: "1", label: "×1" },
            { value: "10", label: "×10" },
            { value: "max", label: "Max" },
          ]}
          value={amount}
          onChange={setAmount}
          className="w-40"
        />
      </div>
      <ul className="flex flex-col gap-1">
        {PLANTS.map((p) => {
          const have = garden.plants[p.id] ?? 0;
          const locked = level < p.unlockLevel;
          const count =
            amount === "max" ? Math.max(1, maxAffordable(p, have, garden.drops)) : Number(amount);
          const cost = plantCost(p, have, count);
          return (
            <li key={p.id} className={cn("flex items-center gap-3 rounded-2xl px-2 py-1.5", locked && "opacity-60")}>
              <PlantSprite id={p.id} size={34} locked={locked} />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">{locked ? "???" : p.name}</span>
                  {have > 0 && <span className="font-pixel text-muted-foreground text-xs">×{have}</span>}
                </p>
                <p className="text-muted-foreground truncate text-xs">
                  {locked ? `Unlocks at garden level ${p.unlockLevel}` : p.blurb}
                </p>
                {!locked && (
                  <p className="font-pixel text-glow-2/90 text-xs">+{formatNumber(p.rate * mult)}/s each</p>
                )}
              </div>
              {locked ? (
                <LockedTag level={p.unlockLevel} />
              ) : (
                <BuyButton
                  cost={cost}
                  affordable={cost <= garden.drops}
                  label={`Plant ${count} ${p.name}`}
                  onClick={() => buyPlant(p.id, count)}
                />
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
};

const UpgradesTab = ({ garden, level }: { garden: GardenState; level: number }) => (
  <ul className="flex flex-col gap-1">
    {UPGRADES.map((u) => {
      const lvl = upgradeLevel(garden, u.id);
      const locked = level < u.unlockLevel;
      const maxed = lvl >= u.max;
      const cost = upgradeCost(u, lvl);
      return (
        <li key={u.id} className={cn("flex items-center gap-3 rounded-2xl px-2 py-2", locked && "opacity-60")}>
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="text-sm font-medium">{u.name}</span>
              <span className="font-pixel text-muted-foreground text-xs">
                {lvl}/{u.max}
              </span>
            </p>
            <p className="text-muted-foreground text-xs">{u.blurb}</p>
            {!locked && (
              <p className="font-pixel text-glow/90 text-xs">
                {maxed ? u.effect(lvl) : lvl === 0 ? u.effect(1) : `${u.effect(lvl)} → ${u.effect(lvl + 1)}`}
              </p>
            )}
          </div>
          {locked ? (
            <LockedTag level={u.unlockLevel} />
          ) : maxed ? (
            <span className="text-glow font-pixel shrink-0 px-3 text-xs">Maxed</span>
          ) : (
            <BuyButton
              cost={cost}
              affordable={cost <= garden.drops}
              label={`Upgrade ${u.name}`}
              onClick={() => buyUpgrade(u.id)}
            />
          )}
        </li>
      );
    })}
  </ul>
);

const JournalTab = ({ garden }: { garden: GardenState }) => {
  const stats: [string, string][] = [
    ["Tasks done", `${garden.stats.tasks}`],
    ["Focused", formatMinutes(garden.stats.focusMinutes)],
    ["Sessions", `${garden.stats.sessions}`],
    ["Focus streak", `${currentStreak(garden)}d`],
    ["Drops caught", formatNumber(garden.stats.caught)],
    ["Golden drops", formatNumber(garden.stats.golden)],
    ["Plants", `${plantCount(garden)}`],
    ["All-time drops", formatNumber(garden.lifetime)],
  ];
  const achievements = ACHIEVEMENTS.filter((a) => a.available?.() ?? true);
  const earned = achievements.filter((a) => garden.achievements.includes(a.id)).length;

  return (
    <>
      <dl className="grid grid-cols-2 gap-2">
        {stats.map(([label, value]) => (
          <div key={label} className="border-glass-edge rounded-xl border bg-white/3 px-3 py-2">
            <dt className="text-muted-foreground text-[0.7rem]">{label}</dt>
            <dd className="font-pixel text-sm">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 mb-2 flex items-center justify-between">
        <Eyebrow>Achievements</Eyebrow>
        <span className="font-pixel text-muted-foreground text-xs">
          {earned}/{achievements.length}
        </span>
      </div>
      <ul className="flex flex-col gap-1">
        {achievements.map((a) => {
          const done = garden.achievements.includes(a.id);
          return (
            <li key={a.id} className="flex items-center gap-3 rounded-xl px-2 py-1.5">
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  done ? "bg-glow/15 text-glow" : "text-muted-foreground bg-white/5",
                )}
              >
                <Trophy className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm", done ? "font-medium" : "text-muted-foreground")}>{a.name}</p>
                <p className="text-muted-foreground text-xs">{a.detail}</p>
              </div>
              <span className={cn("font-pixel flex items-center gap-0.5 text-xs", done ? "text-muted-foreground line-through" : "text-glow-2")}>
                <Droplet className="size-3" />
                {formatNumber(a.reward)}
              </span>
            </li>
          );
        })}
      </ul>
    </>
  );
};

const TAB_TRIGGER =
  "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-glow focus-visible:ring-ring -mb-px cursor-pointer border-b-2 border-transparent px-1 pb-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none";

const Garden = ({ className }: { className?: string }) => {
  const garden = useGarden();
  const hydrated = useHydrated();
  const { level, into, span } = levelProgress(garden.xp);
  const next = nextUnlock(level);
  const perSecond = rate(garden);
  const sill = PLANTS.filter((p) => (garden.plants[p.id] ?? 0) > 0);

  return (
    <Panel
      id="garden"
      title="Rain Garden"
      icon={Sprout}
      className={className}
      actions={
        <span className="font-pixel border-glow/40 text-glow rounded-full border px-2.5 py-0.5 text-xs">
          Lv {level}
        </span>
      }
    >
      <div className={cn("transition-opacity duration-500", hydrated ? "opacity-100" : "opacity-0")}>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-pixel text-glow-2 flex items-center gap-2 text-3xl leading-none tabular-nums">
              <Droplet className="size-6" />
              {formatNumber(garden.drops)}
            </p>
            <p className="text-muted-foreground mt-1.5 text-xs">
              <span className="font-pixel text-foreground/80">+{formatNumber(perSecond)}</span>/s from plants ·{" "}
              <span className="font-pixel text-foreground/80">{formatNumber(catchValue(garden))}</span> per catch
            </p>
          </div>
        </div>

        <div className="mt-3">
          <div
            role="progressbar"
            aria-label="Experience to the next level"
            aria-valuemin={0}
            aria-valuemax={span}
            aria-valuenow={into}
            className="h-1.5 overflow-hidden rounded-full bg-white/8"
          >
            <div
              className="bg-glow h-full rounded-full shadow-[0_0_10px_var(--glow)] transition-[width] duration-700"
              style={{ width: `${(into / span) * 100}%` }}
            />
          </div>
          <p className="text-muted-foreground mt-1.5 flex justify-between gap-2 text-[0.7rem]">
            <span className="font-pixel">
              {Math.floor(into)}/{span} xp
            </span>
            {next && (
              <span className="truncate">
                Lv {next.level}: {next.items.join(", ")}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* The window. Drops run down it and the plants sit on its sill. */}
      <div className="border-glass-edge relative mt-4 h-52 shrink-0 overflow-hidden rounded-2xl border bg-[linear-gradient(to_bottom,rgb(255_255_255/0.04),rgb(0_0_0/0.18))] sm:h-56">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/6" />
        <div className="absolute inset-x-0 top-0 bottom-3.5">
          <CatchGame label="Rain on the garden window. Click or tap the drops to catch them, or press Space to catch the lowest one." />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-3.5 flex items-end justify-center gap-1 px-3">
          {sill.map((p) => {
            const have = garden.plants[p.id] ?? 0;
            return (
              <div key={p.id} className="relative flex flex-col items-center" title={`${p.name} ×${have}`}>
                <PlantSprite id={p.id} stage={stageFor(have)} size={40} />
                {have > 1 && (
                  <span className="font-pixel bg-glass-strong absolute -top-1 -right-1 rounded-full px-1 text-[0.6rem] leading-4">
                    {have}
                  </span>
                )}
              </div>
            );
          })}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-3.5 bg-[linear-gradient(to_bottom,#4a352c,#2a1d19)] shadow-[0_-1px_0_rgb(255_255_255/0.12)]" />
        {hydrated && garden.stats.caught === 0 && (
          <p className="text-muted-foreground pointer-events-none absolute inset-x-0 top-1/3 text-center text-xs">
            Tap the drops as they run down the glass.
          </p>
        )}
        {hydrated && sill.length === 0 && garden.stats.caught > 0 && (
          <p className="text-muted-foreground pointer-events-none absolute inset-x-0 bottom-7 text-center text-xs">
            The sill is bare. Plant some moss below.
          </p>
        )}
      </div>

      <Tabs.Root defaultValue="plants" className="mt-4 flex min-h-0 flex-1 flex-col">
        <Tabs.List aria-label="Garden" className="border-glass-edge flex gap-5 border-b">
          <Tabs.Trigger value="plants" className={TAB_TRIGGER}>
            Plants
          </Tabs.Trigger>
          <Tabs.Trigger value="upgrades" className={TAB_TRIGGER}>
            Upgrades
          </Tabs.Trigger>
          <Tabs.Trigger value="journal" className={TAB_TRIGGER}>
            Journal
          </Tabs.Trigger>
        </Tabs.List>
        <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pt-3 pr-2 max-lg:max-h-[28rem]">
          <Tabs.Content value="plants" className="focus-visible:outline-none">
            <PlantsTab garden={garden} level={level} />
          </Tabs.Content>
          <Tabs.Content value="upgrades" className="focus-visible:outline-none">
            <UpgradesTab garden={garden} level={level} />
          </Tabs.Content>
          <Tabs.Content value="journal" className="focus-visible:outline-none">
            <JournalTab garden={garden} />
          </Tabs.Content>
        </div>
      </Tabs.Root>

      <p className="text-muted-foreground border-glass-edge mt-3 border-t pt-3 text-[0.7rem] leading-relaxed">
        Catch rain and grow plants for drops. Finishing tasks and focus sessions earns XP, and levels open up new
        plants, upgrades and scenes.
      </p>
    </Panel>
  );
};

export default Garden;
