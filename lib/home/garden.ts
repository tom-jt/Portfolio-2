"use client";

import { liveGames } from "@/data/home/games";
import { dayKey, formatNumber, previousDayKey } from "./format";
import { SCENES } from "./scenes";
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
  | "moonflower";

export interface PlantDef {
  id: PlantId;
  name: string;
  blurb: string;
  baseCost: number;
  /** Drops per second, per plant owned. */
  rate: number;
  unlockLevel: number;
}

export const PLANTS: PlantDef[] = [
  {
    id: "moss",
    name: "Moss",
    blurb: "Drinks the drizzle nobody else wants.",
    baseCost: 15,
    rate: 0.2,
    unlockLevel: 1,
  },
  {
    id: "fern",
    name: "Fern",
    blurb: "Fronds that funnel the rain inward.",
    baseCost: 120,
    rate: 1.5,
    unlockLevel: 1,
  },
  {
    id: "mint",
    name: "Mint",
    blurb: "Grows like it's being paid to.",
    baseCost: 900,
    rate: 9,
    unlockLevel: 2,
  },
  {
    id: "monstera",
    name: "Monstera",
    blurb: "Big split leaves, bigger appetite.",
    baseCost: 6500,
    rate: 55,
    unlockLevel: 3,
  },
  {
    id: "bonsai",
    name: "Bonsai",
    blurb: "Patience, pruned into a shape.",
    baseCost: 48_000,
    rate: 340,
    unlockLevel: 5,
  },
  {
    id: "moonflower",
    name: "Moonflower",
    blurb: "Only opens after midnight.",
    baseCost: 400_000,
    rate: 2200,
    unlockLevel: 8,
  },
];

/** Each copy of a plant costs this much more than the last. */
const PLANT_GROWTH = 1.15;

// -------------------------------------------------------------- upgrades

export type UpgradeId =
  | "jar"
  | "rainmaker"
  | "goldleaf"
  | "deepfocus"
  | "nightshift"
  | "greenhouse";

export interface UpgradeDef {
  id: UpgradeId;
  name: string;
  blurb: string;
  baseCost: number;
  growth: number;
  max: number;
  unlockLevel: number;
  /** What the upgrade does at a given level, for the shop row. */
  effect: (level: number) => string;
}

export const offlineRate = (level: number) => 0.4 + 0.15 * level;
export const offlineHours = (level: number) => 8 + 4 * level;

export const UPGRADES: UpgradeDef[] = [
  {
    id: "jar",
    name: "Wider jar",
    blurb: "Every drop you catch is worth more.",
    baseCost: 40,
    growth: 2.6,
    max: 15,
    unlockLevel: 1,
    effect: (l) => `+${2 * l} per catch`,
  },
  {
    id: "rainmaker",
    name: "Rain dance",
    blurb: "Drops run down the glass more often.",
    baseCost: 80,
    growth: 3,
    max: 6,
    unlockLevel: 1,
    effect: (l) => `${Math.round((1 / 0.86 ** l - 1) * 100)}% more rain`,
  },
  {
    id: "goldleaf",
    name: "Gold leaf",
    blurb: "Golden drops turn up more often.",
    baseCost: 250,
    growth: 3.5,
    max: 6,
    unlockLevel: 2,
    effect: (l) => `${(goldenChanceAt(l) * 100).toFixed(1)}% golden`,
  },
  {
    id: "deepfocus",
    name: "Deep focus",
    blurb: "Focus sessions pay out more drops.",
    baseCost: 300,
    growth: 3,
    max: 5,
    unlockLevel: 2,
    effect: (l) => `+${20 * l}% focus drops`,
  },
  {
    id: "nightshift",
    name: "Night shift",
    blurb: "The garden keeps collecting while you're away.",
    baseCost: 1000,
    growth: 4,
    max: 4,
    unlockLevel: 3,
    effect: (l) =>
      `${Math.round(offlineRate(l) * 100)}% speed, up to ${offlineHours(l)}h`,
  },
  {
    id: "greenhouse",
    name: "Greenhouse",
    blurb: "Every plant produces more.",
    baseCost: 2000,
    growth: 4,
    max: 8,
    unlockLevel: 4,
    effect: (l) => `+${25 * l}% plant output`,
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
  };
  achievements: string[];
  gamesPlayed: string[];
  /** Daily allowances, reset when the local date changes. */
  daily: { day: string; tasks: number; games: string[] };
  /** Consecutive days with at least one finished focus session. */
  streak: { count: number; lastDay: string };
}

