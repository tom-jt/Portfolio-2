"use client";

import { createPersistentStore, useStore } from "./store";

/**
 * Quick links: up to ten buttons in a drawer, each opening a page in a new
 * tab. A link can have a key of up to three letters: typed anywhere on /home
 * (outside a text box), then Enter, it opens the link.
 *
 * There can be up to three sets of them, in named tabs (work, personal, a
 * phone's own...), one showing at a time. Which one is this device's own
 * choice; the tabs themselves sync. A new tab starts as a copy of the one
 * showing, to change from there. Keys belong to their tab, so a copy can keep
 * them.
 *
 * They sync with the tasks, kept the same way: each link's and tab's newest
 * edit wins, and deletions are remembered so a copy that still has one
 * doesn't bring it back. A link whose address is too long to be worth the
 * room in the synced note stays on this device, and says so.
 */

export interface QuickLink {
  id: string;
  label: string;
  url: string;
  /** Up to three letters or digits, lowercase; "" for none. */
  key: string;
  order: number;
  updatedAt: number;
  /** The tab it's in; none for links from before there were tabs, which
   *  are in the first. */
  tab?: string;
}

export interface LinkTab {
  id: string;
  name: string;
  order: number;
  updatedAt: number;
}

/** Links' and tabs' ids, and when they were deleted. */
export type DeletedLinks = Record<string, number>;

export const LINKS_MAX = 10;
export const LINK_TABS_MAX = 3;
export const LINK_TAB_NAME_MAX = 16;
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
    typeof x.updatedAt === "number" &&
    (x.tab === undefined || typeof x.tab === "string")
  );
};

