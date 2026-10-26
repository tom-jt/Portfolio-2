"use client";

import { liveGames } from "@/data/home/games";
import { dayKey, formatNumber, previousDayKey } from "./format";
import { SCENES } from "./scenes";
import { getSkill, RETIRED_SKILLS, SKILLS, type SkillId } from "./skills";
import { useSyncExternalStore } from "react";
import { createPersistentStore, useStore } from "./store";
import { pushToast } from "./toasts";

/**
 * Rain Garden: the idle game that ties /home together.
 *
 * Drops are the currency and XP drives level. The split is deliberate: drops
 * come from everything (catching rain, plants, tasks, focus), but XP comes
 * almost entirely from tasks and focus sessions. So clicking passes the time,
 * while levels, and the scenes and plants they unlock, stand for actual work
 * done.
 */

// ---------------------------------------------------------------- plants

export type PlantId =
  | "moss"
  | "fern"
  | "mint"
  | "monstera"
  | "bonsai"
  | "moonflower"
  | "lotus"
  | "willow"
  | "cloudbloom"
  | "rainlily"
  | "cedar"
  | "stormorchid"
  | "worldtree";

export interface PlantDef {
  id: PlantId;
  name: string;
  baseCost: number;
  /** Drops per second, per plant owned. */
  rate: number;
  unlockLevel: number;
}

export const PLANTS: PlantDef[] = [
  {
    id: "moss",
    name: "Moss",
    baseCost: 15,
    rate: 0.2,
    unlockLevel: 1,
  },
  {
    id: "fern",
    name: "Fern",
    baseCost: 120,
    rate: 1.5,
    unlockLevel: 1,
  },
  {
    id: "mint",
    name: "Mint",
    baseCost: 900,
    rate: 9,
    unlockLevel: 2,
  },
  {
    id: "monstera",
    name: "Monstera",
    baseCost: 6500,
    rate: 55,
    unlockLevel: 3,
  },
  {
    id: "bonsai",
    name: "Bonsai",
    baseCost: 48_000,
    rate: 340,
    unlockLevel: 5,
  },
  {
    id: "moonflower",
    name: "Moonflower",
    baseCost: 400_000,
    rate: 2200,
    unlockLevel: 8,
  },
  // The late three are spaced further apart, so each is a real goal.
  {
    id: "lotus",
    name: "Lotus",
    baseCost: 3_500_000,
    rate: 14_000,
    unlockLevel: 12,
  },
  {
    id: "willow",
    name: "Weeping willow",
    baseCost: 32_000_000,
    rate: 90_000,
    unlockLevel: 17,
  },
  {
    id: "cloudbloom",
    name: "Cloudbloom",
    baseCost: 300_000_000,
    rate: 580_000,
    unlockLevel: 23,
  },
  // Long goals, spaced out along the slow climb to level 100.
  {
    id: "rainlily",
    name: "Rain lily",
    baseCost: 2_800_000_000,
    rate: 3_600_000,
    unlockLevel: 30,
  },
  {
    id: "cedar",
    name: "Cedar",
    baseCost: 26_000_000_000,
    rate: 22_000_000,
    unlockLevel: 38,
  },
  {
    id: "stormorchid",
    name: "Storm orchid",
    baseCost: 240_000_000_000,
    rate: 135_000_000,
    unlockLevel: 47,
  },
  {
    id: "worldtree",
    name: "World tree",
    baseCost: 2_200_000_000_000,
    rate: 820_000_000,
    unlockLevel: 57,
  },
];

/** Each copy of a plant costs this much more than the last. */
const PLANT_GROWTH = 1.15;

/** Copies per milestone: each one makes every copy of that plant better. */
export const PLANT_MILESTONE = 10;

/**
 * How much better every copy is for owning `have`: ×3 at 10, ×5 at 20, ×7 at
 * 30, and so on, so the old plants stay worth topping up. Old growth makes
 * each step ×3 instead (`step`).
 */
export const plantBoost = (have: number, step = 2) =>
  1 + step * Math.floor(have / PLANT_MILESTONE);

/** Drops per second from each copy, before the greenhouse and skills. */
export const plantRate = (def: PlantDef, have: number, step = 2) =>
  def.rate * plantBoost(have, step);

// -------------------------------------------------------------- upgrades

export type UpgradeId =
  | "jar"
  | "soil"
  | "rainmaker"
  | "goldleaf"
  | "deepfocus"
  | "nightshift"
  | "greenhouse"
  | "trellis"
  | "seedbank";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  baseCost: number;
  growth: number;
  max: number;
  unlockLevel: number;
  /** What the upgrade does at a given level, for the shop row. */
  effect: (level: number) => string;
}

/** Share of a catch a drop pays when it lands uncaught. Rich soil raises it
 *  to half at most, so letting the rain fall never rivals catching it. */
const soakShareAt = (level: number) => 0.1 + 0.05 * level;

// Per-level steps. The caps were doubled and each step made a little smaller,
// so the top level is stronger than before but takes twice the climbing.
// Night shift stops where time away reaches full speed: it never pays more
// than time here.
export const offlineRate = (level: number) => Math.min(1, 0.4 + 0.07 * level);
export const offlineHours = (level: number) => 8 + 3 * level;
const RAIN_STEP = 0.92;
const DEEP_FOCUS_STEP = 0.16;

/**
 * Wider jar: the first four levels cost what they always did, then each one
 * is only 1.4× the last, so the jar keeps pace instead of walling off.
 */
const JAR_EARLY_LEVELS = 4;
const JAR_LATE_GROWTH = 1.4;

/** Seconds of the garden's output a catch is worth. A seventh to start, and
 *  every jar level adds a little, so catching keeps up as plants take over
 *  without the plants' output being mostly something to click for. */
