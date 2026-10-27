"use client";

import { createPersistentStore, useStore } from "./store";

/**
 * Quick links: up to ten buttons in a drawer, each opening a page in a new
 * tab. A link can have a key of up to three letters: typed anywhere on /home
 * (outside a text box), then Enter, it opens the link.
 *
 * They sync with the tasks, kept the same way: each link's newest edit wins,
 * and deletions are remembered so a copy that still has one doesn't bring
 * it back. A link whose address is too long to be worth the room in the
 * synced note stays on this device, and says so.
 */

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  /** Up to three letters or digits, lowercase; "" for none. */
  key: string;
  order: number;
  updatedAt: number;
}

export type DeletedLinks = Record<string, number>;

export const LINKS_MAX = 10;
export const LINK_KEY_MAX = 3;
export const LINK_LABEL_MAX = 24;
/** Longer addresses stay on this device. */
export const LINK_SYNC_MAX = 300;
/** The most a link can hold at all. */
const LINK_URL_MAX = 2000;

const isLink = (l: unknown): l is QuickLink => {
  const x = l as QuickLink;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.url === "string" &&
    typeof x.label === "string" &&
    typeof x.key === "string" &&
    typeof x.order === "number" &&
    typeof x.updatedAt === "number"
  );
};

export const linkStore = createPersistentStore<QuickLink[]>("home:links:v1", [], (raw) =>
  Array.isArray(raw) ? raw.filter(isLink) : [],
);

export const deletedLinkStore = createPersistentStore<DeletedLinks>("home:links:deleted:v1", {}, (raw) =>
  raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as DeletedLinks) : {},
);

export const useLinks = () => useStore(linkStore);

/** Whether a link is short enough to sync. */
export const linkSyncs = (l: Pick<QuickLink, "url">) => l.url.length <= LINK_SYNC_MAX;

/** A key as stored: lowercase letters and digits, three at most. */
export const cleanKey = (raw: string) =>
  raw
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, LINK_KEY_MAX);

/**
 * An address as typed, made openable: a scheme added if it has none, and
 * only web and mail links let through, so a synced note can't plant a
 * script. Null if it isn't one.
 */
export function cleanUrl(raw: string) {
  const text = raw.trim().slice(0, LINK_URL_MAX);
  if (!text) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(text) ? text : `https://${text}`;
  try {
    const url = new URL(withScheme);
    if (!["http:", "https:", "mailto:"].includes(url.protocol)) return null;
    if (url.protocol !== "mailto:" && !url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.href;
  } catch {
    return null;
  }
}

/** What a link shows: its label, else the site's name. */
export function linkName(l: Pick<QuickLink, "label" | "url">) {
  if (l.label.trim()) return l.label.trim();
  try {
    const url = new URL(l.url);
    return url.protocol === "mailto:" ? url.pathname : url.hostname.replace(/^www\./, "");
  } catch {
    return l.url;
  }
}

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** Links in their set order. */
export const sortLinks = (list: QuickLink[]) =>
  [...list].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));

export type LinkDraft = Pick<QuickLink, "label" | "url" | "key">;

/** Adds or edits a link; returns why not, if it can't. */
export function saveLink(draft: LinkDraft, id?: string): string | null {
  const url = cleanUrl(draft.url);
  if (!url) return "that doesn't look like a web address";
  const key = cleanKey(draft.key);
  const list = linkStore.get();
  if (key && list.some((l) => l.key === key && l.id !== id)) return `"${key}" is already in use`;
  const label = draft.label.trim().slice(0, LINK_LABEL_MAX);
  const now = Date.now();
  if (id) {
    linkStore.set((all) => all.map((l) => (l.id === id ? { ...l, label, url, key, updatedAt: now } : l)));
    return null;
  }
  if (list.length >= LINKS_MAX) return `${LINKS_MAX} links at most`;
  linkStore.set((all) => [
    ...all,
    { id: newId(), label, url, key, order: all.reduce((max, l) => Math.max(max, l.order + 1), 0), updatedAt: now },
  ]);
  return null;
}

export function removeLink(id: string) {
  deletedLinkStore.set((d) => ({ ...d, [id]: Date.now() }));
  linkStore.set((list) => list.filter((l) => l.id !== id));
}

/** Moves a link one place up or down. */
export function moveLink(id: string, by: -1 | 1) {
  const ids = sortLinks(linkStore.get()).map((l) => l.id);
  const from = ids.indexOf(id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  const now = Date.now();
  linkStore.set((list) =>
    list.map((l) => {
      const order = ids.indexOf(l.id);
      return order === l.order ? l : { ...l, order, updatedAt: now };
    }),
  );
}

/** The link a typed key opens, if any. */
export const linkForKey = (key: string) => (key ? linkStore.get().find((l) => l.key === key) : undefined);

export interface LinkSnapshot {
  links: QuickLink[];
  deleted: DeletedLinks;
}

const DELETED_DAYS = 60;

/** Two copies made one: newest edit wins, a deletion wins over older edits. */
export function mergeLinks(a: LinkSnapshot, b: LinkSnapshot): LinkSnapshot {
  const cutoff = Date.now() - DELETED_DAYS * 86_400_000;
  const deleted: DeletedLinks = {};
  for (const [id, at] of [...Object.entries(a.deleted), ...Object.entries(b.deleted)]) {
    if (at > cutoff && at > (deleted[id] ?? 0)) deleted[id] = at;
  }
  const byId = new Map<string, QuickLink>();
  for (const l of [...a.links, ...b.links]) {
    const other = byId.get(l.id);
    if (!other || l.updatedAt > other.updatedAt) byId.set(l.id, l);
  }
  const links = sortLinks([...byId.values()].filter((l) => !(deleted[l.id] >= l.updatedAt)));
  return { links, deleted: Object.fromEntries(Object.entries(deleted).sort(([x], [y]) => (x < y ? -1 : 1))) };
}

export const linkSnapshot = (): LinkSnapshot => ({ links: linkStore.get(), deleted: deletedLinkStore.get() });

/** What goes in the synced note: only links short enough to sync. */
export const syncedLinks = (s: LinkSnapshot): LinkSnapshot => ({
  links: s.links.filter(linkSyncs),
  deleted: s.deleted,
});

export function parseLinks(raw: unknown, rawDeleted: unknown): LinkSnapshot {
  const links = Array.isArray(raw) ? raw.filter(isLink).map((l) => ({ ...l, key: cleanKey(l.key) })) : [];
  const deleted: DeletedLinks = {};
  if (rawDeleted && typeof rawDeleted === "object") {
    for (const [id, at] of Object.entries(rawDeleted)) if (typeof at === "number") deleted[id] = at;
  }
  // Only addresses that would have been allowed here.
  return { links: links.filter((l) => cleanUrl(l.url) === l.url), deleted };
}

/** Replaces the local links with a merged copy, touching only what changed. */
export function applyLinkSnapshot(next: LinkSnapshot) {
  if (JSON.stringify(next.deleted) !== JSON.stringify(deletedLinkStore.get())) deletedLinkStore.set(next.deleted);
  if (JSON.stringify(next.links) !== JSON.stringify(linkStore.get())) linkStore.set(next.links);
}
