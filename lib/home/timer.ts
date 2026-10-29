"use client";

import { useEffect, useRef } from "react";
import { dayKey } from "./format";
import { rewardFocus } from "./garden";
import { createPersistentStore, useStore } from "./store";

export type TimerMode = "focus" | "short" | "long";
export type TimerStatus = "idle" | "running" | "paused";

export interface TimerSettings {
  /** Minutes. */
  focus: number;
  short: number;
  long: number;
  /** A long break replaces every Nth short one. */
  longEvery: number;
  autoStart: boolean;
  chime: boolean;
  notify: boolean;
}

export interface TimerState {
  mode: TimerMode;
  status: TimerStatus;
  /** Length of the current session in ms, fixed when it is set up, so
   *  editing settings mid-session never changes what it pays out. */
  duration: number;
  /** Wall-clock end while running. Storing the end rather than a countdown
   *  keeps it right across reloads, sleeping laptops and throttled tabs. */
  endsAt: number;
  /** Time left while idle or paused. */
  remaining: number;
  /** Focus sessions finished since the last long break. */
  cycle: number;
  settings: TimerSettings;
  today: { day: string; focusMinutes: number; sessions: number };
}

export const MODE_LABEL: Record<TimerMode, string> = {
  focus: "focus",
  short: "short break",
  long: "long break",
};

export const LIMITS = {
  focus: [5, 120],
  short: [1, 30],
  long: [5, 60],
  longEvery: [2, 8],
} as const;

const defaultSettings: TimerSettings = {
  focus: 25,
  short: 5,
  long: 15,
  longEvery: 4,
  autoStart: false,
  chime: true,
  notify: false,
};

const minutesFor = (mode: TimerMode, s: TimerSettings) => s[mode] * 60_000;

export const notificationsSupported = () =>
  typeof window !== "undefined" && "Notification" in window;

/**
 * Shows a notification, if they're allowed. Through the service worker where
 * there is one: phones (Chrome on Android, and iPhones with /home installed)
 * only show them that way and refuse `new Notification`. A tag replaces the
 * last notification with the same one rather than stacking them up.
 */
export async function showNotification(title: string, body: string, tag: string) {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  const options: NotificationOptions = { body, tag, icon: "/home/icons/icon-192.png" };
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (registration) return await registration.showNotification(title, options);
  } catch {}
  try {
    new Notification(title, options).onclick = () => window.focus();
  } catch {}
}

const initial: TimerState = {
  mode: "focus",
  status: "idle",
  duration: minutesFor("focus", defaultSettings),
  endsAt: 0,
  remaining: minutesFor("focus", defaultSettings),
  cycle: 0,
  settings: defaultSettings,
  today: { day: "", focusMinutes: 0, sessions: 0 },
};

export const timerStore = createPersistentStore<TimerState>(
  "home:timer:v1",
  initial,
  (raw, init) => {
    const r = (raw ?? {}) as Partial<TimerState>;
    return {
      ...init,
      ...r,
      settings: { ...init.settings, ...r.settings },
      today: { ...init.today, ...r.today },
    };
  },
);

export const useTimer = () => useStore(timerStore);

/** Never more than was left at the start: the shared clock rounds down, so
 *  just after starting it can read a moment early and show 25:01. */
export function timeLeft(s: TimerState, now = Date.now()) {
  return s.status === "running" ? Math.min(s.remaining, Math.max(0, s.endsAt - now)) : s.remaining;
}

export function todayStats(s: TimerState) {
  return s.today.day === dayKey()
    ? s.today
    : { day: dayKey(), focusMinutes: 0, sessions: 0 };
}

const idleIn = (s: TimerState, mode: TimerMode): TimerState => {
  const duration = minutesFor(mode, s.settings);
  return { ...s, mode, status: "idle", duration, remaining: duration, endsAt: 0 };
};

export function start() {
  timerStore.set((s) =>
    s.status === "running"
      ? s
      : { ...s, status: "running", endsAt: Date.now() + s.remaining },
  );
}

export function pause() {
  timerStore.set((s) =>
    s.status !== "running"
      ? s
      : { ...s, status: "paused", remaining: Math.max(0, s.endsAt - Date.now()) },
  );
}

export const reset = () => timerStore.set((s) => idleIn(s, s.mode));

export const setMode = (mode: TimerMode) =>
  timerStore.set((s) => idleIn(s, mode));

/** The mode that follows `mode`, given how many focus sessions are done. */
function nextMode(mode: TimerMode, cycle: number, longEvery: number) {
  if (mode !== "focus") return "focus";
  return cycle > 0 && cycle % longEvery === 0 ? "long" : "short";
}

/** Moves on without paying out. */
export function skip() {
  timerStore.set((s) => {
    const cycle = s.mode === "long" ? 0 : s.cycle;
    return idleIn({ ...s, cycle }, nextMode(s.mode, cycle, s.settings.longEvery));
  });
}

export function updateSettings(patch: Partial<TimerSettings>) {
  timerStore.set((s) => {
    const settings = { ...s.settings, ...patch };
    const next = { ...s, settings };
    // An untouched session picks up the new length; one in progress keeps its own.
    return s.status === "idle" ? idleIn(next, s.mode) : next;
  });
}

export interface Completion {
  finished: TimerMode;
  next: TimerMode;
  minutes: number;
}

/**
 * Finishes the running session if its time is up. Re-reads storage first so
 * that, with the page open in two tabs, only one of them pays out.
 */
export function completeIfDue(now = Date.now()): Completion | null {
  const mine = timerStore.get();
  if (mine.status !== "running" || now < mine.endsAt) return null;
  const s = timerStore.reload();
  if (s.status !== "running" || now < s.endsAt) return null;

  const finished = s.mode;
  const minutes = Math.round(s.duration / 60_000);
  let cycle = s.cycle;
  let today = todayStats(s);

  if (finished === "focus") {
    cycle += 1;
    today = {
      ...today,
      focusMinutes: today.focusMinutes + minutes,
      sessions: today.sessions + 1,
    };
  } else if (finished === "long") {
    cycle = 0;
  }

  const next = nextMode(finished, cycle, s.settings.longEvery);
  const idle = idleIn({ ...s, cycle, today }, next);
  timerStore.set(
    s.settings.autoStart
      ? { ...idle, status: "running", endsAt: now + idle.duration }
      : idle,
  );

  if (finished === "focus") rewardFocus(minutes);
  return { finished, next, minutes };
}

/**
 * Drives the timer while /home is open: a slow interval as a safety net, an
 * exact timeout for the end (one long timeout is spared the throttling that
 * hidden tabs apply to repeating timers), and a check on returning to the tab.
 */
export function useTimerEngine(onComplete: (c: Completion) => void) {
  const callback = useRef(onComplete);
  useEffect(() => {
    callback.current = onComplete;
  });

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const check = () => {
      const done = completeIfDue();
      if (done) callback.current(done);
    };

    const schedule = () => {
      clearTimeout(timeout);
      const s = timerStore.get();
      if (s.status === "running") {
        timeout = setTimeout(check, Math.max(0, s.endsAt - Date.now()) + 50);
      }
    };

    check();
    schedule();
    const unsubscribe = timerStore.subscribe(schedule);
    const interval = setInterval(check, 1000);
    const onVisible = () => !document.hidden && check();
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