const catchSecondsAt = (jar: number) => 0.15 + 0.01 * jar;

/** Trellis: what each level adds to every plant milestone's step. */
const TRELLIS_STEP = 0.25;
/** Seed bank: all drops, per seed ever harvested, per level. */
const SEED_BANK_STEP = 0.001;

export const UPGRADES: UpgradeDef[] = [
  {
    id: "jar",
    name: "Wider jar",
    baseCost: 40,
    growth: 2.6,
    max: Infinity,
    unlockLevel: 1,
    effect: (l) =>
      `+${2 * l} per catch, ${catchSecondsAt(l).toFixed(2)}s of plants`,
  },
  {
    id: "soil",
    name: "Rich soil",
    baseCost: 120,
    growth: 2.8,
    max: 8,
    unlockLevel: 1,
    effect: (l) => `missed drops give ${Math.round(soakShareAt(l) * 100)}%`,
  },
  {
    id: "rainmaker",
    name: "Rain dance",
    baseCost: 80,
    growth: 2.6,
    max: 12,
    unlockLevel: 1,
    effect: (l) => `${Math.round((1 / RAIN_STEP ** l - 1) * 100)}% more rain`,
  },
  {
    id: "goldleaf",
    name: "Gold leaf",
    baseCost: 250,
    growth: 2.9,
    max: 12,
    unlockLevel: 2,
    effect: (l) => `${(goldenChanceAt(l) * 100).toFixed(1)}% golden`,
  },
  {
    id: "deepfocus",
    name: "Deep focus",
    baseCost: 300,
    growth: 2.6,
    max: Infinity,
    unlockLevel: 2,
    effect: (l) => `+${DEEP_FOCUS_STEP * 100 * l}% focus drops`,
  },
  {
    id: "nightshift",
    name: "Night shift",
    baseCost: 1000,
    growth: 3.2,
    max: 9,
    unlockLevel: 3,
    effect: (l) =>
      `${Math.round(offlineRate(l) * 100)}% offline speed, up to ${offlineHours(l)}h`,
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    baseCost: 2000,
    growth: 4,
    max: Infinity,
    unlockLevel: 4,
    effect: (l) => `+${25 * l}% plant output`,
  },
  {
    id: "trellis",
    name: "Trellis",
    baseCost: 5000,
    growth: 3,
    max: Infinity,
    unlockLevel: 6,
    effect: (l) => `every plant milestone adds +${TRELLIS_STEP * l}× more`,
  },
  {
    id: "seedbank",
    name: "Seed bank",
    baseCost: 50_000,
    growth: 3.5,
    max: Infinity,
    unlockLevel: 15,
    effect: (l) =>
      `+${(SEED_BANK_STEP * 100 * l).toFixed(1)}% to all drops per seed ever harvested`,
  },
];

// ----------------------------------------------------------------- state

export interface GardenState {
  drops: number;
  lifetime: number;
  xp: number;
  plants: Partial<Record<PlantId, number>>;
  upgrades: Partial<Record<UpgradeId, number>>;
  /** When passive income was last paid out; 0 before the first visit. */
  lastTick: number;
  stats: {
    tasks: number;
    focusMinutes: number;
    sessions: number;
    caught: number;
    golden: number;
    diamonds: number;
    ladybugs: number;
  };
  achievements: string[];
  gamesPlayed: string[];
  /** Daily allowances, reset when the local date changes. */
  daily: { day: string; tasks: number; games: string[] };
  /** Consecutive days with at least one finished focus session. */
  streak: { count: number; lastDay: string };
  /** Drops earned this season, which is what a harvest pays seeds for. */
  seasonLifetime: number;
  /** Seasons ended so far. */
  seasons: number;
  /** Unspent seeds, the currency of the skill tree. */
  seeds: number;
  skills: Partial<Record<SkillId, number>>;
  /** Holidays this garden has been open for, which unlock their decor. */
  seenHolidays: string[];
  /** When the last ladybug was caught, and when its luck runs out. */
  ladybugAt: number;
  luckUntil: number;
  /** While a caught rainbow drop's streak lasts (Rainbow shower). */
  rainbowUntil: number;
  /**
   * XP earned on other linked devices, by device. `xp` is only what this
   * device earned; the level counts both. Each device's figure only grows,
   * so merging keeps the larger, and nothing is counted twice.
   */
  xpElsewhere: Record<string, number>;
}

const initial: GardenState = {
  drops: 0,
  lifetime: 0,
  xp: 0,
  plants: {},
  upgrades: {},
  lastTick: 0,
  stats: {
    tasks: 0,
    focusMinutes: 0,
    sessions: 0,
    caught: 0,
    golden: 0,
    diamonds: 0,
    ladybugs: 0,
  },
  achievements: [],
  gamesPlayed: [],
  daily: { day: "", tasks: 0, games: [] },
  streak: { count: 0, lastDay: "" },
  seasonLifetime: 0,
  seasons: 0,
  seeds: 0,
  skills: {},
  seenHolidays: [],
  ladybugAt: 0,
  luckUntil: 0,
  rainbowUntil: 0,
  xpElsewhere: {},
};

const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;

/**
 * Saves from before the tree changed: skills that have left it give their
 * seeds back, and Monsoon, which used to be the rain branch's capstone where
 * Sweeping hands now sits, keeps its place there by bringing it along.
 */
function migrateTree(r: Partial<GardenState>) {
  const skills: Record<string, number> = { ...r.skills };
  let seeds = num(r.seeds);
  for (const [id, costs] of Object.entries(RETIRED_SKILLS)) {
    const rank = num(skills[id]);
    seeds += costs.slice(0, rank).reduce((a, b) => a + b, 0);
    delete skills[id];
  }
  if (skills.monsoon && !skills.swipe) skills.swipe = 1;
  return { skills: skills as GardenState["skills"], seeds };
}

