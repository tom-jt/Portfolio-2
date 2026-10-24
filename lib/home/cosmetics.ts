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
  if (unlock.achievement && !s.achievements.includes(unlock.achievement)) return false;
  if (unlock.holiday && !s.seenHolidays.includes(unlock.holiday)) return false;
  return true;
}

/** "level 6", "end 2 seasons", "be here for halloween": how to earn it. */
export function describeUnlock(unlock: Unlock, achievementName?: (id: string) => string | undefined) {
  if (unlock.level) return `level ${unlock.level}`;
  if (unlock.seasons) return unlock.seasons === 1 ? "end a season" : `end ${unlock.seasons} seasons`;
  if (unlock.achievement) return `achievement: ${achievementName?.(unlock.achievement) ?? unlock.achievement}`;
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
  | "stoneware"
  | "borealis"
  | "bark"
  | "nebula"
  | "coral"
  | "enamel"
  | "maple"
  | "ashen"
  | "frost";

export interface PotMeta {
  id: PotId;
  name: string;
  unlock?: Unlock;
}

export const POTS: PotMeta[] = [
  { id: "classic", name: "mixed" },
  { id: "terracotta", name: "terracotta" },
  { id: "porcelain", name: "porcelain", unlock: { level: 4 } },
  { id: "stone", name: "mossy stone", unlock: { level: 7 } },
  { id: "copper", name: "copper", unlock: { level: 10 } },
  { id: "midnight", name: "midnight", unlock: { level: 14 } },
  { id: "gilded", name: "gilded", unlock: { level: 19 } },
  // The last of them, and the hardest to reach.
  { id: "diamond", name: "diamond", unlock: { level: 30 } },
  // Made for a scene each, in the order they open up.
  { id: "slick", name: "rain-slick", unlock: { level: 3 } },
  { id: "daisy", name: "daisy glaze", unlock: { level: 5 } },
  { id: "stoneware", name: "café stoneware", unlock: { level: 6 } },
  { id: "dusk", name: "dusk glaze", unlock: { level: 8 } },
  { id: "bark", name: "bark", unlock: { level: 9 } },
  { id: "enamel", name: "alpine enamel", unlock: { level: 11 } },
  { id: "maple", name: "maple", unlock: { level: 12 } },
  { id: "borealis", name: "borealis", unlock: { level: 13 } },
  { id: "coral", name: "coral", unlock: { level: 16 } },
  { id: "frost", name: "frost", unlock: { level: 17 } },
  { id: "ashen", name: "ashen", unlock: { level: 21 } },
  { id: "nebula", name: "nebula", unlock: { level: 24 } },
];

export const isPotId = (v: unknown): v is PotId => POTS.some((p) => p.id === v);

/** A pot pick: one pot, or whichever suits the scene. */
export type PotPick = PotId | "scene";
export const isPotPick = (v: unknown): v is PotPick => v === "scene" || isPotId(v);

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
    const on = from <= to ? today >= from && today <= to : today >= from || today <= to;
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
  // One made for each scene.
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

export const DECOR: DecorMeta[] = [
  { id: "spring", name: "spring blossom", unlock: { level: 2 } },
  { id: "summer", name: "summer fireflies", unlock: { level: 3 } },
  { id: "autumn", name: "autumn leaves", unlock: { level: 4 } },
  { id: "winter", name: "winter snow", unlock: { level: 5 } },
  { id: "halloween", name: "halloween", unlock: { holiday: "halloween" } },
  { id: "festive", name: "festive lights", unlock: { holiday: "festive" } },
  { id: "lunar", name: "lunar lanterns", unlock: { holiday: "lunar" } },
  // Made for a scene each, in the order they open up.
  { id: "streaks", name: "rain on the glass", unlock: { level: 6 } },
  { id: "dandelions", name: "dandelion seeds", unlock: { level: 7 } },
  { id: "cosy", name: "café lights", unlock: { level: 8 } },
  { id: "gulls", name: "gulls at dusk", unlock: { level: 9 } },
  { id: "sunbeams", name: "sunbeams", unlock: { level: 10 } },
  { id: "butterflies", name: "butterflies", unlock: { level: 11 } },
  { id: "maples", name: "maple leaves", unlock: { level: 12 } },
  { id: "ribbons", name: "aurora ribbons", unlock: { level: 14 } },
  { id: "fronds", name: "palm fronds", unlock: { level: 16 } },
  { id: "moonsnow", name: "moonlit snow", unlock: { level: 18 } },
  { id: "embers", name: "bonfire embers", unlock: { level: 21 } },
  { id: "starfield", name: "starfield", unlock: { level: 24 } },
];

/** "auto" follows the calendar, "scene" matches the scene, and "none" is a
 *  bare window. */
export type DecorPick = DecorId | "auto" | "scene" | "none";

export const isDecorPick = (v: unknown): v is DecorPick =>
  v === "auto" || v === "scene" || v === "none" || DECOR.some((d) => d.id === v);

/** The decor and pot made for each scene. */
export const SCENE_STYLE: Record<SceneId, { decor: DecorId; pot: PotId }> = {
  rain: { decor: "streaks", pot: "slick" },
  hill: { decor: "dandelions", pot: "daisy" },
  sunset: { decor: "gulls", pot: "dusk" },
  cafe: { decor: "cosy", pot: "stoneware" },
  "p-aurora": { decor: "ribbons", pot: "borealis" },
  "p-forest": { decor: "sunbeams", pot: "bark" },
  "p-space": { decor: "starfield", pot: "nebula" },
  "p-sunset": { decor: "fronds", pot: "coral" },
  "p-alps": { decor: "butterflies", pot: "enamel" },
  "p-autumn": { decor: "maples", pot: "maple" },
  "p-majula": { decor: "embers", pot: "ashen" },
  "p-moonlight": { decor: "moonsnow", pot: "frost" },
};

/** The pot to draw for a pick: the scene's own if it's unlocked, else mixed. */
export function resolvePot(pick: PotPick, scene: SceneId, s: GardenState): PotId {
  if (pick !== "scene") return pick;
  const pot = SCENE_STYLE[scene].pot;
  return isUnlocked(POTS.find((p) => p.id === pot)?.unlock, s) ? pot : "classic";
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
export function currentSeason(now = new Date()): "spring" | "summer" | "autumn" | "winter" {
  const north = ["winter", "winter", "spring", "spring", "spring", "summer", "summer", "summer", "autumn", "autumn", "autumn", "winter"] as const;
  const season = north[now.getMonth()];
  if (!southern()) return season;
  return ({ spring: "autumn", summer: "winter", autumn: "spring", winter: "summer" } as const)[season];
}

/**
 * The decor to draw for a pick: the holiday or season when on auto; the
 * scene's own when matching the scene, if it's unlocked, else the calendar's.
 */
export function resolveDecor(pick: DecorPick, scene: SceneId, s: GardenState, now = new Date()): DecorId | null {
  if (pick === "none") return null;
  if (pick === "scene") {
    const decor = SCENE_STYLE[scene].decor;
    if (isUnlocked(DECOR.find((d) => d.id === decor)?.unlock, s)) return decor;
  } else if (pick !== "auto") return pick;
  return currentHoliday(now) ?? currentSeason(now);
}
