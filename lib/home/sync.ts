"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { SimplePool } from "nostr-tools/pool";
import type { Event } from "nostr-tools/pure";
import { gardenStore, mergeXpElsewhere, totalXp } from "./garden";
import { createPersistentStore, useStore } from "./store";
import {
  applyTodoSnapshot,
  deletedStore,
  mergeTodos,
  todoSnapshot,
  todoStore,
  type Todo,
  type TodoSnapshot,
} from "./todos";

/**
 * Keeps the task list, and the garden's level, the same on every device that
 * shares a sync code, with no account and no server of our own.
 *
 * The code is the only secret. A Nostr key is derived from it, and the list
 * is kept on a few public Nostr relays as that key's one replaceable "app
 * data" note, encrypted to itself (NIP-44), so the relays only ever hold
 * ciphertext. Each device merges whatever it reads into its own copy and
 * writes back the merge when that adds anything, so devices need not be
 * open at the same time. Relays promise nothing about keeping data, but
 * every device holds the whole list, and any of them puts it back.
 *
 * The level travels as each device's own XP, by device id. A device's figure
 * only grows, so merging keeps the larger, and the level counts them all:
 * nothing is lost or counted twice when two devices earn at once. Drops,
 * plants and upgrades stay on each device; a shared purse can't be merged.
 */

const RELAYS = [
  "wss://nos.lol",
  "wss://relay.primal.net",
  "wss://relay.snort.social",
  "wss://nostr.mom",
  "wss://offchain.pub",
];

/** NIP-78 app data: a replaceable note per key and "d" tag. */
const KIND = 30078;
const D_TAG = "tom-home-todos";
const KEY_SALT = "tom-home-todos:v1:";

interface SyncState {
  code: string | null;
}

export const syncStore = createPersistentStore<SyncState>("home:sync:v1", { code: null });
export const useSync = () => useStore(syncStore);

/* Status lives in memory: it describes this page's connection. */
export type SyncStatus = "off" | "connecting" | "synced" | "offline";
let status: { state: SyncStatus; at: number } = { state: "off", at: 0 };
const statusListeners = new Set<() => void>();
const setStatus = (state: SyncStatus) => {
  status = { state, at: state === "synced" ? Date.now() : status.at };
  statusListeners.forEach((l) => l());
};
const subscribeStatus = (l: () => void) => {
  statusListeners.add(l);
  return () => statusListeners.delete(l);
};
const OFF = { state: "off" as SyncStatus, at: 0 };
export const useSyncStatus = () => useSyncExternalStore(subscribeStatus, () => status, () => OFF);

/* Codes: 20 characters from an alphabet without look-alikes, about 100 bits,
   shown in groups of four. */
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";
const CODE_LENGTH = 20;

export const normaliseCode = (raw: string) => raw.toLowerCase().replace(/[^a-z0-9]/g, "");
export const isValidCode = (code: string) =>
  code.length === CODE_LENGTH && [...code].every((c) => ALPHABET.includes(c));
export const formatCode = (code: string) => code.match(/.{1,4}/g)?.join("-") ?? code;

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  // 248 is the largest multiple of the alphabet's 31 letters under 256, so
  // dropping bytes above it keeps every letter equally likely.
  let code = "";
  while (code.length < CODE_LENGTH) {
    for (const b of bytes) if (b < 248 && code.length < CODE_LENGTH) code += ALPHABET[b % 31];
    crypto.getRandomValues(bytes);
  }
  return code;
}

export const startSync = () => syncStore.set({ code: newCode() });
export const joinSync = (code: string) => syncStore.set({ code });
export const stopSync = () => syncStore.set({ code: null });

/** The link another device opens, or scans, to join. */
export const syncLink = (code: string) => `${location.origin}/home#sync=${formatCode(code)}`;

/** Joins from a #sync= link, then takes the code out of the address bar. */
function joinFromHash() {
  const match = location.hash.match(/^#sync=([\w-]+)$/);
  if (!match) return;
  const code = normaliseCode(match[1]);
  if (isValidCode(code)) joinSync(code);
  history.replaceState(null, "", location.pathname + location.search);
}

/** This device's id, made once and kept, to file its XP under. */
function deviceId() {
  const KEY = "home:device:v1";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "this-device";
  }
}

/** What the synced note holds: the list, and each device's XP. */
interface Shared extends TodoSnapshot {
  xp: Record<string, number>;
}