export const gardenStore = createPersistentStore<GardenState>(
  "home:garden:v1",
  initial,
  (raw, init) => {
    const r = (raw ?? {}) as Partial<GardenState>;
    return {
      ...init,
      ...r,
      drops: num(r.drops),
      lifetime: num(r.lifetime),
      xp: num(r.xp),
      lastTick: num(r.lastTick),
      plants: { ...r.plants },
      stats: { ...init.stats, ...r.stats },
      achievements: Array.isArray(r.achievements) ? r.achievements : [],
      gamesPlayed: Array.isArray(r.gamesPlayed) ? r.gamesPlayed : [],
      daily: { ...init.daily, ...r.daily },
      streak: { ...init.streak, ...r.streak },
      // Saves from before seasons are one long first season.
      seasonLifetime: num(r.seasonLifetime, num(r.lifetime)),
      seasons: num(r.seasons),
      ...migrateTree(r),
      upgrades: Object.fromEntries(
        Object.entries(r.upgrades ?? {}).map(([id, l]) => [
          id,
          Math.min(num(l), UPGRADES.find((u) => u.id === id)?.max ?? Infinity),
        ]),
      ),
      seenHolidays: Array.isArray(r.seenHolidays) ? r.seenHolidays : [],
      ladybugAt: num(r.ladybugAt),
      luckUntil: num(r.luckUntil),
      rainbowUntil: num(r.rainbowUntil),
      xpElsewhere: Object.fromEntries(
        Object.entries(r.xpElsewhere ?? {}).filter(([, v]) => num(v) > 0),
      ),
    };
  },
);

/** The whole garden. It changes every second the garden earns, so this
 *  re-renders as often: for what only needs one value, see useGardenValue. */
export const useGarden = () => useStore(gardenStore);

/**
 * One value worked out from the garden, re-rendering only when that value
 * changes rather than on every tick. `pick` should return a string, number,
 * or boolean, so an unchanged answer compares equal.
 */
export const useGardenValue = <T extends string | number | boolean | null>(
  pick: (s: GardenState) => T,
) =>
  useSyncExternalStore(
    gardenStore.subscribe,
    () => pick(gardenStore.get()),
    () => pick(gardenStore.initial),
  );

// -------------------------------------------------------------- formulas

const owned = (s: GardenState, id: PlantId) => s.plants[id] ?? 0;
export const upgradeLevel = (s: GardenState, id: UpgradeId) =>
  s.upgrades[id] ?? 0;
export const skillRank = (s: GardenState, id: SkillId) => s.skills[id] ?? 0;

/** Plant prices after Compost. */
export const plantCostScale = (s: GardenState) =>
  1 - 0.04 * skillRank(s, "compost");

/** The step each plant milestone adds: ×2, or ×3 with Old growth, and a
 *  quarter more for each level of Trellis. */
export const milestoneStep = (s: GardenState) =>
  (skillRank(s, "oldgrowth") ? 3 : 2) +
  TRELLIS_STEP * upgradeLevel(s, "trellis");

export function plantCost(def: PlantDef, have: number, count = 1, scale = 1) {
  const first = def.baseCost * scale * PLANT_GROWTH ** have;
  return Math.ceil((first * (PLANT_GROWTH ** count - 1)) / (PLANT_GROWTH - 1));
}

/** How many of a plant the current drops can buy, for the "Max" option. */
export function maxAffordable(
  def: PlantDef,
  have: number,
  drops: number,
  scale = 1,
) {
  const first = def.baseCost * scale * PLANT_GROWTH ** have;
  const n = Math.floor(
    Math.log((drops * (PLANT_GROWTH - 1)) / first + 1) / Math.log(PLANT_GROWTH),
  );
  // Float error can overshoot by one at exact boundaries.
  return n > 0 && plantCost(def, have, n, scale) > drops
    ? n - 1
    : Math.max(0, n);
}

export const upgradeCost = (def: UpgradeDef, level: number) =>
  def.id === "jar" && level > JAR_EARLY_LEVELS
    ? Math.ceil(
        def.baseCost *
          def.growth ** JAR_EARLY_LEVELS *
          JAR_LATE_GROWTH ** (level - JAR_EARLY_LEVELS),
      )
    : Math.ceil(def.baseCost * def.growth ** level);

/** Evergreen: +1% to all drops per garden level, up to +100%. */
const evergreen = (s: GardenState) =>
  skillRank(s, "evergreen")
    ? 1 + Math.min(100, levelFromXp(totalXp(s))) / 100
    : 1;

/** Every seed ever harvested: those in hand and those spent on skills. */
export const seedsHarvested = (s: GardenState) =>
  s.seeds +
  SKILLS.reduce(
    (sum, k) =>
      sum + k.costs.slice(0, skillRank(s, k.id)).reduce((a, b) => a + b, 0),
    0,
  );

/** Seed bank: all drops, more for every seed ever harvested. */
const seedBank = (s: GardenState) =>
  1 + SEED_BANK_STEP * upgradeLevel(s, "seedbank") * seedsHarvested(s);

// ---------------------------------------------------------------- ladybug

/** Ladybug luck: everything the plants make is doubled for five minutes,
 *  and two and a half more for each rank of Long days. */
export const luckMs = (s: GardenState) =>
  (5 + 2.5 * skillRank(s, "longdays")) * 60_000;
/** No ladybug turns up within ten minutes of the last one caught. */
export const LADYBUG_COOLDOWN_MS = 10 * 60_000;

export const luckLeft = (s: GardenState, now = Date.now()) =>
  Math.max(0, s.luckUntil - now);
const luck = (s: GardenState) => (luckLeft(s) > 0 ? 2 : 1);