const initial: GardenState = {
  drops: 0,
  lifetime: 0,
  xp: 0,
  plants: {},
  upgrades: {},
  lastTick: 0,
  stats: { tasks: 0, focusMinutes: 0, sessions: 0, caught: 0, golden: 0 },
  achievements: [],
  gamesPlayed: [],
  daily: { day: "", tasks: 0, games: [] },
  streak: { count: 0, lastDay: "" },
};

const num = (v: unknown, fallback = 0) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback;

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
      upgrades: { ...r.upgrades },
      stats: { ...init.stats, ...r.stats },
      achievements: Array.isArray(r.achievements) ? r.achievements : [],
      gamesPlayed: Array.isArray(r.gamesPlayed) ? r.gamesPlayed : [],
      daily: { ...init.daily, ...r.daily },
      streak: { ...init.streak, ...r.streak },
    };
  },
);

export const useGarden = () => useStore(gardenStore);

// -------------------------------------------------------------- formulas

const owned = (s: GardenState, id: PlantId) => s.plants[id] ?? 0;
export const upgradeLevel = (s: GardenState, id: UpgradeId) =>
  s.upgrades[id] ?? 0;

export function plantCost(def: PlantDef, have: number, count = 1) {
  const first = def.baseCost * PLANT_GROWTH ** have;
  return Math.ceil((first * (PLANT_GROWTH ** count - 1)) / (PLANT_GROWTH - 1));
}

/** How many of a plant the current drops can buy, for the "Max" option. */
export function maxAffordable(def: PlantDef, have: number, drops: number) {
  const first = def.baseCost * PLANT_GROWTH ** have;
  const n = Math.floor(
    Math.log((drops * (PLANT_GROWTH - 1)) / first + 1) / Math.log(PLANT_GROWTH),
  );
  // Float error can overshoot by one at exact boundaries.
  return n > 0 && plantCost(def, have, n) > drops ? n - 1 : Math.max(0, n);
}

export const upgradeCost = (def: UpgradeDef, level: number) =>
  Math.ceil(def.baseCost * def.growth ** level);

export const plantMultiplier = (s: GardenState) =>
  1 + 0.25 * upgradeLevel(s, "greenhouse");

/** Drops per second from plants. */
export function rate(s: GardenState) {
  const base = PLANTS.reduce((sum, p) => sum + p.rate * owned(s, p.id), 0);
  return base * plantMultiplier(s);
}

export const plantCount = (s: GardenState) =>
  PLANTS.reduce((sum, p) => sum + owned(s, p.id), 0);

/** A catch is also worth a quarter-second of the garden's output, so
 *  catching rain stays worth doing as the garden grows. */
export const catchValue = (s: GardenState) =>
  1 + 2 * upgradeLevel(s, "jar") + rate(s) * 0.25;

const goldenChanceAt = (level: number) => 0.03 + 0.015 * level;
export const goldenChance = (s: GardenState) =>
  goldenChanceAt(upgradeLevel(s, "goldleaf"));
export const goldenValue = (s: GardenState) => catchValue(s) * 20 + 25;

/** Milliseconds between drops appearing on the window. */
export const spawnInterval = (s: GardenState) =>
  1100 * 0.86 ** upgradeLevel(s, "rainmaker");

export const TASK_DAILY_CAP = 12;

export const taskReward = (s: GardenState) => ({
  drops: Math.round(20 + rate(s) * 60),
  xp: 12,
});