const NO_TODOS: TodoSnapshot = { todos: [], deleted: {} };

/** Each device's XP, keys in order, so equal tables serialise equally. */
const sortedXp = (xp: Record<string, number>) =>
  Object.fromEntries(Object.entries(xp).sort(([a], [b]) => (a < b ? -1 : 1)));

/** This device's copy: its list, and every device's XP as far as it knows. */
function localShared(me: string): Shared {
  const g = gardenStore.get();
  return { ...mergeTodos(todoSnapshot(), NO_TODOS), xp: sortedXp({ ...g.xpElsewhere, [me]: g.xp }) };
}

/** The same copy always serialises the same way, so copies compare as text. */
const serialise = (s: Shared) =>
  JSON.stringify({ v: 1, todos: s.todos, deleted: s.deleted, xp: s.xp });

function parse(text: string): Shared | null {
  try {
    const raw = JSON.parse(text);
    if (raw?.v !== 1 || !Array.isArray(raw.todos) || typeof raw.deleted !== "object") return null;
    // Notes from before the level was synced have no XP table.
    const xp: Record<string, number> = {};
    for (const [device, value] of Object.entries(raw.xp ?? {})) {
      if (typeof value === "number" && Number.isFinite(value) && value > 0) xp[device] = value;
    }
    const todos = (raw.todos as Todo[]).filter((t) => typeof t?.id === "string" && typeof t.text === "string");
    return { todos, deleted: raw.deleted ?? {}, xp: sortedXp(xp) };
  } catch {
    return null;
  }
}

/**
 * The most text a note can hold. Relays refuse notes over 64 KiB, and NIP-44
 * pads what it encrypts up in steps, so this is the most that still pads,
 * encrypts and encodes to a note under that.
 */
const NOTE_MAX = 40_960;

/** Base64, in slices: spreading 40 KB into one call can overflow the stack. */
function toBase64(bytes: Uint8Array) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

/**
 * What goes inside the encryption: the copy, deflated where the browser can
 * (all current ones), since a full list of long tasks is otherwise too big
 * for the relays. Notes from before this are plain, and still read.
 */
async function pack(text: string) {
  if (typeof CompressionStream === "undefined") return text;
  const deflated = new Blob([text]).stream().pipeThrough(new CompressionStream("deflate-raw"));
  return JSON.stringify({ v: 2, z: toBase64(new Uint8Array(await new Response(deflated).arrayBuffer())) });
}

async function unpack(plain: string) {
  if (!plain.startsWith('{"v":2,')) return plain;
  const { z } = JSON.parse(plain) as { z: string };
  const bytes = Uint8Array.from(atob(z), (c) => c.charCodeAt(0));
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).text();
}

/**
 * The note's text, cut down if even deflated it's more than relays take:
 * first the oldest finished tasks, then the oldest deletions, then open tasks
 * from the bottom of the list. Only a list of a hundred tasks written in
 * emoji gets near it. What's cut stays on this device.
 */
async function fit(s: Shared) {
  const whole = await pack(serialise(s));
  if (whole.length <= NOTE_MAX) return whole;
  const byDone = (a: Todo, b: Todo) => (a.doneAt ?? 0) - (b.doneAt ?? 0);
  const cuts = [
    ...s.todos.filter((t) => t.done).sort(byDone).map((t) => ({ todo: t.id })),
    ...Object.entries(s.deleted)
      .sort(([, a], [, b]) => a - b)
      .map(([id]) => ({ deleted: id })),
    ...s.todos
      .filter((t) => !t.done)
      .reverse()
      .map((t) => ({ todo: t.id })),
  ];
  const cut = (n: number) => {
    const gone = new Set(cuts.slice(0, n).map((c) => ("todo" in c ? c.todo : `deleted:${c.deleted}`)));
    return pack(
      serialise({
        todos: s.todos.filter((t) => !gone.has(t.id)),
        deleted: Object.fromEntries(Object.entries(s.deleted).filter(([id]) => !gone.has(`deleted:${id}`))),
        xp: s.xp,
      }),
    );
  };
  // The fewest cuts that fit, found by halving.
  let lo = 1;
  let hi = cuts.length;
  let best = await cut(hi);
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    const text = await cut(mid);
    if (text.length <= NOTE_MAX) {
      hi = mid;
      best = text;
    } else lo = mid + 1;
  }
  return best;
}