export const ladybugMayAppear = (s: GardenState, now = Date.now()) =>
  now - s.ladybugAt >= LADYBUG_COOLDOWN_MS;

export function catchLadybug() {
  const now = Date.now();
  const s = gardenStore.get();
  if (!ladybugMayAppear(s, now)) return;
  const minutes = luckMs(s) / 60_000;
  commit(
    (g) => ({
      ...g,
      ladybugAt: now,
      luckUntil: now + luckMs(g),
      stats: { ...g.stats, ladybugs: g.stats.ladybugs + 1 },
    }),
    {
      kind: "info",
      title: "ladybug luck",
      detail: `the garden grows twice as fast for ${minutes} minutes`,
    },
  );
}

/** Plant milestones reached across the whole garden, for Second bloom. */
const milestones = (s: GardenState) =>
  PLANTS.reduce(
    (sum, p) => sum + Math.floor(owned(s, p.id) / PLANT_MILESTONE),
    0,
  );

/** Everything that multiplies each plant's output: greenhouse, skills, luck. */
export const plantMultiplier = (s: GardenState) =>
  (1 + 0.25 * upgradeLevel(s, "greenhouse")) *
  (1 + 0.1 * skillRank(s, "roots")) *
  (1 + 0.15 * skillRank(s, "morningsun")) *
  (skillRank(s, "secondbloom") ? 1 + 0.01 * milestones(s) : 1) *
  (skillRank(s, "solstice") ? 1.5 : 1) *
  evergreen(s) *
  seedBank(s) *
  luck(s);

/** Drops per second from plants. */
export function rate(s: GardenState) {
  const step = milestoneStep(s);
  const base = PLANTS.reduce(
    (sum, p) => sum + plantRate(p, owned(s, p.id), step) * owned(s, p.id),
    0,
  );
  return base * plantMultiplier(s);
}

export const plantCount = (s: GardenState) =>
  PLANTS.reduce((sum, p) => sum + owned(s, p.id), 0);

/** A catch is also worth a moment of the garden's output, so catching rain
 *  stays worth doing as the garden grows. */
export const catchValue = (s: GardenState) => {
  const jar = upgradeLevel(s, "jar");
  const hands =
    (1 + 0.15 * skillRank(s, "hands")) * (1 + 0.1 * skillRank(s, "wetseason"));
  const rainbow = Date.now() < s.rainbowUntil ? 3 : 1;
  // Rate already carries Evergreen and the seed bank; the flat part gets
  // them here.
  return (
    ((1 + 2 * jar) * evergreen(s) * seedBank(s) +
      rate(s) * catchSecondsAt(jar)) *
    hands *
    rainbow
  );
};

/** Missed drops' share of a catch: never more than three quarters, so
 *  catching always stays worth it. */
export const soakShare = (s: GardenState) =>
  Math.min(
    0.75,
    soakShareAt(upgradeLevel(s, "soil")) +
      (skillRank(s, "puddles") ? 0.1 : 0) +
      0.05 * skillRank(s, "deeppuddles"),
  );

const goldenChanceAt = (level: number) => 0.03 + 0.012 * level;
export const goldenChance = (s: GardenState) =>
  goldenChanceAt(upgradeLevel(s, "goldleaf")) + 0.01 * skillRank(s, "lucky");
/** What diamonds and meteors are counted in: a golden drop's old worth. */
const goldBase = (s: GardenState) =>
  (catchValue(s) * 20 + 25) * (1 + 0.25 * skillRank(s, "lucky"));
/** A golden drop: a third of that, since golden hour brings them in runs. */
export const goldenValue = (s: GardenState) => goldBase(s) / 3;

/** Whether a caught golden drop brings a shower (Monsoon). */
export const hasMonsoon = (s: GardenState) => skillRank(s, "monsoon") > 0;
/** Whether dragging across the window catches drops (Sweeping hands). */
export const hasSwipe = (s: GardenState) => skillRank(s, "swipe") > 0;

/**
 * Diamond drops: about one in 1,250, so at a drop a second one turns up every
 * twenty minutes or so of the card being open. Worth fifteen golden drops, and
 * a shower of golden ones follows.
 */
export const DIAMOND_CHANCE = 0.0008;
export const diamondValue = (s: GardenState) => goldBase(s) * 5;
/** Golden drops in the shower that follows a diamond. */
export const DIAMOND_SHOWER = 6;

export type DropKind = "plain" | "golden" | "diamond" | "rainbow" | "meteor";

/** Milliseconds between drops appearing on the window. */
export const spawnInterval = (s: GardenState) =>
  1100 *
  RAIN_STEP ** upgradeLevel(s, "rainmaker") *
  0.93 ** skillRank(s, "downpour") *
  0.91 ** skillRank(s, "stormfront");

/** Drops the window holds at once: twelve, and two more a Cloudburst rank. */
export const maxDrops = (s: GardenState) => 12 + 2 * skillRank(s, "cloudburst");

/** Rainy side, for the catch game: which of its tricks are learnt. */
export const hasThunderclap = (s: GardenState) =>
  skillRank(s, "thunderclap") > 0;
export const hasTorrent = (s: GardenState) => skillRank(s, "torrent") > 0;
export const hasRainbow = (s: GardenState) => skillRank(s, "rainbow") > 0;
export const hasMeteors = (s: GardenState) => skillRank(s, "meteors") > 0;
export const hasGoldenHour = (s: GardenState) => skillRank(s, "goldenhour") > 0;

/** One drop in 150 is a rainbow drop, once Rainbow shower is learnt. */
export const RAINBOW_CHANCE = 1 / 150;
/** A caught rainbow drop makes every catch worth ×3 for this long. */
export const RAINBOW_MS = 20_000;
/** A meteor is worth nine golden drops. */
export const meteorValue = (s: GardenState) => goldBase(s) * 3;

