"use client";

import { liveGames } from "@/data/home/games";
import { dayKey, formatNumber, previousDayKey } from "./format";
import { rewardsAt } from "./rewards";
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
  /** Each copy costs this much more than the last. */
  growth: number;
  /** Drops per second, per plant owned, before its milestones. */
  rate: number;
  unlockLevel: number;
  /** Its milestones' leaps: at 25, 50 and 100 copies, then at every hundred
   *  after, the three in turn. */
  leaps: [number, number, number, [number, number, number]];
}

/**
 * The first ten are AdVenture Capitalist's ten businesses, cost for cost:
 * the same first price, the same growth in price, and the same income, as
 * a rate (what a business pays per run, over how long a run takes).
 *
 * The cheap ones grow dearer fastest, bar the first, and the dear ones
 * slowest, so the newest plant is a good buy for a long while but never
 * the only one. Payback (price over income) is a few seconds for moss and
 * days for the last few.
 */
export const PLANTS: PlantDef[] = [
  // Lemonade stand: 1 every 0.6 s.
  {
    id: "moss",
    name: "Moss",
    baseCost: 3.738,
    growth: 1.07,
    rate: 1 / 0.6,
    unlockLevel: 1,
    leaps: [2, 2, 2, [8, 15, 4]],
  },
  // Newspaper delivery: 60 every 3 s.
  {
    id: "fern",
    name: "Fern",
    baseCost: 60,
    growth: 1.15,
    rate: 20,
    unlockLevel: 1,
    leaps: [4, 2, 10, [150, 20, 100]],
  },
  // Car wash: 540 every 6 s.
  {
    id: "mint",
    name: "Mint",
    baseCost: 720,
    growth: 1.14,
    rate: 90,
    unlockLevel: 2,
    leaps: [2, 3, 10, [15, 100, 80]],
  },
  // Pizza delivery: 4,320 every 12 s.
  {
    id: "monstera",
    name: "Monstera",
    baseCost: 8640,
    growth: 1.13,
    rate: 360,
    unlockLevel: 3,
    leaps: [3, 3, 4, [100, 40, 15]],
  },
  // Donut shop: 51,840 every 24 s.
  {
    id: "bonsai",
    name: "Bonsai",
    baseCost: 103_680,
    growth: 1.12,
    rate: 2160,
    unlockLevel: 5,
    leaps: [2, 2, 8, [30, 15, 80]],
  },
  // Shrimp boat: 622,080 every 96 s.
  {
    id: "moonflower",
    name: "Moonflower",
    baseCost: 1_244_160,
    growth: 1.11,
    rate: 6480,
    unlockLevel: 8,
    leaps: [2, 3, 4, [15, 60, 15]],
  },
  // Hockey team: 7,464,960 every 384 s.
  {
    id: "lotus",
    name: "Lotus",
    baseCost: 14_929_920,
    growth: 1.1,
    rate: 19_440,
    unlockLevel: 12,
    leaps: [3, 2, 4, [40, 10, 15]],
  },
  // Movie studio: 89,579,520 every 1,536 s.
  {
    id: "willow",
    name: "Weeping willow",
    baseCost: 179_159_040,
    growth: 1.09,
    rate: 58_320,
    unlockLevel: 17,
    leaps: [2, 2, 5, [6, 15, 30]],
  },
  // Bank: 1,074,954,240 every 6,144 s.
  {
    id: "cloudbloom",
    name: "Cloudbloom",
    baseCost: 2_149_908_480,
    growth: 1.08,
    rate: 174_960,
    unlockLevel: 23,
    leaps: [2, 2, 2, [15, 15, 5]],
  },
  // Oil company: 29,668,737,024 every 36,864 s.
  {
    id: "rainlily",
    name: "Rain lily",
    baseCost: 25_798_901_760,
    growth: 1.07,
    rate: 804_816,
    unlockLevel: 30,
    leaps: [2, 2, 3, [10, 4, 10]],
  },
  // Past the oil company, the same steps on: each costs twelve times the
  // last and makes three times as much, growing dearer as slowly as it does.
  {
    id: "cedar",
    name: "Cedar",
    baseCost: 309_586_821_120,
    growth: 1.07,
    rate: 2_414_448,
    unlockLevel: 38,
    leaps: [2, 2, 3, [4, 15, 8]],
  },
  {
    id: "stormorchid",
    name: "Storm orchid",
    baseCost: 3_715_041_853_440,
    growth: 1.07,
    rate: 7_243_344,
    unlockLevel: 47,
    leaps: [2, 2, 2, [15, 6, 5]],
  },
  {
    id: "worldtree",
    name: "World tree",
    baseCost: 44_580_502_241_280,
    growth: 1.07,
    rate: 21_730_032,
    unlockLevel: 57,
    leaps: [2, 2, 4, [6, 6, 15]],
  },
];