/** Waits before starting afresh after a failure, longer each time. */
const BACKOFF_MS = [5_000, 15_000, 30_000, 60_000, 120_000];
/** Away this long and the sockets are likely dead: start afresh on return. */
const STALE_AFTER_MS = 30_000;

/** Runs something that may throw or reject, and ignores it if it does. */
function quietly(fn: () => unknown) {
  try {
    const result = fn();
    if (result instanceof Promise) result.catch(() => {});
  } catch {
    // Already closed or never opened: nothing to undo.
  }
}

/**
 * Connects and keeps connected until the returned function is called.
 *
 * Sockets close all the time: relays restart, phones drop them in the
 * background, laptops sleep. So nothing here assumes one stays open. Relays
 * are pinged, and once every relay has dropped the subscription, or a write
 * reaches none of them, it starts afresh after a wait that grows each time.
 * Starting afresh means a new pool: a socket that died while the page wasn't
 * looking is never written to again, only dropped.
 */
async function connect(code: string) {
  const [{ SimplePool: Pool }, { finalizeEvent, getPublicKey }, { v2: nip44 }] = await Promise.all([
    import("nostr-tools/pool"),
    import("nostr-tools/pure"),
    import("nostr-tools/nip44"),
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(KEY_SALT + code));
  const secret = new Uint8Array(digest);
  const pubkey = getPublicKey(secret);
  const key = nip44.utils.getConversationKey(secret, pubkey);
  const filter = { kinds: [KIND], authors: [pubkey], "#d": [D_TAG] };

  /**
   * nostr-tools only learns a socket has closed when its close event lands,
   * and can send in between, which the browser logs ("WebSocket is already
   * in CLOSING or CLOSED state") once per message. Those sends go nowhere
   * either way, so this drops them.
   *
   * It also closes from its error handler, and some WebSocket implementations
   * fire the error from inside close(), which would loop until the stack ran
   * out. Closing twice does nothing anyway, so the second close is skipped.
   */
  class QuietSocket extends WebSocket {
    private closing = false;
    override send(data: Parameters<WebSocket["send"]>[0]) {
      if (this.readyState === WebSocket.OPEN) super.send(data);
    }
    override close(code?: number, reason?: string) {
      if (this.closing) return;
      this.closing = true;
      super.close(code, reason);
    }
  }

  const me = deviceId();
  let pool: SimplePool | undefined;
  /** Bumped by every new subscription, so a closed one's callbacks are ignored. */
  let generation = 0;
  let closed = false;
  /** What the relays are known to hold, sent or read, to skip sending it back. */
  let remote = "";
  /** Newest note seen. A note older than the one a relay holds is ignored,
   *  so each write must be newer than that, whatever this clock says. */
  let lastCreated = 0;
  let caughtUp = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let failures = 0;
  let hiddenAt: number | null = document.hidden ? Date.now() : null;

  /** Tries again in a while. Hidden or offline, it waits for the page's
   *  return or the network's instead, which start afresh themselves. */
  const retryLater = () => {
    if (closed || retry || document.hidden || !navigator.onLine) return;
    const wait = BACKOFF_MS[Math.min(failures, BACKOFF_MS.length - 1)];
    failures += 1;
    retry = setTimeout(() => {
      retry = undefined;
      restart();
    }, wait);
  };

  const publish = async () => {
    if (closed || !pool) return;
    let text = "";
    try {
      const shared = localShared(me);
      text = serialise(shared);
      if (text === remote) return setStatus("synced");
      remote = text;
      const content = nip44.encrypt(await fit(shared), key);
      // Stopped while deflating: publishing now would open new sockets.
      if (closed) return;
      lastCreated = Math.max(Math.floor(Date.now() / 1000), lastCreated + 1);
      const event = finalizeEvent({ kind: KIND, created_at: lastCreated, tags: [["d", D_TAG]], content }, secret);
      const results = await Promise.allSettled(pool.publish(RELAYS, event));
      if (closed) return;
      if (results.some((r) => r.status === "fulfilled")) {
        failures = 0;
        return setStatus("synced");
      }
    } catch {
      // Couldn't encrypt or send: treated as no relay taking it.
    }
    if (closed) return;
    // Not sent: send it on the next change, or when this starts afresh.
    if (remote === text) remote = "";
    setStatus("offline");
    retryLater();
  };

  const schedule = () => {
    if (!caughtUp || closed) return;
    clearTimeout(timer);
    timer = setTimeout(publish, 800);
  };

  const onEvent = async (event: Event) => {
    lastCreated = Math.max(lastCreated, event.created_at);
    failures = 0;
    try {
      const snapshot = parse(await unpack(nip44.decrypt(event.content, key)));
      if (!snapshot || closed) return;
      remote = serialise({ ...mergeTodos(snapshot, NO_TODOS), xp: snapshot.xp });
      // Applying the merges fires the store listeners, which write it back if
      // this copy added anything: a task, or XP the note didn't have.
      mergeXpElsewhere(snapshot.xp, me);
      applyTodoSnapshot(mergeTodos(todoSnapshot(), snapshot));
      if (caughtUp) setStatus("synced");
    } catch {
      // Not ours, or not readable: skip it.
    }
  };

  const listen = () => {
    const mine = ++generation;
    caughtUp = false;
    setStatus("connecting");
    pool?.subscribe(RELAYS, filter, {
      onevent: (event) => void onEvent(event),
      oneose: () => {
        if (mine !== generation) return;
        // A relay that couldn't be reached counts as done too; if none was,
        // there's nothing to catch up with, so try again later instead.
        if (![...(pool?.listConnectionStatus().values() ?? [])].some(Boolean)) {
          setStatus("offline");
          return retryLater();
        }
        caughtUp = true;
        // Nothing stored yet, or this device has news: write it.
        void publish();
      },
      // Every relay has dropped it: their sockets closed, or they refused.
      onclose: () => {
        if (mine !== generation || closed) return;
        setStatus("offline");
        retryLater();
      },
    });
  };

  const restart = () => {
    if (closed) return;
    clearTimeout(retry);
    retry = undefined;
    generation += 1;
    // Closing the pool closes its subscription and every socket with it.
    const old = pool;
    quietly(() => old?.destroy());
    pool = new Pool({ enablePing: true, websocketImplementation: QuietSocket } as ConstructorParameters<typeof Pool>[0]);
    listen();
  };

  // nostr-tools sends a subscription's request without waiting on it, so a
  // socket that closes in between rejects with nothing listening. Nothing is
  // lost (the subscription is closed and redone), so keep it out of the console.
  const onRejection = (e: PromiseRejectionEvent) => {
    if (e.reason instanceof Error && e.reason.name === "SendingOnClosedConnection") e.preventDefault();
  };
  window.addEventListener("unhandledrejection", onRejection);

  restart();
  const offTodos = todoStore.subscribe(schedule);
  const offDeleted = deletedStore.subscribe(schedule);
  // The garden changes every second as plants pay out; only XP is synced.
  let xpSeen = "";
  const offGarden = gardenStore.subscribe(() => {
    const g = gardenStore.get();
    const now = `${g.xp}:${totalXp(g)}`;
    if (now === xpSeen) return;
    xpSeen = now;
    schedule();
  });
  // Phones drop sockets in the background, often without a word: after a
  // while away, or if it was already failing, start afresh and catch up.
  const onVisibility = () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      return;
    }
    const away = hiddenAt === null ? 0 : Date.now() - hiddenAt;
    hiddenAt = null;
    if (away >= STALE_AFTER_MS || status.state === "offline") restart();
  };
  const onOffline = () => setStatus("offline");
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", restart);
  window.addEventListener("offline", onOffline);

  return () => {
    closed = true;
    generation += 1;
    clearTimeout(timer);
    clearTimeout(retry);
    quietly(() => pool?.destroy());
    offTodos();
    offDeleted();
    offGarden();
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", restart);
    window.removeEventListener("offline", onOffline);
    // Late rejections from the sockets just closed are still caught.
    setTimeout(() => window.removeEventListener("unhandledrejection", onRejection), 10_000);
    setStatus("off");
  };
}

/** Runs sync on /home while a code is set. */
export function useTodoSync() {
  const { code } = useSync();

  useEffect(joinFromHash, []);

  useEffect(() => {
    if (!code) return;
    let stop: (() => void) | undefined;
    let cancelled = false;
    connect(code).then(
      (close) => (cancelled ? close() : (stop = close)),
      () => setStatus("offline"),
    );
    return () => {
      cancelled = true;
      stop?.();
    };
  }, [code]);
}
