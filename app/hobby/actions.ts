"use server";

/**
 * Every admin write for /hobby. Each one checks the session, reads the file
 * fresh, applies one change, and saves it as one commit whose message names
 * what changed, so the git history doubles as the audit log.
 */

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { hobbyById, DEFAULT_HOBBY, type HobbyId } from "@/data/hobby/hobbies";
import {
  checkPassword,
  endSession,
  isAdmin,
  overLimit,
  requestInfo,
  startSession,
  authConfigured,
} from "@/lib/hobby/auth";
import { hobbyTag } from "@/lib/hobby/data";
import {
  LIMITS,
  MAX_FIELDS,
  MAX_TAGS,
  PROGRESS,
  newId,
  nextTagColour,
  publicDoc,
  youTube,
  type Card,
  type HobbyDoc,
  type Progress,
  type Show,
} from "@/lib/hobby/model";
import { readStored, StorageError, writeStored } from "@/lib/hobby/storage";

export type ActionResult = { ok: true; doc: HobbyDoc; cardId?: string } | { ok: false; error: string };

class Invalid extends Error {}

interface Change {
  doc: HobbyDoc;
  /** First line of the commit, e.g. "card edited: Sybil Cut". */
  summary: string;
  /** Dotted action name for the trailer, e.g. "card.edit". */
  action: string;
  /** Further changes made in the same save, one per line. */
  details?: string[];
  cardId?: string;
}

const deletes: number[] = [];

async function commit(hobbyRaw: string, apply: (doc: HobbyDoc, now: string) => Change | Promise<Change>): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: "You're signed out. Sign in again to save." };
  const hobby = hobbyById(hobbyRaw)?.id;
  if (!hobby) return { ok: false, error: "That hobby doesn't exist." };
  const { ip, agent } = await requestInfo();
  if (overLimit(`write:${ip}`, 60, 60_000)) {
    return { ok: false, error: "That's a lot of saves at once. Wait a minute and try again." };
  }

  try {
    const { doc, sha } = await readStored(hobby);
    const change = await apply(structuredClone(doc), new Date().toISOString());
    const message = [
      change.summary,
      ...(change.details?.length ? ["", ...change.details.map((d) => `- ${d}`)] : []),
      "",
      `Action: ${change.action}`,
      `Hobby: ${hobby}`,
      ...(change.cardId ? [`Card: ${change.cardId}`] : []),
      `IP: ${ip}`,
      `User-Agent: ${agent}`,
    ].join("\n");
    await writeStored(hobby, change.doc, sha, message);
    updateTag(hobbyTag(hobby));
    return { ok: true, doc: publicDoc(change.doc), cardId: change.cardId };
  } catch (e) {
    if (e instanceof Invalid || e instanceof StorageError) return { ok: false, error: e.message };
    console.error("[hobby] save failed", e);
    return { ok: false, error: "Couldn't save. Try again in a moment." };
  }
}

const clean = (s: unknown, max: number) => (typeof s === "string" ? s.trim().slice(0, max) : "");

function needCard(doc: HobbyDoc, id: string): Card {
  const card = doc.cards.find((c) => c.id === id && !c.deletedAt);
  if (!card) throw new Invalid("That card no longer exists. Reload to see the latest.");
  return card;
}

// ---------------------------------------------------------------------------
// Link previews
// ---------------------------------------------------------------------------

/** Only public web pages: no local or private network addresses. */
function publicHttpUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const host = url.hostname;
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^(127|10|0)\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
      /^169\.254\./.test(host) ||
      host.includes(":")
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();

