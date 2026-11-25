/**
 * The shape of one hobby's saved data, and the pure helpers both the server
 * and the page share. Nothing here touches storage or the DOM.
 */

import { hobbyById, type HobbyId } from "@/data/hobby/hobbies";

export const PROGRESS = ["Todo", "Progressing", "Done"] as const;
export type Progress = (typeof PROGRESS)[number];

/** How many tag colours there are; see .hb-tag-* in globals.css. */
export const TAG_COLOURS = 7;
export const MAX_FIELDS = 5;
export const MAX_TAGS = 24;

export const LIMITS = {
  title: 160,
  url: 2000,
  value: 2000,
  fieldName: 40,
  tagName: 40,
};

export interface Field {
  id: string;
  name: string;
}

export interface Tag {
  id: string;
  name: string;
  /** Index into the tag palette. Stored so a rename or reorder keeps it. */
  colour: number;
}

export interface Card {
  id: string;
  title: string;
  url: string;
  /** A preview image found on a non-YouTube page when the card was saved. */
  image?: string;
  tagIds: string[];
  progress: Progress;
  /** Values of the tab's extra fields, keyed by field id. */
  values: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  /** Soft delete: hidden from the site, kept in storage. */
  deletedAt?: string;
}

/** Which parts show on the grid. Set per tab, so every card lines up. */
export interface Show {
  thumb: boolean;
  title: boolean;
  tags: boolean;
  progress: boolean;
  /** Extra fields, by field id. */
  fields: Record<string, boolean>;
}

export interface HobbyDoc {
  version: 1;
  hobby: HobbyId;
  fields: Field[];
  tags: Tag[];
  show: Show;
  cards: Card[];
}

export const newId = (prefix: string) =>
  prefix +
  Array.from({ length: 8 }, () =>
    "abcdefghijkmnpqrstuvwxyz23456789".charAt(Math.floor(Math.random() * 32)),
  ).join("");

/** A tab nobody has saved yet: no cards or tags, the hobby's starting fields. */
export function emptyDoc(hobby: HobbyId): HobbyDoc {
  const names = hobbyById(hobby)?.startingFields ?? [];
  const fields = names.map((name, i) => ({ id: `f${i + 1}`, name }));
  return {
    version: 1,
    hobby,
    fields,
    tags: [],
    show: {
      thumb: true,
      title: true,
      tags: true,
      progress: true,
      // Only the first field fits on a card without crowding it.
      fields: Object.fromEntries(fields.map((f, i) => [f.id, i === 0])),
    },
    cards: [],
  };
}

/** What visitors get: deleted cards stripped out. */
export function publicDoc(doc: HobbyDoc): HobbyDoc {
  return { ...doc, cards: doc.cards.filter((c) => !c.deletedAt) };
}

/** The least-used tag colour, so a new tag stands apart from the rest. */
export function nextTagColour(tags: Tag[]): number {
  const used = Array.from({ length: TAG_COLOURS }, (_, i) =>
    tags.filter((t) => t.colour === i).length,
  );
  return used.indexOf(Math.min(...used));
}

export const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

// ---------------------------------------------------------------------------
// Search, filter, and sort
// ---------------------------------------------------------------------------

