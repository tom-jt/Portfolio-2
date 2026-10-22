"use client";

import { useSyncExternalStore } from "react";

/**
 * A tiny localStorage-backed store for the /home widgets.
 *
 * Built on useSyncExternalStore rather than useState + effect so that every
 * widget reading the same key sees one value, and so hydration is safe: the
 * server snapshot is always `initial`, and React swaps in the stored value
 * immediately after hydrating instead of mismatching on the first render.
 *
 * Writes from other tabs arrive through the `storage` event, which keeps two
 * open copies of the page from overwriting each other's progress.
 */
export interface PersistentStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** Re-reads storage, for when another tab may have written moments ago. */
  reload: () => T;
  initial: T;
}

/** Merges stored fields over the defaults, so adding a field never breaks old saves. */
function mergeDefaults<T>(raw: unknown, initial: T): T {
  if (
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    initial &&
    typeof initial === "object" &&
    !Array.isArray(initial)
  ) {
    return { ...initial, ...(raw as Partial<T>) };
  }
  return (raw as T) ?? initial;
}

export function createPersistentStore<T>(
  key: string,
  initial: T,
  revive: (raw: unknown, initial: T) => T = mergeDefaults,
): PersistentStore<T> {
  let state = initial;
  let loaded = false;
  /** The serialised form of `state`, so re-reads can skip unchanged storage. */
  let lastRaw: string | null = null;
  /** Set when storage is blocked or full. From then on memory is the only
   *  copy, so re-reading must not replace it with whatever storage holds. */
  let memoryOnly = false;
  const listeners = new Set<() => void>();

  /** Returns whether the stored value differed from what was in memory. */
  const read = () => {
    if (memoryOnly) return false;
    let raw: string | null;
    try {
      raw = localStorage.getItem(key);
    } catch {
      memoryOnly = true;
      return false;
    }
    if (loaded && raw === lastRaw) return false;
    lastRaw = raw;
    try {
      state = raw ? revive(JSON.parse(raw), initial) : initial;
    } catch {
      // Corrupt save: start fresh, and the next write replaces it.
      state = initial;
    }
    return true;
  };

  const ensureLoaded = () => {
    if (loaded || typeof window === "undefined") return;
    read();
    loaded = true;
  };

  const emit = () => listeners.forEach((l) => l());

  const onStorage = (e: StorageEvent) => {
    if (e.key === key && read()) emit();
  };

  return {
    initial,
    get: () => {
      ensureLoaded();
      return state;
    },
    set: (next) => {
      ensureLoaded();
      state =
        typeof next === "function" ? (next as (prev: T) => T)(state) : next;
      if (!memoryOnly) {
        try {
          const raw = JSON.stringify(state);
          localStorage.setItem(key, raw);
          lastRaw = raw;
        } catch {
          // Blocked storage or a full quota: keep working in memory.
          memoryOnly = true;
        }
      }
      emit();
    },
    reload: () => {
      if (typeof window === "undefined") return state;
      const wasLoaded = loaded;
      const changed = read();
      loaded = true;
      if (changed && wasLoaded) emit();
      return state;
    },
    subscribe: (listener) => {
      if (listeners.size === 0 && typeof window !== "undefined") {
        window.addEventListener("storage", onStorage);
      }
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && typeof window !== "undefined") {
          window.removeEventListener("storage", onStorage);
        }
      };
    },
  };
}

export function useStore<T>(store: PersistentStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.initial);
}

const noopSubscribe = () => () => {};

/**
 * False during SSR and hydration, true afterwards. For anything that depends
 * on the clock, the viewport or storage and so cannot match the server render.
 */
export function useHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

// One shared clock for everything on the page that shows the time.
let clockNow = 0;
let clockTimer: ReturnType<typeof setInterval> | undefined;
const clockListeners = new Set<() => void>();

function subscribeClock(listener: () => void) {
  clockListeners.add(listener);
  if (!clockTimer) {
    clockNow = Date.now();
    clockTimer = setInterval(() => {
      clockNow = Date.now();
      clockListeners.forEach((l) => l());
    }, 250);
  }
  return () => {
    clockListeners.delete(listener);
    if (clockListeners.size === 0) {
      clearInterval(clockTimer);
      clockTimer = undefined;
    }
  };
}

/**
 * The current time, rounded down to `resolution` ms, so a component only
 * re-renders when the value it shows can change: a clock face at minute
 * resolution renders once a minute, not four times a second. Returns 0 on
 * the server and during hydration.
 */
export function useNow(resolution = 1000, active = true) {
  return useSyncExternalStore(
    active ? subscribeClock : noopSubscribe,
    () => {
      if (!clockTimer) clockNow = Date.now();
      return Math.floor(clockNow / resolution) * resolution;
    },
    () => 0,
  );
}