/** A page's title and preview image, read from the first 256 KB of its HTML. */
async function pagePreview(raw: string): Promise<{ title?: string; image?: string }> {
  const url = publicHttpUrl(raw);
  if (!url) return {};
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; hobby-site link preview)", Accept: "text/html" },
      redirect: "follow",
      cache: "no-store",
    });
    if (!res.ok || !res.body || !(res.headers.get("content-type") ?? "").includes("html")) return {};
    const reader = res.body.getReader();
    let html = "";
    const decoder = new TextDecoder();
    while (html.length < 256_000) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});
    const meta = (prop: string) =>
      new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i").exec(html)?.[1] ??
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i").exec(html)?.[1];
    const image = meta("og:image") ?? meta("twitter:image");
    const title = meta("og:title") ?? /<title[^>]*>([^<]+)<\/title>/i.exec(html)?.[1];
    let imageUrl: string | undefined;
    if (image) {
      try {
        const abs = new URL(decode(image), url);
        if (abs.protocol === "https:") imageUrl = abs.href;
      } catch {}
    }
    return { title: title ? decode(title).slice(0, LIMITS.title) : undefined, image: imageUrl };
  } catch {
    return {};
  }
}

/** Fills a new card's title from its link: YouTube's oEmbed, or the page's own title. */
export async function lookupLink(raw: string): Promise<{ title?: string; image?: string }> {
  if (!(await isAdmin())) return {};
  const yt = youTube(raw);
  if (yt) {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${yt.id}`)}`,
        { signal: AbortSignal.timeout(5000), cache: "no-store" },
      );
      if (!res.ok) return {};
      const { title } = (await res.json()) as { title?: string };
      return { title: title?.slice(0, LIMITS.title) };
    } catch {
      return {};
    }
  }
  return pagePreview(raw);
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export interface FieldDraft {
  /** The saved field's id, or null for one added in this edit. */
  id: string | null;
  /** Stable key within the draft: the id, or a temporary one. */
  key: string;
  name: string;
}

export interface CardDraft {
  /** null for a new card. */
  id: string | null;
  title: string;
  url: string;
  progress: Progress;
  /** Existing tags by id, new ones by name alone. */
  tags: { id?: string; name: string }[];
  /** Values keyed by FieldDraft.key. */
  values: Record<string, string>;
}

export interface SaveInput {
  hobby: string;
  card: CardDraft;
  /** The tab's extra fields in order, after this edit. */
  fields: FieldDraft[];
  /** Eyes after this edit; extra fields keyed by FieldDraft.key. */
  show: Omit<Show, "fields"> & { fields: Record<string, boolean> };
}