const isTab = (t: unknown): t is LinkTab => {
  const x = t as LinkTab;
  return (
    !!x &&
    typeof x.id === "string" &&
    typeof x.name === "string" &&
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

/** The tabs made. None until a second is: until then there's just FIRST_TAB. */
export const linkTabStore = createPersistentStore<LinkTab[]>("home:links:tabs:v1", [], (raw) =>
  Array.isArray(raw) ? raw.filter(isTab) : [],
);

/** The tab this device shows. Not synced: a phone and a laptop can each
 *  show their own. */
const shownTabStore = createPersistentStore<string>("home:links:shown:v1", "", (raw) =>
  typeof raw === "string" ? raw : "",
);

/** The tab there always is, until it's renamed or removed: the one links
 *  from before tabs are in. */
const FIRST_TAB: LinkTab = { id: "main", name: "main", order: 0, updatedAt: 0 };

/** Tabs in their set order. */
const sortTabs = (tabs: LinkTab[]) => [...tabs].sort((a, b) => a.order - b.order || (a.id < b.id ? -1 : 1));

/** The tabs as shown: those made, in order, else the first. */
const tabsOf = (made: LinkTab[]) => (made.length ? sortTabs(made) : [FIRST_TAB]);

/** The tab showing, out of `tabs`: the one picked, else the first. */
const shownOf = (tabs: LinkTab[], picked: string) => (tabs.some((t) => t.id === picked) ? picked : tabs[0].id);

/** A tab's links. A link whose tab is gone (removed on another device, say)
 *  shows in the first, rather than nowhere. */
const linksOf = (all: QuickLink[], tabs: LinkTab[], tab: string) =>
  sortLinks(
    all.filter((l) => {
      const own = l.tab ?? FIRST_TAB.id;
      return (tabs.some((t) => t.id === own) ? own : tabs[0].id) === tab;
    }),
  );

/** The tabs, the one showing, and its links, right now. */
function current() {
  const tabs = tabsOf(linkTabStore.get());
  const shown = shownOf(tabs, shownTabStore.get());
  return { tabs, shown, links: linksOf(linkStore.get(), tabs, shown) };
}

/** The tabs, the one showing, and its links, in order. */
export function useLinks() {
  const tabs = tabsOf(useStore(linkTabStore));
  const shown = shownOf(tabs, useStore(shownTabStore));
  return { tabs, shown, links: linksOf(useStore(linkStore), tabs, shown) };
}

/** The showing tab's links, in order. */
export const shownLinks = () => current().links;

export const showTab = (id: string) => shownTabStore.set(id);

/** Shows the `n`th tab, counting from one, if there's more than one tab and
 *  that many; returns whether it did. Pressing 1, 2, or 3 does this. */
export function showTabAt(n: number) {
  const { tabs } = current();
  if (tabs.length < 2 || n < 1 || n > tabs.length) return false;
  shownTabStore.set(tabs[n - 1].id);
  return true;
}

/** A tab's name as shown. */
export const tabName = (t: LinkTab) => t.name.trim() || "untitled";

/**
 * A new tab, after the others, holding a copy of the links in the one
 * showing, and shown. Returns its id, or null if there are as many as there
 * can be.
 */
export function addTab(): string | null {
  const { tabs, links } = current();
  if (tabs.length >= LINK_TABS_MAX) return null;
  const now = Date.now();
  const id = newId();
  const order = tabs.reduce((max, t) => Math.max(max, t.order + 1), 0);
  // The first tab, only implied until now, is made real alongside.
  linkTabStore.set((made) => [...(made.length ? made : [FIRST_TAB]), { id, name: `tab ${tabs.length + 1}`, order, updatedAt: now }]);
  linkStore.set((all) => [...all, ...links.map((l) => ({ ...l, id: newId(), tab: id, updatedAt: now }))]);
  shownTabStore.set(id);
  return id;
}

export function renameTab(id: string, name: string) {
  const clean = name.trim().slice(0, LINK_TAB_NAME_MAX);
  if (!clean) return;
  const now = Date.now();
  linkTabStore.set((made) =>
    (made.length ? made : [FIRST_TAB]).map((t) => (t.id === id ? { ...t, name: clean, updatedAt: now } : t)),
  );
}

/** Removes a tab and its links, unless it's the only one. */
export function removeTab(id: string) {
  const { tabs } = current();
  if (tabs.length < 2) return;
  const gone = linksOf(linkStore.get(), tabs, id).map((l) => l.id);
  const now = Date.now();
  deletedLinkStore.set((d) => ({ ...d, [id]: now, ...Object.fromEntries(gone.map((l) => [l, now])) }));
  linkStore.set((all) => all.filter((l) => !gone.includes(l.id)));
  linkTabStore.set((made) => made.filter((t) => t.id !== id));
  if (shownTabStore.get() === id) {
    const i = tabs.findIndex((t) => t.id === id);
    shownTabStore.set(tabs[i === 0 ? 1 : i - 1].id);
  }
}

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

/** Adds a link to the tab showing, or edits one; returns why not, if it
 *  can't. */
export function saveLink(draft: LinkDraft, id?: string): string | null {
  const url = cleanUrl(draft.url);
  if (!url) return "that doesn't look like a web address";
  const key = cleanKey(draft.key);
  const { shown, links } = current();
  if (/^[1-3]/.test(key)) return `keys can't start with 1, 2, or 3: those switch tabs`;
  if (key && links.some((l) => l.key === key && l.id !== id)) return `"${key}" is already in use`;
  const label = draft.label.trim().slice(0, LINK_LABEL_MAX);
  const now = Date.now();
  if (id) {
    linkStore.set((all) => all.map((l) => (l.id === id ? { ...l, label, url, key, updatedAt: now } : l)));
    return null;
  }
  if (links.length >= LINKS_MAX) return `${LINKS_MAX} links at most`;
  const order = links.reduce((max, l) => Math.max(max, l.order + 1), 0);
  linkStore.set((all) => [...all, { id: newId(), label, url, key, order, updatedAt: now, tab: shown }]);
  return null;
}

export function removeLink(id: string) {
  deletedLinkStore.set((d) => ({ ...d, [id]: Date.now() }));
  linkStore.set((list) => list.filter((l) => l.id !== id));
}

/** Moves a link one place up or down in its tab. */
export function moveLink(id: string, by: -1 | 1) {
  const ids = shownLinks().map((l) => l.id);
  const from = ids.indexOf(id);
  const to = from + by;
  if (from < 0 || to < 0 || to >= ids.length) return;
  [ids[from], ids[to]] = [ids[to], ids[from]];
  const now = Date.now();
  linkStore.set((list) =>
    list.map((l) => {
      const order = ids.indexOf(l.id);
      return order < 0 || order === l.order ? l : { ...l, order, updatedAt: now };
    }),
  );
}

/** The link a typed key opens in the tab showing, if any. */
export const linkForKey = (key: string) => (key ? shownLinks().find((l) => l.key === key) : undefined);

export interface LinkSnapshot {
  links: QuickLink[];
  tabs: LinkTab[];
  deleted: DeletedLinks;
}

/** Copies of things with ids made one: the newest edit of each, unless
 *  deleted since. */
function newest<T extends { id: string; updatedAt: number }>(a: T[], b: T[], deleted: DeletedLinks) {
  const byId = new Map<string, T>();
  for (const x of [...a, ...b]) {
    const other = byId.get(x.id);
    if (!other || x.updatedAt > other.updatedAt) byId.set(x.id, x);
  }
  return [...byId.values()].filter((x) => !(deleted[x.id] >= x.updatedAt));
}

const DELETED_DAYS = 60;

/** Two copies made one: newest edit wins, a deletion wins over older edits. */
export function mergeLinks(a: LinkSnapshot, b: LinkSnapshot): LinkSnapshot {
  const cutoff = Date.now() - DELETED_DAYS * 86_400_000;
  const deleted: DeletedLinks = {};
  for (const [id, at] of [...Object.entries(a.deleted), ...Object.entries(b.deleted)]) {
    if (at > cutoff && at > (deleted[id] ?? 0)) deleted[id] = at;
  }
  return {
    links: sortLinks(newest(a.links, b.links, deleted)),
    tabs: sortTabs(newest(a.tabs, b.tabs, deleted)),
    deleted: Object.fromEntries(Object.entries(deleted).sort(([x], [y]) => (x < y ? -1 : 1))),
  };
}

export const linkSnapshot = (): LinkSnapshot => ({
  links: linkStore.get(),
  tabs: linkTabStore.get(),
  deleted: deletedLinkStore.get(),
});

/** What goes in the synced note: only links short enough to sync. */
export const syncedLinks = (s: LinkSnapshot): LinkSnapshot => ({ ...s, links: s.links.filter(linkSyncs) });

export function parseLinks(raw: unknown, rawDeleted: unknown, rawTabs: unknown): LinkSnapshot {
  const links = Array.isArray(raw) ? raw.filter(isLink).map((l) => ({ ...l, key: cleanKey(l.key) })) : [];
  // Notes from before tabs have none.
  const tabs = Array.isArray(rawTabs)
    ? rawTabs
        .filter(isTab)
        .slice(0, LINK_TABS_MAX)
        .map((t) => ({ ...t, name: t.name.slice(0, LINK_TAB_NAME_MAX) }))
    : [];
  const deleted: DeletedLinks = {};
  if (rawDeleted && typeof rawDeleted === "object") {
    for (const [id, at] of Object.entries(rawDeleted)) if (typeof at === "number") deleted[id] = at;
  }
  // Only addresses that would have been allowed here.
  return { links: links.filter((l) => cleanUrl(l.url) === l.url), tabs, deleted };
}

/** Replaces the local links with a merged copy, touching only what changed. */
export function applyLinkSnapshot(next: LinkSnapshot) {
  if (JSON.stringify(next.deleted) !== JSON.stringify(deletedLinkStore.get())) deletedLinkStore.set(next.deleted);
  if (JSON.stringify(next.tabs) !== JSON.stringify(linkTabStore.get())) linkTabStore.set(next.tabs);
  if (JSON.stringify(next.links) !== JSON.stringify(linkStore.get())) linkStore.set(next.links);
}
