"use client";

import { useRef, useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import {
  Bean,
  Droplet,
  Flame,
  Lock,
  Sprout,
  Star,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import CatchGame from "@/components/home/CatchGame";
import GardenDecor from "@/components/home/GardenDecor";
import PlantSprite, { stageFor } from "@/components/home/PlantSprite";
import {
  Eyebrow,
  Panel,
  Segmented,
  type PanelChrome,
} from "@/components/home/ui";
import {
  DECOR,
  describeUnlock,
  isUnlocked,
  POTS,
  resolveDecor,
  resolvePot,
  type PotPick,
  type Unlock,
} from "@/lib/home/cosmetics";
import { formatClock, formatMinutes, formatNumber } from "@/lib/home/format";
import {
  ACHIEVEMENTS,
  buyPlant,
  buySkill,
  buyUpgrade,
  catchValue,
  currentStreak,
  endSeason,
  levelProgress,
  totalXp,
  luckLeft,
  maxAffordable,
  milestoneStep,
  nextUnlock,
  plantCost,
  plantCostScale,
  plantCount,
  plantMultiplier,
  PLANTS,
  rate,
  plantBoost,
  plantRate,
  PLANT_MILESTONE,
  SEASON_MINIMUM,
  seedsFor,
  skillStatus,
  upgradeCost,
  upgradeLevel,
  UPGRADES,
  useGarden,
  type GardenState,
} from "@/lib/home/garden";
import { setPrefs, usePrefs } from "@/lib/home/prefs";
import {
  BRANCHES,
  getSkill,
  SKILLS,
  type BranchId,
  type SkillId,
} from "@/lib/home/skills";
import { useHydrated, useNow } from "@/lib/home/store";
import { cn } from "@/lib/utils";

type Amount = "1" | "10" | "max";

/** The next copy count that makes a plant better. */
const nextMilestone = (have: number) =>
  (Math.floor(have / PLANT_MILESTONE) + 1) * PLANT_MILESTONE;

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

const PlantsTab = ({
  garden,
  level,
}: {
  garden: GardenState;
  level: number;
}) => {
  const [amount, setAmount] = useState<Amount>("1");
  const mult = plantMultiplier(garden);
  const scale = plantCostScale(garden);
  const step = milestoneStep(garden);

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
            amount === "max"
              ? Math.max(1, maxAffordable(p, have, garden.drops, scale))
              : Number(amount);
          const cost = plantCost(p, have, count, scale);
          return (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-2 py-1.5",
                locked && "opacity-60",
              )}
            >
              <PlantSprite id={p.id} size={34} locked={locked} />
              <div className="min-w-0 flex-1">
                <p className="flex items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {locked ? "???" : p.name}
                  </span>
                  {have > 0 && (
                    <span className="font-pixel text-muted-foreground text-xs">
                      ×{have}
                    </span>
                  )}
                </p>
                {locked ? (
                  <p className="text-muted-foreground text-xs">
                    unlocks at level {p.unlockLevel}
                  </p>
                ) : (
                  <p className="text-xs">
                    <span className="font-pixel text-glow-2/90">
                      +{formatNumber(plantRate(p, have, step) * mult)}/s each
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      | ×{plantBoost(nextMilestone(have), step)} at{" "}
                      {nextMilestone(have)}
                    </span>
                  </p>
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

const UpgradesTab = ({
  garden,
  level,
}: {
  garden: GardenState;
  level: number;
}) => (
  <ul className="flex flex-col gap-1">
    {UPGRADES.map((u) => {
      const lvl = upgradeLevel(garden, u.id);
      const locked = level < u.unlockLevel;
      const maxed = lvl >= u.max;
      const cost = upgradeCost(u, lvl);
      return (
        <li
          key={u.id}
          className={cn(
            "flex items-center gap-3 rounded-2xl px-2 py-2",
            locked && "opacity-60",
          )}
        >
          <div className="min-w-0 flex-1">
            <p className="flex items-baseline gap-2">
              <span className="text-sm font-medium">{u.name}</span>
              <span className="font-pixel text-muted-foreground text-xs">
                {Number.isFinite(u.max) ? `${lvl}/${u.max}` : lvl}
              </span>
            </p>
            {!locked && (
              <p className="font-pixel text-glow/90 text-xs">
                {maxed
                  ? u.effect(lvl)
                  : lvl === 0
                    ? u.effect(1)
                    : `${u.effect(lvl)} → ${u.effect(lvl + 1)}`}
              </p>
            )}
          </div>
          {locked ? (
            <LockedTag level={u.unlockLevel} />
          ) : maxed ? (
            <span className="text-glow font-pixel shrink-0 px-3 text-xs">
              Maxed
            </span>
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

// ---------------------------------------------------------------- season

const BRANCH_ICON: Record<BranchId, LucideIcon> = {
  roots: Sprout,
  rain: Droplet,
  hearth: Flame,
};

/** Node centres in a branch: columns at 22%, 50% and 78%, rows 54px apart. */
const ROW_H = 54;
const colX = (col: number) => 22 + col * 56;
const rowY = (row: number) => row * ROW_H + 20;

const SkillNode = ({
  id,
  garden,
  selected,
  onSelect,
}: {
  id: SkillId;
  garden: GardenState;
  selected: boolean;
  onSelect: () => void;
}) => {
  const def = getSkill(id);
  const status = skillStatus(garden, id);
  const Icon =
    status.state === "locked" && status.rank === 0
      ? Lock
      : def.at[1] === 3
        ? Star
        : BRANCH_ICON[def.branch];
  const affordable = status.state === "open" && status.cost <= garden.seeds;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${def.name}, rank ${status.rank} of ${def.costs.length}`}
      className="focus-visible:ring-ring absolute flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center gap-0.5 rounded-full focus-visible:ring-2 focus-visible:outline-none"
      style={{ left: `${colX(def.at[0])}%`, top: rowY(def.at[1]) }}
    >
      <span
        className={cn(
          "grid size-9 place-items-center rounded-full border transition",
          status.state === "maxed"
            ? "border-glow bg-glow text-primary-foreground"
            : status.rank > 0
              ? "border-glow/70 bg-glow/15 text-glow"
              : status.state === "locked"
                ? "border-glass-edge text-muted-foreground bg-black/20 opacity-60"
                : "border-glass-edge text-foreground bg-white/5",
          affordable && "shadow-[0_0_12px_-2px_var(--glow)]",
          selected && "ring-ring ring-offset-background ring-2 ring-offset-1",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="font-pixel text-muted-foreground text-[0.6rem] leading-none">
        {status.rank}/{def.costs.length}
      </span>
    </button>
  );
};

/** One branch: five nodes and the lines between them. */
const Branch = ({
  branch,
  garden,
  picked,
  onPick,
}: {
  branch: BranchId;
  garden: GardenState;
  picked: SkillId;
  onPick: (id: SkillId) => void;
}) => {
  const skills = SKILLS.filter((k) => k.branch === branch);
  const height = rowY(3) + 26;
  return (
    <div className="relative" style={{ height }}>
      <svg
        className="absolute inset-0 size-full"
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        {skills.flatMap((k) =>
          (Object.keys(k.needs) as SkillId[]).map((need) => {
            const from = getSkill(need);
            const lit = (garden.skills[k.id] ?? 0) > 0;
            return (
              <line
                key={`${need}-${k.id}`}
                x1={colX(from.at[0])}
                y1={rowY(from.at[1])}
                x2={colX(k.at[0])}
                y2={rowY(k.at[1])}
                stroke={lit ? "var(--glow)" : "currentColor"}
                strokeOpacity={lit ? 0.7 : 0.14}
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            );
          }),
        )}
      </svg>
      {skills.map((k) => (
        <SkillNode
          key={k.id}
          id={k.id}
          garden={garden}
          selected={picked === k.id}
          onSelect={() => onPick(k.id)}
        />
      ))}
    </div>
  );
};

const SeedCount = ({ n, className }: { n: number; className?: string }) => (
  <span
    className={cn(
      "font-pixel text-glow inline-flex items-center gap-1",
      className,
    )}
  >
    <Bean className="size-3.5" />
    {formatNumber(n)}
  </span>
);

const SeasonTab = ({ garden }: { garden: GardenState }) => {
  const [picked, setPicked] = useState<SkillId>("roots");
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const harvest = seedsFor(garden.seasonLifetime);
  const def = getSkill(picked);
  const status = skillStatus(garden, picked);

  const onEnd = () => {
    clearTimeout(confirmTimer.current);
    if (!confirming) {
      // Two presses: ending a season can't be undone.
      setConfirming(true);
      confirmTimer.current = setTimeout(() => setConfirming(false), 4000);
      return;
    }
    setConfirming(false);
    endSeason();
  };

  return (
    <>
      <div className="border-glass-edge rounded-2xl border bg-white/3 p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium">season {garden.seasons + 1}</p>
            <p className="text-muted-foreground text-xs">
              <span className="font-pixel text-foreground/80">
                {formatNumber(garden.seasonLifetime)}
              </span>{" "}
              drops earned this season
            </p>
          </div>
          <SeedCount n={garden.seeds} className="text-sm" />
        </div>
        <p className="text-muted-foreground mt-2 text-xs">
          {harvest ? (
            <>
              ending it now harvests <SeedCount n={harvest} />. drops, plants,
              and upgrades start over; level, achievements, skills, and
              cosmetics stay.
            </>
          ) : (
            `earn ${formatNumber(SEASON_MINIMUM)} drops in a season to harvest seeds from it.`
          )}
        </p>
        <button
          type="button"
          onClick={onEnd}
          disabled={!harvest}
          className={cn(
            "focus-visible:ring-ring mt-3 h-9 w-full cursor-pointer rounded-full border text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45",
            confirming
              ? "border-glow bg-glow text-primary-foreground"
              : "border-glow/50 bg-glow/10 text-glow enabled:hover:bg-glow/20",
          )}
        >
          {confirming
            ? `sure? end season ${garden.seasons + 1}`
            : "end the season"}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-1">
        {BRANCHES.map((b) => (
          <div key={b.id}>
            <Eyebrow className="text-center">{b.name}</Eyebrow>
            <Branch
              branch={b.id}
              garden={garden}
              picked={picked}
              onPick={setPicked}
            />
          </div>
        ))}
      </div>

      <div
        className="border-glass-edge mt-2 rounded-2xl border bg-white/3 p-3"
        aria-live="polite"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-medium">{def.name}</p>
          <span className="font-pixel text-muted-foreground text-xs">
            {status.rank}/{def.costs.length}
          </span>
        </div>
        <p className="font-pixel text-glow/90 mt-1 text-xs">
          {status.state === "maxed"
            ? def.effect(status.rank)
            : status.rank === 0
              ? def.effect(1)
              : `${def.effect(status.rank)} → ${def.effect(status.rank + 1)}`}
        </p>
        {status.state === "locked" && (
          <p className="text-muted-foreground mt-1 text-xs">
            needs{" "}
            {status.missing
              .map((m) => `${getSkill(m).name} ${def.needs[m] ?? 1}`)
              .join(" and ")}
          </p>
        )}
        {status.state !== "maxed" && (
          <button
            type="button"
            onClick={() => buySkill(picked)}
            disabled={status.state !== "open" || status.cost > garden.seeds}
            className="font-pixel focus-visible:ring-ring border-glow/50 bg-glow/10 text-glow enabled:hover:bg-glow/20 mt-2.5 flex h-9 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border text-sm transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-45"
            aria-label={`Learn ${def.name} for ${status.cost} seeds`}
          >
            learn <Bean className="size-3.5" />
            {status.cost}
          </button>
        )}
      </div>
    </>
  );
};

// ------------------------------------------------------------------ shed

const LockedOverlay = () => (
  <span className="absolute inset-0 grid place-items-center rounded-[inherit] bg-black/45">
    <Lock className="size-3.5 text-white/85" />
  </span>
);

const ShedTab = ({ garden }: { garden: GardenState }) => {
  const prefs = usePrefs();
  const achievementName = (id: string) =>
    ACHIEVEMENTS.find((a) => a.id === id)?.name.toLowerCase();
  const how = (u: Unlock | undefined) =>
    u ? describeUnlock(u, achievementName) : "";
  const auto = resolveDecor("auto", prefs.scene, garden);
  const sceneDecor = resolveDecor("scene", prefs.scene, garden);
  const scenePot = resolvePot("scene", prefs.scene, garden);
  const decorName = (id: string | null) => DECOR.find((d) => d.id === id)?.name ?? "none";

  return (
    <>
      <Eyebrow>pots</Eyebrow>
      <ul className="mt-2 grid grid-cols-4 gap-1">
        {[
          // Follows the scene: its own pot, once that's unlocked.
          { id: "scene" as PotPick, name: "match scene", unlock: undefined, shows: scenePot },
          ...POTS.map((p) => ({ ...p, id: p.id as PotPick, shows: p.id })),
        ].map((pot) => {
          const locked = !isUnlocked(pot.unlock, garden);
          const active = prefs.pot === pot.id;
          return (
            <li key={pot.id}>
              <button
                type="button"
                disabled={locked}
                aria-pressed={active}
                title={locked ? `${pot.name}: ${how(pot.unlock)}` : pot.name}
                aria-label={
                  locked ? `${pot.name}: ${how(pot.unlock)}` : pot.name
                }
                onClick={() => setPrefs({ pot: pot.id })}
                className={cn(
                  "focus-visible:ring-ring relative flex w-full cursor-pointer flex-col items-center gap-1 rounded-xl px-1 pt-1.5 pb-1 transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed",
                  active ? "bg-white/10" : "enabled:hover:bg-white/6",
                )}
              >
                <span className="relative">
                  <PlantSprite id="fern" pot={pot.shows} size={30} />
                  {locked && <LockedOverlay />}
                </span>
                <span
                  className={cn(
                    "text-[0.65rem]",
                    active ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {pot.name}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <Eyebrow className="mt-4">window</Eyebrow>
      <ul className="mt-2 grid grid-cols-3 gap-1.5">
        {[
          {
            id: "auto" as const,
            name: `auto: ${decorName(auto)}`,
            unlock: undefined,
          },
          {
            id: "scene" as const,
            name: `match scene: ${decorName(sceneDecor)}`,
            unlock: undefined,
          },
          { id: "none" as const, name: "bare window", unlock: undefined },
          ...DECOR,
        ].map((d) => {
          const locked = !isUnlocked(d.unlock, garden);
          const active = prefs.decor === d.id;
          return (
            <li key={d.id}>
              <button
                type="button"
                disabled={locked}
                aria-pressed={active}
                title={locked ? `${d.name}: ${how(d.unlock)}` : d.name}
                onClick={() => setPrefs({ decor: d.id })}
                className={cn(
                  "focus-visible:ring-ring flex h-full w-full cursor-pointer items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-[0.7rem] leading-tight transition focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                  active
                    ? "border-glow/60 bg-glow/12 text-foreground"
                    : "border-glass-edge text-muted-foreground enabled:hover:text-foreground bg-white/3 enabled:hover:bg-white/8",
                )}
              >
                {locked && <Lock className="size-3 shrink-0" />}
                {d.name}
              </button>
            </li>
          );
        })}
      </ul>
    </>
  );
};

const JournalTab = ({ garden }: { garden: GardenState }) => {
  const stats: [string, string][] = [
    ["Tasks done", `${garden.stats.tasks}`],
    ["Focused", formatMinutes(garden.stats.focusMinutes)],
    ["Sessions", `${garden.stats.sessions}`],
    ["Focus streak", `${currentStreak(garden)}d`],
    ["Drops caught", formatNumber(garden.stats.caught)],
    ["Golden drops", formatNumber(garden.stats.golden)],
    ["Diamond drops", formatNumber(garden.stats.diamonds)],
    ["Ladybugs", formatNumber(garden.stats.ladybugs)],
    ["Plants", `${plantCount(garden)}`],
    ["All-time drops", formatNumber(garden.lifetime)],
    ["Seasons ended", `${garden.seasons}`],
    [
      "Skills learnt",
      `${Object.values(garden.skills).reduce((a, b) => a + (b ?? 0), 0)}`,
    ],
  ];
  const achievements = ACHIEVEMENTS.filter((a) => a.available?.() ?? true);
  const earned = achievements.filter((a) =>
    garden.achievements.includes(a.id),
  ).length;

  return (
    <>
      <dl className="grid grid-cols-2 gap-2">
        {stats.map(([label, value]) => (
          <div
            key={label}
            className="border-glass-edge rounded-xl border bg-white/3 px-3 py-2"
          >
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
            <li
              key={a.id}
              className="flex items-center gap-3 rounded-xl px-2 py-1.5"
            >
              <span
                className={cn(
                  "grid size-8 shrink-0 place-items-center rounded-full",
                  done
                    ? "bg-glow/15 text-glow"
                    : "text-muted-foreground bg-white/5",
                )}
              >
                <Trophy className="size-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-sm",
                    done ? "font-medium" : "text-muted-foreground",
                  )}
                >
                  {a.name}
                </p>
                <p className="text-muted-foreground text-xs">{a.detail}</p>
              </div>
              <span
                className={cn(
                  "font-pixel flex items-center gap-0.5 text-xs",
                  done ? "text-muted-foreground line-through" : "text-glow-2",
                )}
              >
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
  "text-muted-foreground data-[state=active]:text-foreground data-[state=active]:border-glow focus-visible:ring-ring shrink-0 cursor-pointer border-b-2 border-transparent px-1 pb-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:outline-none";

const Garden = ({
  className,
  chrome,
}: {
  className?: string;
  chrome?: PanelChrome;
}) => {
  const garden = useGarden();
  const prefs = usePrefs();
  const hydrated = useHydrated();
  const decor = hydrated ? resolveDecor(prefs.decor, prefs.scene, garden) : null;
  const pot = resolvePot(prefs.pot, prefs.scene, garden);
  const lucky = luckLeft(garden) > 0;
  const now = useNow(1000, lucky);
  const luck = lucky && now ? luckLeft(garden, now) : 0;
  const { level, into, span } = levelProgress(totalXp(garden));
  const next = nextUnlock(level);
  const perSecond = rate(garden);
  const sill = PLANTS.filter((p) => (garden.plants[p.id] ?? 0) > 0);

  return (
    <Panel
      id="garden"
      title="rain garden"
      icon={Sprout}
      className={className}
      chrome={chrome}
      actions={
        <span className="font-pixel border-glow/40 text-glow rounded-full border px-2.5 py-0.5 text-xs">
          Lv {level}
        </span>
      }
    >
      <div
        className={cn(
          "transition-opacity duration-500",
          hydrated ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="font-pixel text-glow-2 flex items-center gap-2 text-3xl leading-none tabular-nums">
              <Droplet className="size-6" />
              {formatNumber(garden.drops)}
            </p>
            <p className="text-muted-foreground mt-1.5 text-xs">
              <span className="font-pixel text-foreground/80">
                +{formatNumber(perSecond)}
              </span>
              /s from plants |{" "}
              <span className="font-pixel text-foreground/80">
                {formatNumber(catchValue(garden))}
              </span>{" "}
              per catch
            </p>
            {luck > 0 && (
              <p className="mt-1 flex items-center gap-1.5 text-xs text-[#ffb3ad]">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-[#e5483f] shadow-[0_0_6px_#e5483f]"
                />
                ladybug luck: plants ×2 for{" "}
                <span className="font-pixel tabular-nums">
                  {formatClock(luck)}
                </span>
              </p>
            )}
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
      <div className="border-glass-edge relative mt-4 h-[min(14rem,22dvh)] min-h-28 shrink-0 overflow-hidden rounded-2xl border bg-[linear-gradient(to_bottom,rgb(255_255_255/0.04),rgb(0_0_0/0.18))]">
        <div className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/6" />
        {decor && <GardenDecor decor={decor} />}
        <div className="absolute inset-x-0 top-0 bottom-3.5">
          <CatchGame label="Rain on the garden window. Click or tap the drops to catch them, or press Space to catch the lowest one." />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-3.5 flex items-end justify-center gap-1 px-3">
          {sill.map((p) => {
            const have = garden.plants[p.id] ?? 0;
            return (
              <div
                key={p.id}
                className="relative flex flex-col items-center"
                title={`${p.name} ×${have}`}
              >
                <PlantSprite
                  id={p.id}
                  stage={stageFor(have)}
                  size={40}
                  pot={pot}
                />
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
            tap the drops
          </p>
        )}
      </div>

      <Tabs.Root
        defaultValue="plants"
        className="mt-4 flex min-h-0 flex-1 flex-col"
      >
        <Tabs.List
          aria-label="Garden"
          // Scrolls sideways if the tabs outgrow a narrow card, and never
          // vertically. The divider is an inset shadow rather than a border,
          // so the active tab's underline can sit on it without overflowing.
          className="flex gap-3.5 overflow-x-auto overflow-y-hidden shadow-[inset_0_-1px_0_var(--glass-edge)] [scrollbar-width:none]"
        >
          <Tabs.Trigger value="plants" className={TAB_TRIGGER}>
            Plants
          </Tabs.Trigger>
          <Tabs.Trigger value="upgrades" className={TAB_TRIGGER}>
            Upgrades
          </Tabs.Trigger>
          <Tabs.Trigger value="season" className={TAB_TRIGGER}>
            Season
          </Tabs.Trigger>
          <Tabs.Trigger value="shed" className={TAB_TRIGGER}>
            Shed
          </Tabs.Trigger>
          <Tabs.Trigger value="journal" className={TAB_TRIGGER}>
            Journal
          </Tabs.Trigger>
        </Tabs.List>
        <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pt-3 pr-2">
          <Tabs.Content value="plants" className="focus-visible:outline-none">
            <PlantsTab garden={garden} level={level} />
          </Tabs.Content>
          <Tabs.Content value="upgrades" className="focus-visible:outline-none">
            <UpgradesTab garden={garden} level={level} />
          </Tabs.Content>
          <Tabs.Content value="season" className="focus-visible:outline-none">
            <SeasonTab garden={garden} />
          </Tabs.Content>
          <Tabs.Content value="shed" className="focus-visible:outline-none">
            <ShedTab garden={garden} />
          </Tabs.Content>
          <Tabs.Content value="journal" className="focus-visible:outline-none">
            <JournalTab garden={garden} />
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </Panel>
  );
};

export default Garden;
