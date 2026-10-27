"use client";

import { DEV_UNLOCKS, levelFromXp, totalXp, type GardenState } from "./garden";
import type { SceneId } from "./scenes";

/**
 * Cosmetics: pots, garden decor, and the locked colour themes and ambient
 * sounds. None of them change the numbers; they are something to chase once
 * the numbers stop mattering. All are earned by level, which comes from real
 * work, except holiday decor, which needs being here for the holiday.
 */

/** What opens a cosmetic. Several conditions must all hold; none is free. */
export interface Unlock {
  level?: number;
  seasons?: number;
  achievement?: string;
  holiday?: HolidayId;
}

export function isUnlocked(unlock: Unlock | undefined, s: GardenState) {
  if (!unlock || DEV_UNLOCKS) return true;
  if (unlock.level && levelFromXp(totalXp(s)) < unlock.level) return false;
  if (unlock.seasons && s.seasons < unlock.seasons) return false;
  if (unlock.achievement && !s.achievements.includes(unlock.achievement))
    return false;
  if (unlock.holiday && !s.seenHolidays.includes(unlock.holiday)) return false;
  return true;
}

/** "level 6", "end 2 seasons", "be here for halloween": how to earn it. */
export function describeUnlock(
  unlock: Unlock,
  achievementName?: (id: string) => string | undefined,
) {
  if (unlock.level) return `level ${unlock.level}`;
  if (unlock.seasons)
    return unlock.seasons === 1
      ? "end a season"
      : `end ${unlock.seasons} seasons`;
  if (unlock.achievement)
    return `achievement: ${achievementName?.(unlock.achievement) ?? unlock.achievement}`;
  if (unlock.holiday) return `visit during ${getHoliday(unlock.holiday).name}`;
  return "";
}

// ------------------------------------------------------------------ pots

export type PotId =
  | "classic"
  | "terracotta"
  | "porcelain"
  | "stone"
  | "copper"
  | "midnight"
  | "gilded"
  | "diamond"
  // One made for each scene.
  | "slick"
  | "daisy"
  | "dusk"
  | "marble"
  | "borealis"
  | "bark"
  | "nebula"
  | "coral"
  | "enamel"
  | "maple"
  | "ashen"
  | "frost"
  // Made to match the frames.
  | "wood"
  | "stained"
  | "brass"
  | "gothic";

export interface PotMeta {
  id: PotId;
  name: string;
  unlock?: Unlock;
}

/**
 * The matching sets: every pot comes with a frame and a window decor of its
 * own, opening one level after another (the pot, then its frame, then its
 * window), and each set three levels after the last, so no two of them open
 * together. The scenes' own sets come in the order the scenes do, with the
 * rest between; the long-haul four are spaced out towards level 100.
 */
const SETS: { pot: Exclude<PotId, "classic">; window: DecorId; level: number }[] = [
  { pot: "terracotta", window: "herbs", level: 1 },
  { pot: "slick", window: "streaks", level: 4 },
  { pot: "daisy", window: "dandelions", level: 7 },
  { pot: "porcelain", window: "willow", level: 10 },
  { pot: "dusk", window: "gulls", level: 13 },
  { pot: "marble", window: "cosy", level: 16 },
  { pot: "borealis", window: "ribbons", level: 19 },
  { pot: "stone", window: "ivy", level: 22 },
  { pot: "bark", window: "sunbeams", level: 25 },
  { pot: "nebula", window: "starfield", level: 28 },
  { pot: "copper", window: "lamps", level: 31 },
  { pot: "coral", window: "fronds", level: 34 },
  { pot: "enamel", window: "butterflies", level: 37 },
  { pot: "midnight", window: "moonrise", level: 40 },
  { pot: "maple", window: "maples", level: 43 },
  { pot: "ashen", window: "embers", level: 46 },
  { pot: "gilded", window: "golddust", level: 49 },
  { pot: "frost", window: "moonsnow", level: 52 },
  { pot: "diamond", window: "prisms", level: 55 },
  { pot: "wood", window: "acorns", level: 62 },
  { pot: "stained", window: "panes", level: 70 },
  { pot: "brass", window: "clockwork", level: 78 },
  { pot: "gothic", window: "candles", level: 86 },
];

/** A set piece's unlock: `step` levels after its set opens (none at level 1). */
const setUnlock = (pot: PotId, step: number): Unlock | undefined => {
  const set = SETS.find((x) => x.pot === pot);
  const level = set ? set.level + step : 1;
  return level > 1 ? { level } : undefined;
};