/** Chance each minute of a meteor shower: three times as likely at night. */
export function meteorChance(now = new Date()) {
  const hour = now.getHours();
  return hour >= 20 || hour < 6 ? 0.12 : 0.04;
}

/** Chance each minute of golden hour: doubled by Solstice. */
export const goldenHourChance = (s: GardenState) =>
  skillRank(s, "solstice") ? 0.2 : 0.1;

/** Good habits: work pays more drops. */
const habits = (s: GardenState) =>
  (1 + 0.2 * skillRank(s, "habits")) * evergreen(s) * seedBank(s);
/** Make hay: tasks and focus pay more drops still. */
const hay = (s: GardenState) => 1 + 0.25 * skillRank(s, "haymaking");
/** Bookworm: work pays more XP. */
const bookworm = (s: GardenState) => 1 + 0.15 * skillRank(s, "bookworm");

/** Time away: Night shift, plus Night owl's extra speed and hours. */
export const awayRate = (s: GardenState) =>
  Math.min(
    1,
    offlineRate(upgradeLevel(s, "nightshift")) +
      0.05 * skillRank(s, "nightowl") +
      0.1 * skillRank(s, "warmsoil"),
  );
export const awayHours = (s: GardenState) =>
  offlineHours(upgradeLevel(s, "nightshift")) +
  4 * skillRank(s, "nightowl") +
  6 * skillRank(s, "warmsoil");

export const TASK_DAILY_CAP = 12;

export const taskReward = (s: GardenState) => ({
  drops: Math.round((20 + rate(s) * 60) * habits(s) * hay(s)),
  xp: Math.round(12 * bookworm(s)),
});

export const focusReward = (s: GardenState, minutes: number) => ({
  drops: Math.round(
    (5 + rate(s) * 12) *
      minutes *
      (1 + DEEP_FOCUS_STEP * upgradeLevel(s, "deepfocus")) *
      habits(s) *
      hay(s),
  ),
  xp: Math.round((3 * minutes + 10) * bookworm(s)),
});

export const eyeReward = (s: GardenState) => ({
  drops: Math.round((10 + rate(s) * 20) * habits(s)),
  xp: 3,
});

export const gameReward = (s: GardenState) => ({
  drops: Math.round((40 + rate(s) * 90) * habits(s)),
  xp: 10,
});

// ---------------------------------------------------------------- levels

/** Where the curve flattens, and the steady cost of each level after it. */
const STEEP_UNTIL = 30;

/**
 * Total XP needed to reach a level: 75, 200, 375, 600, 875… rising steeply
 * to level 30 (about 22,500 XP, a couple of months of daily use). After that
 * each level costs a near-flat 1,500 XP, rising by 20 a level, so level 100
 * (about 177,000 XP) takes roughly a year of daily tasks and focus.
 */
export const xpForLevel = (level: number) => {
  const steep = (l: number) => 50 * (l - 1) + 25 * (l - 1) ** 2;
  if (level <= STEEP_UNTIL) return steep(level);
  const n = level - STEEP_UNTIL;
  return steep(STEEP_UNTIL) + 1500 * n + 10 * n * (n + 1);
};

/** A title for every ten levels, shown under the greeting. */
const TITLES = [
  "seedling",
  "drizzle",
  "shower",
  "downpour",
  "squall",
  "deluge",
  "tempest",
  "monsoon",
  "cloudburst",
  "stormkeeper",
  "rainmaker",
];
export const titleFor = (level: number) =>
  TITLES[Math.min(10, Math.floor(level / 10))];

export const MAX_LEVEL = 999;

/** XP from this device and every linked one: what the level counts. */
export const totalXp = (s: GardenState) =>
  s.xp + Object.values(s.xpElsewhere).reduce((sum, v) => sum + v, 0);

/**
 * Development builds play at the top level, so every scene, plant and
 * upgrade can be tried without grinding. Only the reading changes: the save
 * keeps its real XP, and production never sees this.
 */
const DEV_LEVEL = process.env.NODE_ENV === "development" ? MAX_LEVEL : null;

/** Development builds also open every cosmetic, holiday decor included. */
export const DEV_UNLOCKS = process.env.NODE_ENV === "development";

export function levelFromXp(xp: number) {
  if (DEV_LEVEL) return DEV_LEVEL;
  let level = 1;
  while (level < MAX_LEVEL && xpForLevel(level + 1) <= xp) level++;
  return level;
}

/** The focus streak, or 0 if it lapsed (no session today or yesterday). */
export function currentStreak(s: GardenState) {
  const alive =
    s.streak.lastDay === dayKey() || s.streak.lastDay === previousDayKey();
  return alive ? s.streak.count : 0;
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor;
  // At the top there is nothing left to fill (and the dev level sits above
  // the real XP), so the bar shows full.
  if (level === MAX_LEVEL) return { level, into: span, span };
  return { level, into: xp - floor, span };
}

/** Everything a level opens up, for level-up toasts and the "next" teaser. */
export function unlocksAt(level: number) {
  return [
    ...SCENES.filter((s) => s.unlockLevel === level).map(
      (s) => `${s.name} scene`,
    ),
    ...PLANTS.filter((p) => p.unlockLevel === level).map((p) => p.name),
    ...UPGRADES.filter((u) => u.unlockLevel === level).map((u) => u.name),
    ...(level % 10 === 0 && level <= 100
      ? [`the title "${titleFor(level)}"`]
      : []),
  ];
}

export function nextUnlock(level: number) {
  for (let l = level + 1; l <= level + 20; l++) {
    const items = unlocksAt(l);
    if (items.length) return { level: l, items };
  }
  return null;
}

