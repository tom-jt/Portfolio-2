"use client";

import { DEV_UNLOCKS, levelFromXp, type GardenState } from "./garden";

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
  if (unlock.level && levelFromXp(s.xp) < unlock.level) return false;
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
  | "diamond";

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
];

export const isPotId = (v: unknown): v is PotId => POTS.some((p) => p.id === v);

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

export type DecorId = "spring" | "summer" | "autumn" | "winter" | HolidayId;

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
];

/** "auto" follows the calendar; "none" is a bare window. */
export type DecorPick = DecorId | "auto" | "none";

export const isDecorPick = (v: unknown): v is DecorPick =>
  v === "auto" || v === "none" || DECOR.some((d) => d.id === v);

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

/** The decor to draw for a pick: the holiday or season when on auto. */
export function resolveDecor(pick: DecorPick, now = new Date()): DecorId | null {
  if (pick === "none") return null;
  if (pick !== "auto") return pick;
  return currentHoliday(now) ?? currentSeason(now);
}