/** The pot of each set; mixed is the default, free from the start. */
const POT_NAMES: Record<PotId, string> = {
  classic: "mixed",
  terracotta: "terracotta",
  slick: "rain-slick",
  porcelain: "porcelain",
  daisy: "daisy glaze",
  marble: "café marble",
  stone: "mossy stone",
  dusk: "dusk glaze",
  bark: "bark",
  copper: "copper",
  enamel: "alpine enamel",
  maple: "maple",
  borealis: "borealis",
  midnight: "midnight",
  coral: "coral",
  frost: "frost",
  gilded: "gilded",
  ashen: "ashen",
  nebula: "nebula",
  diamond: "diamond",
  wood: "oak",
  stained: "stained glass",
  brass: "brass",
  gothic: "gothic stone",
};

/** In the order they open up. */
export const POTS: PotMeta[] = [
  { id: "classic", name: POT_NAMES.classic },
  ...SETS.map(({ pot }) => ({ id: pot, name: POT_NAMES[pot], unlock: setUnlock(pot, 0) })),
];

export const isPotId = (v: unknown): v is PotId => POTS.some((p) => p.id === v);

/** A pot pick: one pot, or whichever suits the scene. */
export type PotPick = PotId | "scene";
export const isPotPick = (v: unknown): v is PotPick =>
  v === "scene" || isPotId(v);

// ---------------------------------------------------------------- frames

/**
 * Frames for the garden window: one to match every pot, sharing its id and
 * name and opening the level after it. "Mixed" pots have no single look, so
 * their match is the plain frame.
 */
export type FrameId = "plain" | Exclude<PotId, "classic">;

export interface FrameMeta {
  id: FrameId;
  name: string;
  unlock?: Unlock;
}

export const FRAMES: FrameMeta[] = [
  { id: "plain", name: "plain" },
  ...SETS.map(({ pot }) => ({ id: pot, name: POT_NAMES[pot], unlock: setUnlock(pot, 1) })),
];

export const isFrameId = (v: unknown): v is FrameId =>
  FRAMES.some((f) => f.id === v);

/** A frame pick: one frame, or whichever suits the scene. */
export type FramePick = FrameId | "scene";
export const isFramePick = (v: unknown): v is FramePick =>
  v === "scene" || isFrameId(v);

/** Gilded plants, gold leaf on every one: the reward for reaching level 100. */
export const GOLD_LEAF: Unlock = { level: 100 };

// -------------------------------------------------------------- holidays

export type HolidayId = "halloween" | "festive" | "lunar";

interface HolidayMeta {
  id: HolidayId;
  name: string;
  /** Inclusive month-day windows, [month, day] with January as 1. A window
   *  may wrap past new year. */
  from: [number, number];
  to: [number, number];
}

const HOLIDAYS: HolidayMeta[] = [
  { id: "halloween", name: "halloween", from: [10, 20], to: [11, 2] },
  { id: "festive", name: "the festive season", from: [12, 1], to: [1, 6] },
  // Lunar new year moves; this covers every date it can fall on.
  { id: "lunar", name: "lunar new year", from: [1, 20], to: [2, 20] },
];

export const getHoliday = (id: HolidayId) => HOLIDAYS.find((h) => h.id === id)!;

const md = (d: Date) => (d.getMonth() + 1) * 100 + d.getDate();

/** The holiday on now, if any. */
export function currentHoliday(now = new Date()): HolidayId | null {
  const today = md(now);
  for (const h of HOLIDAYS) {
    const from = h.from[0] * 100 + h.from[1];
    const to = h.to[0] * 100 + h.to[1];
    const on =
      from <= to ? today >= from && today <= to : today >= from || today <= to;
    if (on) return h.id;
  }
  return null;
}

// ----------------------------------------------------------------- decor

export type DecorId =
  | "spring"
  | "summer"
  | "autumn"
  | "winter"
  | HolidayId
  // One for each set's pot.
  | "herbs"
  | "willow"
  | "ivy"
  | "lamps"
  | "moonrise"
  | "golddust"
  | "prisms"
  | "acorns"
  | "panes"
  | "clockwork"
  | "candles"
  | "streaks"
  | "dandelions"
  | "gulls"
  | "cosy"
  | "ribbons"
  | "sunbeams"
  | "starfield"
  | "fronds"
  | "butterflies"
  | "maples"
  | "embers"
  | "moonsnow";

export interface DecorMeta {
  id: DecorId;
  name: string;
  unlock?: Unlock;
}

/** What each set's window is called. */
const WINDOW_NAMES: Partial<Record<DecorId, string>> = {
  herbs: "drying herbs",
  streaks: "rain on the glass",
  dandelions: "dandelion seeds",
  willow: "willow-pattern birds",
  gulls: "gulls at dusk",
  cosy: "café lights",
  ribbons: "aurora ribbons",
  ivy: "creeping ivy",
  sunbeams: "sunbeams",
  starfield: "starfield",
  lamps: "copper lamps",
  fronds: "palm fronds",
  butterflies: "butterflies",
  moonrise: "crescent moon",
  maples: "maple leaves",
  embers: "bonfire embers",
  golddust: "gold dust",
  moonsnow: "moonlit snow",
  prisms: "prism light",
  acorns: "falling acorns",
  panes: "coloured light",
  clockwork: "clockwork",
  candles: "candlelight",
};