/**
 * Milestones: at 25, 50 and 100 copies, as in AdVenture Capitalist, then at
 * every hundred. Each multiplies every copy of the plant by its leap.
 *
 * The leaps are each plant's own (The Math of Idle Games, part I: vary the
 * multipliers from generator to generator and the best buy keeps moving
 * around). Each repays about three tenths of what the copies since the
 * last milestone cost more than the ones before, swinging a little either
 * way, so a plant steadily falls behind its price, at the same pace for
 * all: a plant whose price climbs fast leaps far (fern ×150), a slow one
 * only a little (moss ×8), and none outruns the rest for good.
 */
export const nextMilestone = (have: number) =>
  have < 25 ? 25 : have < 50 ? 50 : (Math.floor(have / 100) + 1) * 100;

/** Milestones a plant has reached with `have` copies. */
export function milestonesAt(have: number) {
  return have < 25 ? 0 : have < 50 ? 1 : have < 100 ? 2 : 2 + Math.floor(have / 100);
}

/** What makes milestones better: Old growth makes every leap bigger, each
 *  one reached adds `perMilestone` (Trellis) to its plant on top, and Bone
 *  meal reaches the first `boneMeal` plants on the list. */
export interface MilestoneBonus {
  leap: number;
  perMilestone: number;
  boneMeal: number;
}
const NO_BONUS: MilestoneBonus = { leap: 1, perMilestone: 0, boneMeal: 0 };

/**
 * Bone meal: +10× for every 25 copies, so ×41 at 100 and ×161 at 400.
 * Added, not multiplied, so it can't outgrow what the copies cost and run
 * away.
 */
const BONE_MEAL_STEP = 10;
const BONE_MEAL_EVERY = 25;

/** Whether Bone meal reaches this plant. */
export const boneMealed = (def: PlantDef, bonus = NO_BONUS) =>
  PLANTS.indexOf(def) < bonus.boneMeal;

/** The copies at which a plant next leaps: its next milestone, or with Bone
 *  meal, its next 25 if that's sooner. */
export const nextLeap = (def: PlantDef, have: number, bonus = NO_BONUS) =>
  Math.min(
    nextMilestone(have),
    boneMealed(def, bonus) ? (Math.floor(have / BONE_MEAL_EVERY) + 1) * BONE_MEAL_EVERY : Infinity,
  );

/** The leap the milestone at `at` copies makes. */
export function milestoneLeap(def: PlantDef, at: number, bonus = NO_BONUS) {
  const [at25, at50, at100, after] = def.leaps;
  const leap = at === 25 ? at25 : at === 50 ? at50 : at === 100 ? at100 : after[(at / 100 - 2) % 3];
  return leap * bonus.leap;
}

/** How much better every copy is for owning `have`: every leap reached,
 *  times Trellis's share for each, and Bone meal's if it reaches the plant. */
export function plantBoost(def: PlantDef, have: number, bonus = NO_BONUS) {
  let boost = 1;
  let reached = 0;
  for (let at = nextMilestone(0); at <= have; at = nextMilestone(at)) {
    boost *= milestoneLeap(def, at, bonus);
    reached++;
  }
  const bone = boneMealed(def, bonus) ? 1 + BONE_MEAL_STEP * Math.floor(have / BONE_MEAL_EVERY) : 1;
  return boost * (1 + bonus.perMilestone * reached) * bone;
}

/** Drops per second from each copy, before the greenhouse and skills. */
export const plantRate = (def: PlantDef, have: number, bonus = NO_BONUS) =>
  def.rate * plantBoost(def, have, bonus);

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

/** Trellis: what each level adds to a plant for every milestone it has
 *  reached, on top of the leaps. Added, not multiplied, so it can never make
 *  a milestone outgrow the cost of reaching the next. */
const TRELLIS_STEP = 0.1;
/** Old growth: every milestone's leap is this much bigger. */
const OLD_GROWTH_LEAP = 1.1;
/** Seed bank: all drops, per seed ever harvested, per level. */
const SEED_BANK_STEP = 0.001;