export const focusReward = (s: GardenState, minutes: number) => ({
  drops: Math.round(
    (5 + rate(s) * 12) * minutes * (1 + 0.2 * upgradeLevel(s, "deepfocus")),
  ),
  xp: Math.round(3 * minutes + 10),
});

export const gameReward = (s: GardenState) => ({
  drops: Math.round(40 + rate(s) * 90),
  xp: 10,
});

// ---------------------------------------------------------------- levels

/** Total XP needed to reach a level: 75, 200, 375, 600, 875… */
export const xpForLevel = (level: number) =>
  50 * (level - 1) + 25 * (level - 1) ** 2;

export function levelFromXp(xp: number) {
  let level = 1;
  while (level < 999 && xpForLevel(level + 1) <= xp) level++;
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
  return { level, into: xp - floor, span: ceil - floor };
}

/** Everything a level opens up, for level-up toasts and the "next" teaser. */
export function unlocksAt(level: number) {
  return [
    ...SCENES.filter((s) => s.unlockLevel === level).map(
      (s) => `${s.name} scene`,
    ),
    ...PLANTS.filter((p) => p.unlockLevel === level).map((p) => p.name),
    ...UPGRADES.filter((u) => u.unlockLevel === level).map((u) => u.name),
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
    test: (s) => levelFromXp(s.xp) >= 5,
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
      { ...next, achievements: [...next.achievements, ...earned.map((a) => a.id)] },
      earned.reduce((sum, a) => sum + a.reward, 0),
    );
  }

  const before = levelFromXp(prev.xp);
  const after = levelFromXp(next.xp);
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
      title: `Level ${after}`,
      detail: items.length ? `Unlocked: ${items.join(", ")}` : "The garden grows.",
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
  const night = upgradeLevel(s, "nightshift");
  const online = Math.min(elapsed, ONLINE_GRACE_S);
  const away = Math.min(elapsed - online, offlineHours(night) * 3600);
  const awayGain = r * away * offlineRate(night);
  const gain = r * online + awayGain;

  gardenStore.set({ ...addDrops(s, gain), lastTick: now });
  return { away: elapsed - online, gain: awayGain };
}

export function catchDrop(golden: boolean) {
  const s = gardenStore.get();
  const value = golden ? goldenValue(s) : catchValue(s);
  commit((g) => ({
    ...addDrops(g, value),
    xp: g.xp + (golden ? 2 : 0),
    stats: {
      ...g.stats,
      caught: g.stats.caught + 1,
      golden: g.stats.golden + (golden ? 1 : 0),
    },
  }));
  return value;
}

/** Returns false once the day's task rewards are used up. */
export function rewardTask() {
  const s = withToday(gardenStore.get());
  if (s.daily.tasks >= TASK_DAILY_CAP) {
    pushToast({
      kind: "info",
      title: "Task done",
      detail: `That's ${TASK_DAILY_CAP} rewarded today, so this one's just for you.`,
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
    { kind: "reward", title: "Task done", drops, xp },
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
              count: g.streak.lastDay === previousDayKey() ? g.streak.count + 1 : 1,
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
      title: "Focus session complete",
      detail: `${minutes} minutes well spent.`,
      drops,
      xp,
    },
  );
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
    { kind: "reward", title: `First play today: ${title}`, drops, xp },
  );
}

export function buyPlant(id: PlantId, count: number) {
  const def = PLANTS.find((p) => p.id === id);
  const s = gardenStore.get();
  if (!def || count < 1 || levelFromXp(s.xp) < def.unlockLevel) return;
  const cost = plantCost(def, owned(s, id), count);
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
  if (!def || levelFromXp(s.xp) < def.unlockLevel) return;
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

/** Toast copy for income earned while the tab was closed. */
export function awayToast(gain: number, awaySeconds: number) {
  const hours = awaySeconds / 3600;
  const span =
    hours >= 1
      ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m`
      : `${Math.round(awaySeconds / 60)}m`;
  pushToast({
    kind: "info",
    title: "While you were away",
    detail: `The garden collected ${formatNumber(gain)} drops over ${span}.`,
  });
}