export const DECOR: DecorMeta[] = [
  // The seasons: free, as they're what a window wears with no set of its own.
  { id: "spring", name: "spring blossom" },
  { id: "summer", name: "summer fireflies" },
  { id: "autumn", name: "autumn leaves" },
  { id: "winter", name: "winter snow" },
  // Each set's own, two levels after its pot.
  ...SETS.map(({ pot, window }) => ({ id: window, name: WINDOW_NAMES[window]!, unlock: setUnlock(pot, 2) })),
  // Made for festives and holiday seasons
  { id: "halloween", name: "halloween", unlock: { holiday: "halloween" } },
  { id: "festive", name: "festive lights", unlock: { holiday: "festive" } },
  { id: "lunar", name: "lunar lanterns", unlock: { holiday: "lunar" } },
];

/** "auto" matches the scene, and "none" is a bare window. */
export type DecorPick = DecorId | "auto" | "none";

export const isDecorPick = (v: unknown): v is DecorPick =>
  v === "auto" || v === "none" || DECOR.some((d) => d.id === v);

/** The decor and pot made for each scene. */
export const SCENE_STYLE: Record<SceneId, { decor: DecorId; pot: PotId }> = {
  rain: { decor: "streaks", pot: "slick" },
  hill: { decor: "dandelions", pot: "daisy" },
  sunset: { decor: "gulls", pot: "dusk" },
  cafe: { decor: "cosy", pot: "marble" },
  "p-aurora": { decor: "ribbons", pot: "borealis" },
  "p-forest": { decor: "sunbeams", pot: "bark" },
  "p-space": { decor: "starfield", pot: "nebula" },
  "p-sunset": { decor: "fronds", pot: "coral" },
  "p-alps": { decor: "butterflies", pot: "enamel" },
  "p-autumn": { decor: "maples", pot: "maple" },
  "p-majula": { decor: "embers", pot: "ashen" },
  "p-moonlight": { decor: "moonsnow", pot: "frost" },
};

/** The frame to draw for a pick: the scene's own if it's unlocked, else plain. */
export function resolveFrame(
  pick: FramePick,
  scene: SceneId,
  s: GardenState,
): FrameId {
  if (pick !== "scene") return pick;
  const frame = SCENE_STYLE[scene].pot as FrameId;
  return isUnlocked(FRAMES.find((f) => f.id === frame)?.unlock, s)
    ? frame
    : "plain";
}

/** The pot to draw for a pick: the scene's own if it's unlocked, else mixed. */
export function resolvePot(
  pick: PotPick,
  scene: SceneId,
  s: GardenState,
): PotId {
  if (pick !== "scene") return pick;
  const pot = SCENE_STYLE[scene].pot;
  return isUnlocked(POTS.find((p) => p.id === pot)?.unlock, s)
    ? pot
    : "classic";
}

/**
 * Southern hemisphere, guessed from the time zone: the seasons are the other
 * way round there, and nothing else on the page knows where anyone is.
 */
function southern() {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "";
    return /^(Australia|Antarctica)\/|^Pacific\/(Auckland|Chatham|Fiji|Noumea)|^America\/(Argentina|Santiago|Sao_Paulo|Montevideo|Asuncion|La_Paz|Lima)|^Africa\/(Johannesburg|Maputo|Harare|Windhoek|Gaborone)|^Indian\/(Mauritius|Reunion)/.test(
      zone,
    );
  } catch {
    return false;
  }
}

/** The season outside, for the auto decor. */
export function currentSeason(
  now = new Date(),
): "spring" | "summer" | "autumn" | "winter" {
  const north = [
    "winter",
    "winter",
    "spring",
    "spring",
    "spring",
    "summer",
    "summer",
    "summer",
    "autumn",
    "autumn",
    "autumn",
    "winter",
  ] as const;
  const season = north[now.getMonth()];
  if (!southern()) return season;
  return (
    {
      spring: "autumn",
      summer: "winter",
      autumn: "spring",
      winter: "summer",
    } as const
  )[season];
}

/**
 * The decor to draw for a pick. On auto: the scene's own once it's
 * unlocked, else the season outside. Holidays are never chosen for you;
 * they're there to pick.
 */
export function resolveDecor(
  pick: DecorPick,
  scene: SceneId,
  s: GardenState,
  now = new Date(),
): DecorId | null {
  if (pick === "none") return null;
  if (pick !== "auto") return pick;
  const decor = SCENE_STYLE[scene].decor;
  if (isUnlocked(DECOR.find((d) => d.id === decor)?.unlock, s)) return decor;
  return currentSeason(now);
}
