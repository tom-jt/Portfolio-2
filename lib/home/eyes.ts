"use client";

import { dayKey } from "./format";
import { rewardEyeBreak } from "./garden";
import { createPersistentStore, useStore } from "./store";

/**
 * Eye breaks, after the 20-20-20 rule: every so often, look at something
 * far away for twenty seconds.
 *
 * A reminder becomes "due" on schedule, chimes, and starts the rest by
 * itself once the chime has rung out, so there is nothing to press.
 * Skipping it just schedules the next one.
 */

export type EyePhase = "idle" | "due" | "resting";

export interface EyeState {
  enabled: boolean;
  /** Minutes between reminders. */
  interval: number;
  sound: boolean;
  notify: boolean;
  phase: EyePhase;
  /** When the next reminder falls due; 0 while unscheduled. */
  nextAt: number;
  /** When the current reminder fell due. */
  dueAt: number;
  /** When the current rest ends. */
  restUntil: number;
  /** Only rests answering a reminder pay out, so "rest now" can't be farmed. */
  restFromReminder: boolean;
  today: { day: string; breaks: number };
}

export const REST_SECONDS = 20;
/** How long a reminder shows before its rest starts: the chime's length. */
export const DUE_LEAD_MS = 1600;
export const EYE_LIMITS = { min: 5, max: 90, step: 5 } as const;

const initial: EyeState = {
  enabled: true,
  interval: 20,
  sound: true,
  notify: false,
  phase: "idle",
  nextAt: 0,
  dueAt: 0,
  restUntil: 0,
  restFromReminder: false,
  today: { day: "", breaks: 0 },
};

export const eyeStore = createPersistentStore<EyeState>(
  "home:eyes:v1",
  initial,
  (raw, init) => {
    const r = (raw ?? {}) as Partial<EyeState>;
    const interval =
      typeof r.interval === "number" && r.interval >= EYE_LIMITS.min && r.interval <= EYE_LIMITS.max
        ? r.interval
        : init.interval;
    return { ...init, ...r, interval, today: { ...init.today, ...r.today } };
  },
);

export const useEyes = () => useStore(eyeStore);

export function breaksToday(s: EyeState) {
  return s.today.day === dayKey() ? s.today.breaks : 0;
}

const scheduled = (s: EyeState, now: number): EyeState => ({
  ...s,
  phase: "idle",
  nextAt: s.enabled ? now + s.interval * 60_000 : 0,
  dueAt: 0,
  restUntil: 0,
  restFromReminder: false,
});

export const schedule = (now = Date.now()) => eyeStore.set((s) => scheduled(s, now));

export function setEnabled(enabled: boolean) {
  eyeStore.set((s) => scheduled({ ...s, enabled }, Date.now()));
}

export function setEyeInterval(interval: number) {
  // A new interval starts counting from now, unless a reminder is already up.
  eyeStore.set((s) => {
    const next = { ...s, interval };
    return s.phase === "idle" ? scheduled(next, Date.now()) : next;
  });
}

export const setEyeOption = (patch: Partial<Pick<EyeState, "sound" | "notify">>) =>
  eyeStore.set((s) => ({ ...s, ...patch }));

/**
 * Marks the reminder due if its time has come. Re-reads storage first so
 * that only one of several open tabs announces it. Returns whether it did.
 */
export function markDueIfTime(now = Date.now()) {
  const mine = eyeStore.get();
  if (!mine.enabled || mine.phase !== "idle" || !mine.nextAt || now < mine.nextAt) return false;
  const s = eyeStore.reload();
  if (!s.enabled || s.phase !== "idle" || !s.nextAt || now < s.nextAt) return false;
  eyeStore.set({ ...s, phase: "due", dueAt: now });
  return true;
}

export function startRest(fromReminder: boolean) {
  eyeStore.set((s) => ({
    ...s,
    phase: "resting",
    restUntil: Date.now() + REST_SECONDS * 1000,
    restFromReminder: fromReminder,
  }));
}

/** Starts the rest once a reminder has been up for DUE_LEAD_MS. Returns
 *  whether it did. */
export function startRestIfDue(now = Date.now()) {
  const mine = eyeStore.get();
  if (mine.phase !== "due" || now < mine.dueAt + DUE_LEAD_MS) return false;
  const s = eyeStore.reload();
  if (s.phase !== "due" || now < s.dueAt + DUE_LEAD_MS) return false;
  startRest(true);
  return true;
}

/** Ends the rest if its time is up. Returns whether it did. */
export function finishRestIfDone(now = Date.now()) {
  const mine = eyeStore.get();
  if (mine.phase !== "resting" || now < mine.restUntil) return false;
  const s = eyeStore.reload();
  if (s.phase !== "resting" || now < s.restUntil) return false;
  const today = { day: dayKey(), breaks: breaksToday(s) + 1 };
  eyeStore.set(scheduled({ ...s, today }, now));
  if (s.restFromReminder) rewardEyeBreak();
  return true;
}

export const skipBreak = () => schedule();