const levelBonus = (level: number) => 50 * level;

// ---------------------------------------------------------- achievements

export interface AchievementDef {
  id: string;
  name: string;
  detail: string;
  reward: number;
  test: (s: GardenState) => boolean;
  /** False hides it, e.g. the arcade one before any game is live. */
  available?: () => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: "first-catch",
    name: "First drop",
    detail: "Catch a raindrop.",
    reward: 10,
    test: (s) => s.stats.caught >= 1,
  },
  {
    id: "first-task",
    name: "Ticked off",
    detail: "Finish a task.",
    reward: 25,
    test: (s) => s.stats.tasks >= 1,
  },
  {
    id: "first-focus",
    name: "In the zone",
    detail: "Finish a focus session.",
    reward: 60,
    test: (s) => s.stats.sessions >= 1,
  },
  {
    id: "plants-10",
    name: "Green thumb",
    detail: "Grow 10 plants.",
    reward: 200,
    test: (s) => plantCount(s) >= 10,
  },
  {
    id: "catch-250",
    name: "Puddle jumper",
    detail: "Catch 250 raindrops.",
    reward: 300,
    test: (s) => s.stats.caught >= 250,
  },
  {
    id: "golden-10",
    name: "Gilded",
    detail: "Catch 10 golden drops.",
    reward: 400,
    test: (s) => s.stats.golden >= 10,
  },
  {
    id: "tasks-25",
    name: "List maker",
    detail: "Finish 25 tasks.",
    reward: 500,
    test: (s) => s.stats.tasks >= 25,
  },
  {
    id: "streak-3",
    name: "Three-day drizzle",
    detail: "Focus three days in a row.",
    reward: 750,
    test: (s) => s.streak.count >= 3,
  },
  {
    id: "level-5",
    name: "Seasoned",
    detail: "Reach level 5.",
    reward: 1000,
    test: (s) => levelFromXp(totalXp(s)) >= 5,
  },
  {
    id: "focus-300",
    name: "Five-hour rain",
    detail: "Focus for 5 hours in total.",
    reward: 1500,
    test: (s) => s.stats.focusMinutes >= 300,
  },
  {
    id: "arcade-all",
    name: "Arcade regular",
    detail: "Play every game in the arcade.",
    reward: 500,
    available: () => liveGames.length > 0,
    test: (s) =>
      liveGames.length > 0 &&
      liveGames.every((g) => s.gamesPlayed.includes(g.id)),
  },
  {
    id: "plants-50",
    name: "Overgrown",
    detail: "Grow 50 plants.",
    reward: 2500,
    test: (s) => plantCount(s) >= 50,
  },
  {
    id: "streak-7",
    name: "A week of rain",
    detail: "Focus seven days in a row.",
    reward: 5000,
    test: (s) => s.streak.count >= 7,
  },
  {
    id: "golden-100",
    name: "Gold rush",
    detail: "Catch 100 golden drops.",
    reward: 8000,
    test: (s) => s.stats.golden >= 100,
  },
  {
    id: "focus-1000",
    name: "Monsoon season",
    detail: "Focus for 1,000 minutes in total.",
    reward: 10_000,
    test: (s) => s.stats.focusMinutes >= 1000,
  },
  {
    id: "diamond-1",
    name: "Rough diamond",
    detail: "Catch a diamond drop.",
    reward: 2500,
    test: (s) => s.stats.diamonds >= 1,
  },
  {
    id: "ladybug-10",
    name: "Lucky charm",
    detail: "Catch ten ladybugs.",
    reward: 3000,
    test: (s) => s.stats.ladybugs >= 10,
  },
  {
    id: "season-1",
    name: "First harvest",
    detail: "End a season.",
    reward: 0,
    test: (s) => s.seasons >= 1,
  },
  {
    id: "season-5",
    name: "Old hand",
    detail: "End five seasons.",
    reward: 0,
    test: (s) => s.seasons >= 5,
  },
];

// --------------------------------------------------------------- actions

/** Resets the daily allowances once the date has turned over. */
function withToday(s: GardenState): GardenState {
  const today = dayKey();
  return s.daily.day === today
    ? s
    : { ...s, daily: { day: today, tasks: 0, games: [] } };
}

const addDrops = (s: GardenState, drops: number): GardenState => ({
  ...s,
  drops: s.drops + drops,
  lifetime: s.lifetime + drops,
  seasonLifetime: s.seasonLifetime + drops,
});

/**
 * Every state change that can earn achievements or levels goes through here,
 * so those checks and their toasts live in one place.
 */
function commit(
  update: (s: GardenState) => GardenState,
  toast?: Parameters<typeof pushToast>[0],
) {
  const prev = gardenStore.get();
  let next = update(withToday(prev));

  const earned = ACHIEVEMENTS.filter(
    (a) =>
      !next.achievements.includes(a.id) &&
      (a.available?.() ?? true) &&
      a.test(next),
  );
  if (earned.length) {
    next = addDrops(
      {
        ...next,
        achievements: [...next.achievements, ...earned.map((a) => a.id)],
      },
      earned.reduce((sum, a) => sum + a.reward, 0),
    );
  }

  const before = levelFromXp(totalXp(prev));
  const after = levelFromXp(totalXp(next));
  let bonus = 0;
  for (let l = before + 1; l <= after; l++) bonus += levelBonus(l);
  if (bonus) next = addDrops(next, bonus);

  gardenStore.set(next);

  if (toast) pushToast(toast);
  for (const a of earned) {
    pushToast({
      kind: "achievement",
      title: a.name,
      detail: a.detail,
      drops: a.reward,
    });
  }
  if (after > before) {
    const items: string[] = [];
    for (let l = before + 1; l <= after; l++) items.push(...unlocksAt(l));
    pushToast({
      kind: "level",
      title: `level ${after}`,
      detail: items.length ? `unlocked: ${items.join(", ")}` : undefined,
      drops: bonus,
    });
  }
}