export const UPGRADES: UpgradeDef[] = [
  {
    id: "jar",
    name: "Wider jar",
    baseCost: 1200,
    growth: 2.6,
    max: Infinity,
    unlockLevel: 1,
    effect: (l) =>
      `+${2 * l} per catch, ${catchSecondsAt(l).toFixed(2)}s of plants`,
  },
  {
    id: "soil",
    name: "Rich soil",
    baseCost: 3600,
    growth: 2.8,
    max: 8,
    unlockLevel: 1,
    effect: (l) => `missed drops give ${Math.round(soakShareAt(l) * 100)}%`,
  },
  {
    id: "rainmaker",
    name: "Rain dance",
    baseCost: 2400,
    growth: 2.6,
    max: 12,
    unlockLevel: 1,
    effect: (l) => `${Math.round((1 / RAIN_STEP ** l - 1) * 100)}% more rain`,
  },
  {
    id: "goldleaf",
    name: "Gold leaf",
    baseCost: 7500,
    growth: 2.9,
    max: 12,
    unlockLevel: 2,
    effect: (l) => `${(goldenChanceAt(l) * 100).toFixed(1)}% golden`,
  },
  {
    id: "deepfocus",
    name: "Deep focus",
    baseCost: 9000,
    growth: 2.6,
    max: Infinity,
    unlockLevel: 2,
    effect: (l) => `+${DEEP_FOCUS_STEP * 100 * l}% focus drops`,
  },
  {
    id: "nightshift",
    name: "Night shift",
    baseCost: 30_000,
    growth: 3.2,
    max: 9,
    unlockLevel: 3,
    effect: (l) =>
      `${Math.round(offlineRate(l) * 100)}% offline speed, up to ${offlineHours(l)}h`,
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    baseCost: 60_000,
    growth: 4,
    max: Infinity,
    unlockLevel: 4,
    effect: (l) => `+${25 * l}% plant output`,
  },
  {
    id: "trellis",
    name: "Trellis",
    baseCost: 150_000,
    growth: 3,
    max: Infinity,
    unlockLevel: 6,
    effect: (l) => `plant milestone add +${TRELLIS_STEP * l}× more`,
  },
  {
    id: "seedbank",
    name: "Seed bank",
    baseCost: 1_500_000,
    growth: 3.5,
    max: Infinity,
    unlockLevel: 15,
    effect: (l) =>
      `+${(SEED_BANK_STEP * 100 * l).toFixed(1)}% to all drops per seed`,
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

/** What the garden's milestones are worth: a tenth more each with Old
 *  growth, Trellis's share for every one reached, and how many plants Bone
 *  meal reaches, one a rank. */
export const milestoneBonus = (s: GardenState): MilestoneBonus => ({
  leap: skillRank(s, "oldgrowth") ? OLD_GROWTH_LEAP : 1,
  perMilestone: TRELLIS_STEP * upgradeLevel(s, "trellis"),
  boneMeal: skillRank(s, "bonemeal"),
});

export function plantCost(def: PlantDef, have: number, count = 1) {
  const g = def.growth;
  const first = def.baseCost * g ** have;
  return Math.ceil((first * (g ** count - 1)) / (g - 1));
}

/** How many of a plant the current drops can buy, for the "Max" option. */
export function maxAffordable(def: PlantDef, have: number, drops: number) {
  const g = def.growth;
  const first = def.baseCost * g ** have;
  const n = Math.floor(Math.log((drops * (g - 1)) / first + 1) / Math.log(g));
  // Float error can overshoot by one at exact boundaries.
  return n > 0 && plantCost(def, have, n) > drops
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
/** What ladybug luck multiplies plants by: ×2, and a half more for each
 *  rank of Basking ladybugs. */
const luckBoost = (s: GardenState) => 2 + 0.5 * skillRank(s, "basking");
const luck = (s: GardenState) => (luckLeft(s) > 0 ? luckBoost(s) : 1);

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
      detail:
        luckBoost(s) === 2
          ? `the garden grows twice as fast for ${minutes} minutes`
          : `the garden grows ${luckBoost(s)}× as fast for ${minutes} minutes`,
    },
  );
}

/** Second bloom: all plant output, per milestone reached across the garden. */
const SECOND_BLOOM_STEP = 0.02;

/** Plant milestones reached across the whole garden, for Second bloom. */
const milestones = (s: GardenState) =>
  PLANTS.reduce((sum, p) => sum + milestonesAt(owned(s, p.id)), 0);

