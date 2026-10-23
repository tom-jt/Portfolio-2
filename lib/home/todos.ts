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
  /** Last change, so a synced copy can tell which edit is newer. */
  updatedAt: number;
  /** Place in the list. Kept on the task rather than implied by the array so
   *  two devices' lists can be merged. */
  order: number;
}

/** Ids of deleted tasks and when they went, so a synced copy that still has
 *  them does not bring them back. */
export type Deleted = Record<string, number>;

export const TODO_MAX_LENGTH = 140;
export const TODO_MAX_ITEMS = 100;

/** Lists saved before sync had neither field: the array order was the order. */
const reviveTodos = (raw: unknown): Todo[] =>
  Array.isArray(raw)
    ? (raw as Todo[]).map((t, i) => ({
        ...t,
        updatedAt: t.updatedAt ?? t.createdAt,
        order: t.order ?? i,
      }))
    : [];

export const todoStore = createPersistentStore<Todo[]>("home:todos:v1", [], reviveTodos);

export const deletedStore = createPersistentStore<Deleted>(
  "home:todos:deleted:v1",
  {},
  (raw) => (raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Deleted) : {}),
);

export const useTodos = () => useStore(todoStore);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export function addTodo(text: string) {
  const clean = text.trim().slice(0, TODO_MAX_LENGTH);
  if (!clean || todoStore.get().length >= TODO_MAX_ITEMS) return false;
  const now = Date.now();
  todoStore.set((list) => [
    ...list,
    {
      id: newId(),
      text: clean,
      done: false,
      createdAt: now,
      doneAt: null,
      rewarded: false,
      updatedAt: now,
      order: list.reduce((max, t) => Math.max(max, t.order + 1), 0),
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
            updatedAt: Date.now(),
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
    list.map((t) => (t.id === id ? { ...t, text: clean, updatedAt: Date.now() } : t)),
  );
}

function remove(gone: (t: Todo) => boolean) {
  const ids = todoStore.get().filter(gone).map((t) => t.id);
  if (!ids.length) return;
  const now = Date.now();
  deletedStore.set((d) => ({ ...d, ...Object.fromEntries(ids.map((id) => [id, now])) }));
  todoStore.set((list) => list.filter((t) => !ids.includes(t.id)));
}

export const removeTodo = (id: string) => remove((t) => t.id === id);

export const clearDone = () => remove((t) => t.done);

/**
 * Sets the order of the open tasks. The list's own order is the task order;
 * finished tasks keep their places after the open ones.
 */
export function reorderOpen(ids: string[]) {
  todoStore.set((list) => {
    const byId = new Map(list.map((t) => [t.id, t]));
    const open = ids.map((id) => byId.get(id)).filter((t): t is Todo => !!t && !t.done);
    const moved = new Set(open.map((t) => t.id));
    // Anything open but missing from `ids` (added in another tab) stays, at the end.
    const rest = list.filter((t) => !moved.has(t.id));
    const now = Date.now();
    return [...open, ...rest].map((t, order) =>
      t.order === order ? t : { ...t, order, updatedAt: now },
    );
  });
}

/** Moves an open task one place up or down, for keyboard reordering. */
export function moveTodo(id: string, by: -1 | 1) {
  const open = todoStore.get().filter((t) => !t.done);
  const from = open.findIndex((t) => t.id === id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= open.length) return;
  const ids = open.map((t) => t.id);
  [ids[from], ids[to]] = [ids[to], ids[from]];
  reorderOpen(ids);
}

/** Open tasks in their set order, then finished ones, newest first. */
export function sortTodos(list: Todo[]) {
  const open = list.filter((t) => !t.done);
  const done = list
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  return [...open, ...done];
}

export interface TodoSnapshot {
  todos: Todo[];
  deleted: Deleted;
}

/** Deletions are remembered this long, long enough for every device to
 *  have heard of them, and at most this many, to keep the synced copy small. */
const DELETED_DAYS = 60;
const DELETED_MAX = 300;

/**
 * Two copies of the list made one: each task's newest edit wins, deletions
 * win over any edit made before them, and a reward paid on either copy
 * counts as paid on both, so a task never pays twice.
 */
export function mergeTodos(a: TodoSnapshot, b: TodoSnapshot): TodoSnapshot {
  const cutoff = Date.now() - DELETED_DAYS * 86_400_000;
  const deleted: Deleted = {};
  for (const [id, at] of [...Object.entries(a.deleted), ...Object.entries(b.deleted)]) {
    if (at > cutoff && at > (deleted[id] ?? 0)) deleted[id] = at;
  }
  const newest = Object.entries(deleted)
    .sort(([x, p], [y, q]) => q - p || (x < y ? -1 : 1))
    .slice(0, DELETED_MAX);

  const byId = new Map<string, Todo>();
  for (const t of [...a.todos, ...b.todos]) {
    const other = byId.get(t.id);
    if (!other) byId.set(t.id, t);
    else {
      const winner = t.updatedAt > other.updatedAt ? t : other;
      byId.set(t.id, { ...winner, rewarded: t.rewarded || other.rewarded });
    }
  }
  const todos = [...byId.values()]
    .filter((t) => !(deleted[t.id] >= t.updatedAt))
    .sort((x, y) => x.order - y.order || x.createdAt - y.createdAt || (x.id < y.id ? -1 : 1));

  return { todos, deleted: Object.fromEntries(newest.sort(([x], [y]) => (x < y ? -1 : 1))) };
}

export const todoSnapshot = (): TodoSnapshot => ({
  todos: todoStore.get(),
  deleted: deletedStore.get(),
});

/** Replaces the local list with a merged one, touching only what changed. */
export function applyTodoSnapshot(next: TodoSnapshot) {
  if (JSON.stringify(next.deleted) !== JSON.stringify(deletedStore.get())) deletedStore.set(next.deleted);
  if (JSON.stringify(next.todos) !== JSON.stringify(todoStore.get())) todoStore.set(next.todos);
}