/** Seconds at full rate before a gap counts as time away. */
const ONLINE_GRACE_S = 90;

/**
 * Pays out passive income since the last tick. Gaps longer than a minute and
 * a half (a closed tab, a sleeping laptop) are paid at the reduced, capped
 * away rate. Returns what was earned while away so the caller can say so.
 */
export function tick(now = Date.now()) {
  // Re-read first: with the page open in two tabs, the other may have just
  // spent or earned drops, and paying out from a stale copy would undo it.
  const s = gardenStore.reload();
  if (!s.lastTick || now < s.lastTick) {
    gardenStore.set({ ...s, lastTick: now });
    return { away: 0, gain: 0 };
  }
  const elapsed = (now - s.lastTick) / 1000;
  if (elapsed < 0.5) return { away: 0, gain: 0 };

  const r = rate(s);
  const online = Math.min(elapsed, ONLINE_GRACE_S);
  const away = Math.min(elapsed - online, awayHours(s) * 3600);
  const awayGain = r * away * awayRate(s);
  const gain = r * online + awayGain;

  gardenStore.set({ ...addDrops(s, gain), lastTick: now });
  return { away: elapsed - online, gain: awayGain };
}

export function catchDrop(kind: DropKind) {
  const s = gardenStore.get();
  const value =
    kind === "diamond"
      ? diamondValue(s)
      : kind === "meteor"
        ? meteorValue(s)
        : kind === "golden"
          ? goldenValue(s)
          : catchValue(s);
  const rainbowUntil =
    kind === "rainbow" ? Date.now() + RAINBOW_MS : s.rainbowUntil;
  commit((g) => ({
    ...addDrops(g, value),
    rainbowUntil,
    xp: g.xp + (kind === "diamond" ? 10 : kind === "golden" ? 2 : 0),
    stats: {
      ...g.stats,
      caught: g.stats.caught + 1,
      golden: g.stats.golden + (kind === "golden" ? 1 : 0),
      diamonds: g.stats.diamonds + (kind === "diamond" ? 1 : 0),
    },
  }));
  return value;
}

/**
 * A drop landing in the soil uncaught: a share of an ordinary catch, golden
 * or not, and no XP or catch count, which are for catching.
 */
export function soakDrop() {
  const s = gardenStore.get();
  const value = catchValue(s) * soakShare(s);
  commit((g) => addDrops(g, value));
  return value;
}

/** Returns false once the day's task rewards are used up. */
export function rewardTask() {
  const s = withToday(gardenStore.get());
  if (s.daily.tasks >= TASK_DAILY_CAP) {
    pushToast({
      kind: "info",
      title: "task done",
      detail: `daily task rewards used up (${TASK_DAILY_CAP})`,
    });
    return false;
  }
  const { drops, xp } = taskReward(s);
  commit(
    (g) => ({
      ...addDrops(g, drops),
      xp: g.xp + xp,
      stats: { ...g.stats, tasks: g.stats.tasks + 1 },
      daily: { ...g.daily, tasks: g.daily.tasks + 1 },
    }),
    { kind: "reward", title: "task done", drops, xp },
  );
  return true;
}

export function rewardFocus(minutes: number) {
  const s = gardenStore.get();
  const { drops, xp } = focusReward(s, minutes);
  const today = dayKey();
  commit(
    (g) => {
      const streak =
        g.streak.lastDay === today
          ? g.streak
          : {
              count:
                g.streak.lastDay === previousDayKey() ? g.streak.count + 1 : 1,
              lastDay: today,
            };
      return {
        ...addDrops(g, drops),
        xp: g.xp + xp,
        streak,
        stats: {
          ...g.stats,
          sessions: g.stats.sessions + 1,
          focusMinutes: g.stats.focusMinutes + minutes,
        },
      };
    },
    {
      kind: "reward",
      title: "focus session complete",
      drops,
      xp,
    },
  );
}

/** A rest taken when the eye reminder asked for one. */
export function rewardEyeBreak() {
  const { drops, xp } = eyeReward(gardenStore.get());
  commit((g) => ({ ...addDrops(g, drops), xp: g.xp + xp }), {
    kind: "reward",
    title: "eyes rested",
    drops,
    xp,
  });
}

/** The first play of each game each day pays out. */
export function rewardGamePlay(id: string, title: string) {
  const s = withToday(gardenStore.get());
  if (s.daily.games.includes(id)) return;
  const { drops, xp } = gameReward(s);
  commit(
    (g) => ({
      ...addDrops(g, drops),
      xp: g.xp + xp,
      gamesPlayed: g.gamesPlayed.includes(id)
        ? g.gamesPlayed
        : [...g.gamesPlayed, id],
      daily: { ...g.daily, games: [...g.daily.games, id] },
    }),
    { kind: "reward", title: `first play today: ${title}`, drops, xp },
  );
}

export function buyPlant(id: PlantId, count: number) {
  const def = PLANTS.find((p) => p.id === id);
  const s = gardenStore.get();
  if (!def || count < 1 || levelFromXp(totalXp(s)) < def.unlockLevel) return;
  const cost = plantCost(def, owned(s, id), count, plantCostScale(s));
  if (cost > s.drops) return;
  commit((g) => ({
    ...g,
    drops: g.drops - cost,
    plants: { ...g.plants, [id]: owned(g, id) + count },
  }));
}