/** Everything that multiplies each plant's output: greenhouse, skills, luck. */
export const plantMultiplier = (s: GardenState) =>
  (1 + 0.25 * upgradeLevel(s, "greenhouse")) *
  (1 + 0.1 * skillRank(s, "roots")) *
  (1 + 0.15 * skillRank(s, "morningsun")) *
  (skillRank(s, "secondbloom") ? 1 + SECOND_BLOOM_STEP * milestones(s) : 1) *
  (skillRank(s, "solstice") ? 1.5 : 1) *
  (1 + 0.2 * skillRank(s, "rainroots")) *
  (1 + 0.2 * skillRank(s, "sunbeams")) *
  (skillRank(s, "highsummer") ? 2 : 1) *
  evergreen(s) *
  seedBank(s) *
  luck(s);

/** Drops per second from plants. */
export function rate(s: GardenState) {
  const bonus = milestoneBonus(s);
  const base = PLANTS.reduce(
    (sum, p) => sum + plantRate(p, owned(s, p.id), bonus) * owned(s, p.id),
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
  const deluge = skillRank(s, "deluge") ? 2 : 1;
  // Rate already carries Evergreen and the seed bank; the flat part gets
  // them here.
  return (
    ((1 + 2 * jar) * evergreen(s) * seedBank(s) +
      rate(s) * catchSecondsAt(jar)) *
    hands *
    rainbow *
    deluge
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
  (catchValue(s) * 20 + 25) *
  (1 + 0.25 * skillRank(s, "lucky")) *
  (1 + 0.3 * skillRank(s, "heavydrops"));
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
    for (let l = before + 1; l <= after; l++) items.push(...rewardsAt(l));
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
  const cost = plantCost(def, owned(s, id), count);
  if (cost > s.drops) return;
  commit((g) => ({
    ...g,
    drops: g.drops - cost,
    plants: { ...g.plants, [id]: owned(g, id) + count },
  }));
}

/** What the next `count` levels of an upgrade cost, from `level`, stopping
 *  at its top level. */
export function upgradeCostFor(def: UpgradeDef, level: number, count = 1) {
  let cost = 0;
  for (let l = level; l < Math.min(level + count, def.max); l++) cost += upgradeCost(def, l);
  return cost;
}

/** How many levels of an upgrade the drops can buy, for the "Max" option. */
export function upgradesAffordable(def: UpgradeDef, level: number, drops: number) {
  let count = 0;
  let cost = 0;
  // Each level costs at least 1.4× the last, so this ends soon enough.
  while (level + count < def.max) {
    cost += upgradeCost(def, level + count);
    if (cost > drops) break;
    count++;
  }
  return count;
}

/** Buys `count` levels of an upgrade, or as many as it has left. */
export function buyUpgrade(id: UpgradeId, count = 1) {
  const def = UPGRADES.find((u) => u.id === id);
  const s = gardenStore.get();
  if (!def || levelFromXp(totalXp(s)) < def.unlockLevel) return;
  const level = upgradeLevel(s, id);
  const levels = Math.min(count, def.max - level);
  if (levels < 1) return;
  const cost = upgradeCostFor(def, level, levels);
  if (cost > s.drops) return;
  commit((g) => ({
    ...g,
    drops: g.drops - cost,
    upgrades: { ...g.upgrades, [id]: level + levels },
  }));
}

// ---------------------------------------------------------------- seasons

/** Drops a season must earn before it can be harvested. */
export const SEASON_MINIMUM = 1_000_000;

/**
 * Seeds a harvest pays: 5.5 × (the season's drops in millions)^0.1, and at
 * least one.
 *
 * A fractional power, like AdVenture Capitalist's angels (The Math of Idle
 * Games, part III), only a far smaller one, since the plants grow so fast:
 * twice the seeds takes about a thousand times the drops, so ever bigger
 * totals (Bone meal, the late plants, the seed bank) can't snowball into a
 * runaway harvest, yet each season, running on everything learnt before
 * it, still pays well over the last. Fourteen seasons or so fill the tree.
 */
const SEED_SCALE = 5.5;
const SEED_POWER = 0.1;

export function seedsFor(s: GardenState) {
  if (s.seasonLifetime < SEASON_MINIMUM) return 0;
  return Math.max(1, Math.floor(SEED_SCALE * (s.seasonLifetime / SEASON_MINIMUM) ** SEED_POWER));
}

/** Drops this season needs to pay `seeds`. */
export function dropsForSeeds(seeds: number) {
  return Math.max(SEASON_MINIMUM, SEASON_MINIMUM * (seeds / SEED_SCALE) ** (1 / SEED_POWER));
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
  // Needs only gate the first rank, so a skill learnt before its needs rose
  // stays open for more.
  const missing = rank
    ? []
    : (Object.keys(def.needs) as SkillId[]).filter(
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