export const norm = (t: string) =>
  String(t || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

function lev(a: string, b: string) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

/**
 * Loose match. Every word of the query must match: as a substring, or within
 * 1 typo for words of 4 to 6 letters and 2 for 7 or more. Words under 4
 * letters must match exactly, or "a" would match everything.
 */
export function fuzzy(text: string, query: string) {
  const hay = norm(text);
  const words = hay.split(/[^a-z0-9]+/).filter(Boolean);
  return norm(query)
    .split(/\s+/)
    .filter(Boolean)
    .every((tok) => {
      if (hay.includes(tok)) return true;
      const tol = tok.length < 4 ? 0 : tok.length < 7 ? 1 : 2;
      if (!tol) return false;
      return words.some(
        (w) =>
          lev(w, tok) <= tol ||
          // A prefix of a longer word, so "shapeshif" finds "Shapeshifter".
          (w.length > tok.length && lev(w.slice(0, tok.length), tok) <= tol),
      );
    });
}

export const SORTS = {
  updated: "Last updated",
  added: "Date added",
  title: "Title",
  tags: "Tags",
  progress: "Progress",
} as const;
export type SortKey = keyof typeof SORTS;

/** Each sort's natural first direction: newest first for dates. */
export const DEFAULT_DIR: Record<SortKey, "asc" | "desc"> = {
  updated: "desc",
  added: "desc",
  title: "asc",
  tags: "asc",
  progress: "asc",
};

export interface Query {
  tag: string | null;
  q: string;
  mode: "title" | "all";
  sort: SortKey;
  dir: "asc" | "desc";
  progress: Progress[];
  field: string;
  contains: string;
}

const RANK: Record<Progress, number> = { Todo: 0, Progressing: 1, Done: 2 };

export const tagNames = (doc: HobbyDoc, card: Card) =>
  card.tagIds
    .map((id) => doc.tags.find((t) => t.id === id)?.name)
    .filter((n): n is string => !!n)
    .sort((a, b) => a.localeCompare(b));

export function runQuery(doc: HobbyDoc, query: Query): Card[] {
  const tag = query.tag
    ? doc.tags.find((t) => slug(t.name) === query.tag)
    : null;
  let list = doc.cards.filter((c) => !c.deletedAt);
  if (tag) list = list.filter((c) => c.tagIds.includes(tag.id));
  if (query.progress.length)
    list = list.filter((c) => query.progress.includes(c.progress));
  const contains = norm(query.contains.trim());
  if (contains) {
    list = list.filter((c) =>
      (query.field ? [c.values[query.field] ?? ""] : Object.values(c.values)).some(
        (v) => norm(v).includes(contains),
      ),
    );
  }
  if (query.q.trim()) {
    list = list.filter((c) =>
      fuzzy(
        query.mode === "title"
          ? c.title
          : [c.title, tagNames(doc, c).join(" "), c.progress, ...Object.values(c.values)].join(" "),
        query.q,
      ),
    );
  }
  const key = (c: Card): string | number => {
    switch (query.sort) {
      case "title":
        return norm(c.title);
      case "tags":
        return tagNames(doc, c).join(",").toLowerCase();
      case "progress":
        return RANK[c.progress];
      case "added":
        return c.createdAt;
      default:
        return c.updatedAt;
    }
  };
  return [...list].sort((a, b) => {
    const x = key(a);
    const y = key(b);
    const r = x < y ? -1 : x > y ? 1 : norm(a.title).localeCompare(norm(b.title));
    return query.dir === "asc" ? r : -r;
  });
}

// ---------------------------------------------------------------------------
// Links
// ---------------------------------------------------------------------------

export interface YouTube {
  id: string;
  start: number;
}

/** Seconds from a t= value: "90", "90s", or "1m30s". */
function seconds(t: string | null) {
  if (!t) return 0;
  if (/^\d+$/.test(t)) return Number(t);
  const m = /^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/.exec(t);
  return m ? Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) : 0;
}

export function youTube(raw: string): YouTube | null {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
  else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(url.pathname);
      if (m) id = m[1];
    }
  }
  if (!id || !/^[\w-]{6,20}$/.test(id)) return null;
  return { id, start: seconds(url.searchParams.get("t") ?? url.searchParams.get("start")) };
}

export const youTubeThumb = (id: string) =>
  `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

export const youTubeEmbed = ({ id, start }: YouTube) =>
  `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0${start ? `&start=${start}` : ""}`;

/** The picture for a card: YouTube's own thumbnail, or the page's preview. */
export function cardImage(card: Pick<Card, "url" | "image">): string | null {
  const yt = youTube(card.url);
  if (yt) return youTubeThumb(yt.id);
  return card.image || null;
}

export function shortUrl(raw: string) {
  try {
    const u = new URL(raw);
    const path = u.pathname === "/" ? "" : u.pathname;
    const s = u.hostname.replace(/^www\./, "") + path + (u.search ? "?…" : "");
    return s.length > 48 ? s.slice(0, 47) + "…" : s;
  } catch {
    return raw;
  }
}