export function buyUpgrade(id: UpgradeId) {
  const def = UPGRADES.find((u) => u.id === id);
  const s = gardenStore.get();
  if (!def || levelFromXp(totalXp(s)) < def.unlockLevel) return;
  const level = upgradeLevel(s, id);
  if (level >= def.max) return;
  const cost = upgradeCost(def, level);
  if (cost > s.drops) return;
  commit((g) => ({
    ...g,
    drops: g.drops - cost,
    upgrades: { ...g.upgrades, [id]: level + 1 },
  }));
}

// ---------------------------------------------------------------- seasons

/** Drops a season must earn before it can be harvested. */
export const SEASON_MINIMUM = 1_000_000;

/** How much more each season's harvest is worth than the first's. */
const seasonFactor = (s: GardenState) => 1 + 0.25 * s.seasons;

/**
 * Seeds a harvest pays: 2 × the fourth root of the season's drops in
 * millions, × 1.25 for every season already ended.
 *
 * The fourth root is what stops one long season paying out the tree: ten
 * times the drops is under twice the seeds. Later seasons pay far more,
 * because each runs on everything learnt before it, so its drops and its
 * factor both grow; and tiny seasons can't be farmed, since a million drops
 * is worth a few seeds at most. Fifteen seasons or so fill the tree.
 */
export function seedsFor(s: GardenState) {
  if (s.seasonLifetime < SEASON_MINIMUM) return 0;
  const base = 2 * (s.seasonLifetime / 1_000_000) ** 0.25 * seasonFactor(s);
  return Math.floor(base);
}

/** Drops this season needs to pay `seeds`. */
export function dropsForSeeds(seeds: number, s: GardenState) {
  const base = Math.max(1, seeds) / (2 * seasonFactor(s));
  return Math.max(SEASON_MINIMUM, 1_000_000 * base ** 4);
}

/** The season tab opens once a first harvest is possible, and stays. */
export const seasonsOpen = (s: GardenState) =>
  s.seasons > 0 ||
  s.seeds > 0 ||
  Object.keys(s.skills).length > 0 ||
  seedsFor(s) > 0;

/**
 * Ends the season: drops, plants and upgrades go, seeds come in. Level, XP,
 * achievements, stats, streaks, skills and cosmetics carry over, and a few
 * skills soften the reset.
 */
export function endSeason() {
  const s = gardenStore.get();
  const seeds = seedsFor(s);
  if (!seeds) return;
  const plants: GardenState["plants"] = {};
  if (skillRank(s, "perennials")) {
    for (const p of PLANTS) {
      const kept = Math.floor(owned(s, p.id) / 10);
      if (kept) plants[p.id] = kept;
    }
  }
  if (skillRank(s, "headstart")) {
    plants.moss = Math.max(plants.moss ?? 0, 10);
    plants.fern = Math.max(plants.fern ?? 0, 5);
  }
  const upgrades: GardenState["upgrades"] = {};
  if (skillRank(s, "toolshed")) {
    for (const u of UPGRADES) {
      const kept = Math.floor(upgradeLevel(s, u.id) / 3);
      if (kept) upgrades[u.id] = kept;
    }
  }
  commit(
    (g) => ({
      ...g,
      drops: 0,
      seasonLifetime: 0,
      plants,
      upgrades,
      seeds: g.seeds + seeds,
      seasons: g.seasons + 1,
    }),
    {
      kind: "level",
      title: `season ${s.seasons + 2} begins`,
      detail: `harvested ${seeds} seeds`,
    },
  );
}

export type SkillStatus =
  | { state: "maxed"; rank: number }
  | { state: "locked"; rank: number; cost: number; missing: SkillId[] }
  | { state: "open"; rank: number; cost: number };

/** Where a skill stands: maxed, waiting on others, or buyable at a cost. */
export function skillStatus(s: GardenState, id: SkillId): SkillStatus {
  const def = getSkill(id);
  const rank = skillRank(s, id);
  if (rank >= def.costs.length) return { state: "maxed", rank };
  const missing = (Object.keys(def.needs) as SkillId[]).filter(
    (need) => skillRank(s, need) < (def.needs[need] ?? 1),
  );
  if (missing.length)
    return { state: "locked", rank, cost: def.costs[rank], missing };
  return { state: "open", rank, cost: def.costs[rank] };
}

export function buySkill(id: SkillId) {
  const s = gardenStore.get();
  const status = skillStatus(s, id);
  if (status.state !== "open" || status.cost > s.seeds) return;
  commit((g) => ({
    ...g,
    seeds: g.seeds - status.cost,
    skills: { ...g.skills, [id]: skillRank(g, id) + 1 },
  }));
}

/**
 * Takes in other devices' XP from sync, keeping the larger figure for each.
 * Goes through commit, so a level reached on the phone levels up here too,
 * with its toast, bonus and achievements. Returns whether anything changed.
 */
export function mergeXpElsewhere(remote: Record<string, number>, me: string) {
  const s = gardenStore.get();
  const merged = { ...s.xpElsewhere };
  let changed = false;
  for (const [device, xp] of Object.entries(remote)) {
    if (device === me || !(num(xp) > (merged[device] ?? 0))) continue;
    merged[device] = xp;
    changed = true;
  }
  if (changed) commit((g) => ({ ...g, xpElsewhere: merged }));
  return changed;
}

/** Notes that the garden was open during a holiday, unlocking its decor. */
export function noteHoliday(id: string) {
  const s = gardenStore.get();
  if (s.seenHolidays.includes(id)) return;
  gardenStore.set({ ...s, seenHolidays: [...s.seenHolidays, id] });
}

/** Toast copy for income earned while the tab was closed. */
export function awayToast(gain: number, awaySeconds: number) {
  const hours = awaySeconds / 3600;
  const span =
    hours >= 1
      ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`
      : `${Math.round(awaySeconds / 60)}m`;
  pushToast({
    kind: "info",
    title: "while you were away",
    detail: `+${formatNumber(gain)} drops over ${span}`,
  });
}