export async function saveCard(input: SaveInput): Promise<ActionResult> {
  return commit(input.hobby, async (doc, now) => {
    const details: string[] = [];

    // Fields: the tab-wide list, in its new order.
    if (input.fields.length > MAX_FIELDS) throw new Invalid(`A tab can have up to ${MAX_FIELDS} extra fields.`);
    const keyToId = new Map<string, string>();
    const fields = input.fields.map((f) => {
      const name = clean(f.name, LIMITS.fieldName);
      if (!name) throw new Invalid("Every field needs a name.");
      const old = f.id ? doc.fields.find((x) => x.id === f.id) : undefined;
      if (f.id && !old) throw new Invalid("A field changed meanwhile. Reload and try again.");
      const id = old?.id ?? newId("f");
      keyToId.set(f.key, id);
      if (!old) details.push(`field added: ${name}`);
      else if (old.name !== name) details.push(`field renamed: ${old.name} → ${name}`);
      return { id, name };
    });
    const names = fields.map((f) => f.name.toLowerCase());
    if (new Set(names).size !== names.length) throw new Invalid("Two fields can't share a name.");
    for (const old of doc.fields) {
      if (!fields.some((f) => f.id === old.id)) {
        details.push(`field removed: ${old.name}`);
        for (const c of doc.cards) delete c.values[old.id];
        delete doc.show.fields[old.id];
      }
    }
    doc.fields = fields;

    // Eyes, also tab-wide.
    const show: Show = {
      thumb: !!input.show.thumb,
      title: !!input.show.title,
      tags: !!input.show.tags,
      progress: !!input.show.progress,
      fields: Object.fromEntries(
        [...keyToId].map(([key, id]) => [id, !!input.show.fields[key]]),
      ),
    };
    if (JSON.stringify(show) !== JSON.stringify(doc.show)) details.push("grid visibility changed");
    doc.show = show;

    // Tags: existing ones by id; new names become tags.
    const tagIds: string[] = [];
    for (const t of input.card.tags) {
      const name = clean(t.name, LIMITS.tagName);
      let tag = t.id ? doc.tags.find((x) => x.id === t.id) : undefined;
      tag ??= doc.tags.find((x) => x.name.toLowerCase() === name.toLowerCase());
      if (!tag) {
        if (!name) continue;
        if (doc.tags.length >= MAX_TAGS) throw new Invalid(`A tab can have up to ${MAX_TAGS} tags.`);
        tag = { id: newId("t"), name, colour: nextTagColour(doc.tags) };
        doc.tags.push(tag);
        details.push(`tag created: ${name}`);
      }
      if (!tagIds.includes(tag.id)) tagIds.push(tag.id);
    }

    const title = clean(input.card.title, LIMITS.title);
    if (!title) throw new Invalid("The card needs a title.");
    const url = clean(input.card.url, LIMITS.url);
    if (url && !/^https?:\/\//i.test(url)) throw new Invalid("The link needs to start with http:// or https://.");
    const progress = PROGRESS.includes(input.card.progress) ? input.card.progress : "Todo";
    const values: Record<string, string> = {};
    for (const [key, v] of Object.entries(input.card.values)) {
      const id = keyToId.get(key);
      const value = clean(v, LIMITS.value);
      if (id && value) values[id] = value;
    }

    const existing = input.card.id ? needCard(doc, input.card.id) : null;
    // Only a non-YouTube link needs its preview image looked up, and only when it changed.
    let image = existing?.url === url ? existing.image : undefined;
    if (url && url !== existing?.url && !youTube(url)) image = (await pagePreview(url)).image;
    if (!url) image = undefined;

    // True when only tab-wide settings changed, not the card itself.
    const unchanged = existing &&
      existing.title === title && existing.url === url && existing.progress === progress &&
      JSON.stringify(existing.tagIds) === JSON.stringify(tagIds) &&
      JSON.stringify(existing.values) === JSON.stringify(values);

    let card: Card;
    if (existing) {
      card = existing;
      if (!unchanged) Object.assign(card, { title, url, image, tagIds, progress, values, updatedAt: now });
    } else {
      card = { id: newId("c"), title, url, image, tagIds, progress, values, createdAt: now, updatedAt: now };
      doc.cards.push(card);
    }
    if (!card.image) delete card.image;

    if (unchanged && !details.length) throw new Invalid("Nothing changed.");
    const summary = !existing
      ? `card created: ${title}`
      : unchanged
        ? details.length === 1 ? details.shift()! : "tab settings changed"
        : `card edited: ${title}`;
    return { doc, summary, details, action: existing ? (unchanged ? "tab.edit" : "card.edit") : "card.create", cardId: card.id };
  });
}

export async function deleteCard(hobby: string, id: string): Promise<ActionResult> {
  return commit(hobby, (doc, now) => {
    const card = needCard(doc, id);
    card.deletedAt = now;
    // Many deletes in a short window may be an accident, or someone else.
    const t = Date.now();
    deletes.push(t);
    while (deletes.length && t - deletes[0] > 10 * 60_000) deletes.shift();
    if (deletes.length > 5) console.warn(`[hobby] ${deletes.length} cards deleted in the last 10 minutes`);
    return { doc, summary: `card deleted: ${card.title}`, action: "card.delete", cardId: id };
  });
}

export async function restoreCard(hobby: string, id: string): Promise<ActionResult> {
  return commit(hobby, (doc) => {
    const card = doc.cards.find((c) => c.id === id);
    if (!card?.deletedAt) throw new Invalid("That card isn't deleted.");
    delete card.deletedAt;
    return { doc, summary: `card restored: ${card.title}`, action: "card.restore", cardId: id };
  });
}

// ---------------------------------------------------------------------------
// Tags, managed on the bookmarks
// ---------------------------------------------------------------------------

export async function addTag(hobby: string, rawName: string): Promise<ActionResult> {
  return commit(hobby, (doc) => {
    const name = clean(rawName, LIMITS.tagName);
    if (!name) throw new Invalid("The tag needs a name.");
    if (doc.tags.some((t) => t.name.toLowerCase() === name.toLowerCase())) throw new Invalid("That tag already exists.");
    if (doc.tags.length >= MAX_TAGS) throw new Invalid(`A tab can have up to ${MAX_TAGS} tags.`);
    doc.tags.push({ id: newId("t"), name, colour: nextTagColour(doc.tags) });
    return { doc, summary: `tag created: ${name}`, action: "tag.create" };
  });
}

export async function renameTag(hobby: string, id: string, rawName: string): Promise<ActionResult> {
  return commit(hobby, (doc) => {
    const tag = doc.tags.find((t) => t.id === id);
    if (!tag) throw new Invalid("That tag no longer exists.");
    const name = clean(rawName, LIMITS.tagName);
    if (!name) throw new Invalid("The tag needs a name.");
    if (doc.tags.some((t) => t.id !== id && t.name.toLowerCase() === name.toLowerCase())) {
      throw new Invalid("Another tag already has that name.");
    }
    if (tag.name === name) throw new Invalid("Nothing changed.");
    const old = tag.name;
    tag.name = name;
    return { doc, summary: `tag renamed: ${old} → ${name}`, action: "tag.rename" };
  });
}

export async function moveTag(hobby: string, id: string, by: -1 | 1): Promise<ActionResult> {
  return commit(hobby, (doc) => {
    const i = doc.tags.findIndex((t) => t.id === id);
    const j = i + by;
    if (i < 0 || j < 0 || j >= doc.tags.length) throw new Invalid("That tag can't move further.");
    [doc.tags[i], doc.tags[j]] = [doc.tags[j], doc.tags[i]];
    return { doc, summary: `tag moved: ${doc.tags[j].name}`, action: "tag.move" };
  });
}

export async function deleteTag(hobby: string, id: string): Promise<ActionResult> {
  return commit(hobby, (doc) => {
    const tag = doc.tags.find((t) => t.id === id);
    if (!tag) throw new Invalid("That tag no longer exists.");
    doc.tags = doc.tags.filter((t) => t.id !== id);
    let n = 0;
    for (const c of doc.cards) {
      if (c.tagIds.includes(id)) {
        c.tagIds = c.tagIds.filter((t) => t !== id);
        n++;
      }
    }
    return { doc, summary: `tag removed: ${tag.name}`, details: [`taken off ${n} card${n === 1 ? "" : "s"}`], action: "tag.delete" };
  });
}

// ---------------------------------------------------------------------------
// Sign in and out
// ---------------------------------------------------------------------------

export async function login(_prev: { error: string } | null, form: FormData): Promise<{ error: string } | null> {
  if (!authConfigured()) return { error: "Sign-in isn't set up on this server yet." };
  const { ip } = await requestInfo();
  if (overLimit(`login:${ip}`, 8, 15 * 60_000)) {
    return { error: "Too many tries. Wait a few minutes and try again." };
  }
  if (!(await checkPassword(String(form.get("password") ?? "")))) {
    // A small pause makes guessing slower still.
    await new Promise((r) => setTimeout(r, 600));
    return { error: "That password isn't right." };
  }
  await startSession();
  const next = String(form.get("next") ?? "");
  redirect(/^\/hobby\/[a-z]+$/.test(next) ? next : `/hobby/${DEFAULT_HOBBY}`);
}

export async function logout(hobby: HobbyId) {
  await endSession();
  redirect(`/hobby/${hobbyById(hobby)?.id ?? DEFAULT_HOBBY}`);
}
