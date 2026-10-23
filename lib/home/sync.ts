"use client";

import { useEffect, useSyncExternalStore } from "react";
import type { Event } from "nostr-tools/pure";
import { createPersistentStore, useStore } from "./store";
import {
  applyTodoSnapshot,
  deletedStore,
  mergeTodos,
  todoSnapshot,
  todoStore,
  type TodoSnapshot,
} from "./todos";

/**
 * Keeps the task list the same on every device that shares a sync code,
 * with no account and no server of our own.
 *
 * The code is the only secret. A Nostr key is derived from it, and the list
 * is kept on a few public Nostr relays as that key's one replaceable "app
 * data" note, encrypted to itself (NIP-44), so the relays only ever hold
 * ciphertext. Each device merges whatever it reads into its own copy and
 * writes back the merge when that adds anything, so devices need not be
 * open at the same time. Relays promise nothing about keeping data, but
 * every device holds the whole list, and any of them puts it back.
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

/** The same list always serialises the same way, so copies compare as text. */
const serialise = (s: TodoSnapshot) => JSON.stringify({ v: 1, todos: s.todos, deleted: s.deleted });

function parse(text: string): TodoSnapshot | null {
  try {
    const raw = JSON.parse(text);
    if (raw?.v !== 1 || !Array.isArray(raw.todos) || typeof raw.deleted !== "object") return null;
    return { todos: raw.todos, deleted: raw.deleted ?? {} };
  } catch {
    return null;
  }
}

async function connect(code: string) {
  const [{ SimplePool }, { finalizeEvent, getPublicKey }, { v2: nip44 }] = await Promise.all([
    import("nostr-tools/pool"),
    import("nostr-tools/pure"),
    import("nostr-tools/nip44"),
  ]);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(KEY_SALT + code));
  const secret = new Uint8Array(digest);
  const pubkey = getPublicKey(secret);
  const key = nip44.utils.getConversationKey(secret, pubkey);

  const pool = new SimplePool();
  /** What the relays are known to hold, sent or read, to skip sending it back. */
  let remote = "";
  /** Newest note seen. A note older than the one a relay holds is ignored,
   *  so each write must be newer than that, whatever this clock says. */
  let lastCreated = 0;
  let caughtUp = false;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const publish = async () => {
    const merged = mergeTodos(todoSnapshot(), { todos: [], deleted: {} });
    const text = serialise(merged);
    if (text === remote) return setStatus("synced");
    remote = text;
    lastCreated = Math.max(Math.floor(Date.now() / 1000), lastCreated + 1);
    const event = finalizeEvent(
      { kind: KIND, created_at: lastCreated, tags: [["d", D_TAG]], content: nip44.encrypt(text, key) },
      secret,
    );
    const results = await Promise.allSettled(pool.publish(RELAYS, event));
    if (results.some((r) => r.status === "fulfilled")) setStatus("synced");
    else {
      // Try again on the next change or reconnect.
      remote = "";
      setStatus("offline");
    }
  };

  const schedule = () => {
    if (!caughtUp) return;
    clearTimeout(timer);
    timer = setTimeout(publish, 800);
  };

  const onEvent = (event: Event) => {
    lastCreated = Math.max(lastCreated, event.created_at);
    let snapshot: TodoSnapshot | null = null;
    try {
      snapshot = parse(nip44.decrypt(event.content, key));
    } catch {
      return;
    }
    if (!snapshot) return;
    remote = serialise(mergeTodos(snapshot, { todos: [], deleted: {} }));
    // Applying the merge fires the store listeners, which write it back if
    // this copy added anything.
    applyTodoSnapshot(mergeTodos(todoSnapshot(), snapshot));
    if (caughtUp) setStatus("synced");
  };

  let sub: { close: () => void } | undefined;
  const listen = () => {
    sub?.close();
    caughtUp = false;
    setStatus("connecting");
    sub = pool.subscribe(
      RELAYS,
      { kinds: [KIND], authors: [pubkey], "#d": [D_TAG] },
      {
        onevent: onEvent,
        oneose: () => {
          caughtUp = true;
          // Nothing stored yet, or this device has news: write it.
          publish();
        },
      },
    );
  };

  listen();
  const offTodos = todoStore.subscribe(schedule);
  const offDeleted = deletedStore.subscribe(schedule);
  // Phones drop sockets in the background; catch up on return.
  const onVisible = () => !document.hidden && listen();
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("online", listen);

  return () => {
    clearTimeout(timer);
    sub?.close();
    offTodos();
    offDeleted();
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("online", listen);
    pool.destroy();
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
