"use client";

import { rewardTask } from "./garden";
import { createPersistentStore, useStore } from "./store";

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  doneAt: number | null;
  /** Set on the first completion, so ticking a task on and off pays once. */
  rewarded: boolean;
}

export const TODO_MAX_LENGTH = 140;
export const TODO_MAX_ITEMS = 100;

export const todoStore = createPersistentStore<Todo[]>(
  "home:todos:v1",
  [],
  (raw) => (Array.isArray(raw) ? (raw as Todo[]) : []),
);

export const useTodos = () => useStore(todoStore);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function addTodo(text: string) {
  const clean = text.trim().slice(0, TODO_MAX_LENGTH);
  if (!clean || todoStore.get().length >= TODO_MAX_ITEMS) return false;
  todoStore.set((list) => [
    ...list,
    {
      id: newId(),
      text: clean,
      done: false,
      createdAt: Date.now(),
      doneAt: null,
      rewarded: false,
    },
  ]);
  return true;
}

export function toggleTodo(id: string) {
  const item = todoStore.get().find((t) => t.id === id);
  if (!item) return;
  const done = !item.done;
  const payOut = done && !item.rewarded;
  todoStore.set((list) =>
    list.map((t) =>
      t.id === id
        ? {
            ...t,
            done,
            doneAt: done ? Date.now() : null,
            rewarded: t.rewarded || payOut,
          }
        : t,
    ),
  );
  if (payOut) rewardTask();
}

export function editTodo(id: string, text: string) {
  const clean = text.trim().slice(0, TODO_MAX_LENGTH);
  if (!clean) return removeTodo(id);
  todoStore.set((list) =>
    list.map((t) => (t.id === id ? { ...t, text: clean } : t)),
  );
}

export const removeTodo = (id: string) =>
  todoStore.set((list) => list.filter((t) => t.id !== id));

export const clearDone = () => todoStore.set((list) => list.filter((t) => !t.done));

/** Open tasks in the order they were added, then finished ones, newest first. */
export function sortTodos(list: Todo[]) {
  const open = list.filter((t) => !t.done);
  const done = list
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  return [...open, ...done];
}
