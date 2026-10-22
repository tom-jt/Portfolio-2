"use client";

import { useSyncExternalStore } from "react";

export type ToastKind = "reward" | "level" | "achievement" | "info";

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  detail?: string;
  drops?: number;
  xp?: number;
}

const LIFETIME: Record<ToastKind, number> = {
  reward: 3800,
  info: 4200,
  achievement: 5200,
  level: 6500,
};

/** Older toasts are dropped beyond this, so a burst never fills the screen. */
const MAX_VISIBLE = 4;

let toasts: Toast[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function dismissToast(id: number) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}

export function pushToast(toast: Omit<Toast, "id">) {
  const id = nextId++;
  toasts = [...toasts, { ...toast, id }].slice(-MAX_VISIBLE);
  emit();
  setTimeout(() => dismissToast(id), LIFETIME[toast.kind]);
}

const EMPTY: Toast[] = [];

export function useToasts() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => toasts,
    () => EMPTY,
  );
}
