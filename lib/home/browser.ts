"use client";

import { cleanUrl } from "./links";
import { createPersistentStore, useStore } from "./store";

/**
 * The in-app browser: up to two windows, each with its own tabs, floating
 * over the scene (a sheet on phones). Pages load in frames, so sites that
 * refuse to be framed (most big ones) can't show; those on a known list open
 * in a real tab instead, and every page has a way out to one.
 *
 * A frame's own navigation (clicking a link inside the page) can't be seen
 * from here, so a tab's address and its back and forward are those of the
 * pages opened from the address bar or a link, not every page visited
 * within one. Remembered across visits, on this device only.
 */

export const BROWSER_WINDOWS_MAX = 2;

export interface BrowserTab {
  id: string;
  /** The pages opened in it, and which is showing. */
  history: string[];
  at: number;
}

export interface BrowserWindow {
  id: string;
  tabs: BrowserTab[];
  active: string;
  /** Where it sits on desktop, in px from the top left, and its size. */
  x: number;
  y: number;
  w: number;
  h: number;
  minimised: boolean;
}

interface BrowserState {
  /** In stacking order: the last is in front. */
  windows: BrowserWindow[];
  /** A tab whose address bar should take the keyboard, once shown. */
  focusAddress: string | null;
}

const initial: BrowserState = { windows: [], focusAddress: null };

const isTab = (t: unknown): t is BrowserTab => {
  const x = t as BrowserTab;
  return !!x && typeof x.id === "string" && Array.isArray(x.history) && typeof x.at === "number";
};

export const browserStore = createPersistentStore<BrowserState>("home:browser:v1", initial, (raw) => {
  const r = (raw ?? {}) as Partial<BrowserState>;
  const windows = (Array.isArray(r.windows) ? r.windows : [])
    .map((w) => ({ ...w, tabs: Array.isArray(w?.tabs) ? w.tabs.filter(isTab) : [] }))
    .filter((w) => typeof w.id === "string" && w.tabs.length > 0)
    .slice(0, BROWSER_WINDOWS_MAX)
    .map((w) => ({ ...w, active: w.tabs.some((t) => t.id === w.active) ? w.active : w.tabs[0].id }));
  return { windows, focusAddress: null };
});

export const useBrowser = () => useStore(browserStore);

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

/** A tab's page now: "" for a new, empty one. */
export const tabUrl = (t: BrowserTab) => t.history[t.at] ?? "";

// ------------------------------------------------------------ addresses

const SEARCH = "https://www.google.com/search?igu=1&q=";

/** Google's own search refuses to be framed; with igu=1 it allows it. */
export const searchUrl = (q: string) => SEARCH + encodeURIComponent(q.trim());

/** What the address bar shows for a page: a search's words, else its address. */
export function addressFor(url: string) {
  if (url.startsWith(SEARCH)) {
    try {
      return new URL(url).searchParams.get("q") ?? url;
    } catch {
      return url;
    }
  }
  return url;
}

/**
 * What's typed into the address bar, as a page to open: an address if it
 * looks like one (a dot and no spaces, or a scheme), else a search.
 */
export function resolveInput(input: string) {
  const text = input.trim();
  if (!text) return "";
  const looksLikeUrl = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) || (!/\s/.test(text) && /\.[a-z]{2,}(\/|:|$)/i.test(text)) || /^localhost(:\d+)?(\/|$)/.test(text);
  if (looksLikeUrl) {
    const url = cleanUrl(text);
    if (url) return url;
  }
  return searchUrl(text);
}

/**
 * Sites known to refuse being shown in another page (they send
 * X-Frame-Options or a frame-ancestors rule). Matched on the host and every
 * domain above it.
 */
const BLOCKED = new Set([
  "github.com",
  "gitlab.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "facebook.com",
  "instagram.com",
  "threads.net",
  "linkedin.com",
  "tiktok.com",
  "discord.com",
  "whatsapp.com",
  "messenger.com",
  "notion.so",
  "notion.site",
  "figma.com",
  "canva.com",
  "amazon.com",
  "amazon.com.au",
  "ebay.com",
  "ebay.com.au",
  "netflix.com",
  "twitch.tv",
  "spotify.com",
  "stackoverflow.com",
  "chatgpt.com",
  "openai.com",
  "claude.ai",
  "anthropic.com",
  "outlook.com",
  "live.com",
  "office.com",
  "microsoft.com",
  "apple.com",
  "icloud.com",
  "medium.com",
  "vercel.com",
  "mail.google.com",
  "docs.google.com",
  "drive.google.com",
  "calendar.google.com",
  "accounts.google.com",
  "classroom.google.com",
  "meet.google.com",
  "maps.google.com",
]);

/** YouTube refuses framing, but its embed player doesn't: a video's page
 *  becomes its player. */
function youtubeEmbed(url: URL) {
  const host = url.hostname.replace(/^www\.|^m\./, "");
  let id: string | null = null;
  if (host === "youtu.be") id = url.pathname.slice(1);
  else if (host === "youtube.com" && url.pathname === "/watch") id = url.searchParams.get("v");
  else if (host === "youtube.com" && url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
  return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1` : null;
}

/**
 * Where a page can be shown: `frame` with the address to put in the frame,
 * or `external` if the site is known to refuse.
 */
export function placeFor(raw: string): { kind: "frame" | "external"; url: string } {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "external", url: raw };
  }
  if (url.protocol === "mailto:") return { kind: "external", url: raw };
  if (raw.startsWith(SEARCH)) return { kind: "frame", url: raw };
  const embed = youtubeEmbed(url);
  if (embed) return { kind: "frame", url: embed };
  const host = url.hostname.replace(/^www\./, "");
  const parts = host.split(".");
  for (let i = 0; i < parts.length - 1; i++) {
    if (BLOCKED.has(parts.slice(i).join("."))) return { kind: "external", url: raw };
  }
  // Google itself, other than its framable search.
  if (/(^|\.)google\.[a-z.]+$/.test(host) || /(^|\.)youtube\.com$/.test(host)) return { kind: "external", url: raw };
  return { kind: "frame", url: raw };
}

export const openExternal = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

// ---------------------------------------------------------------- windows

function newTab(url = ""): BrowserTab {
  return { id: newId(), history: url ? [url] : [], at: url ? 0 : -1 };
}

/** Where a new window goes: centred on the screen, the second a little
 *  down and right of the first. */
function newWindow(index: number, url = ""): BrowserWindow {
  const vw = typeof window === "undefined" ? 1280 : window.innerWidth;
  const vh = typeof window === "undefined" ? 800 : window.innerHeight;
  const w = Math.round(Math.min(1100, vw * 0.62));
  const h = Math.round(Math.min(760, vh * 0.72));
  const tab = newTab(url);
  return {
    id: newId(),
    tabs: [tab],
    active: tab.id,
    x: Math.round((vw - w) / 2 + index * 40),
    y: Math.round(Math.max(24, (vh - h) / 2 - 40 + index * 40)),
    w,
    h,
    minimised: false,
  };
}

const set = (fn: (s: BrowserState) => BrowserState) => browserStore.set(fn);

const mapWindow = (s: BrowserState, id: string, fn: (w: BrowserWindow) => BrowserWindow): BrowserState => ({
  ...s,
  windows: s.windows.map((w) => (w.id === id ? fn(w) : w)),
});

/** Brings a window to the front, and out of being minimised. */
export const focusWindow = (id: string) =>
  set((s) => {
    const w = s.windows.find((x) => x.id === id);
    if (!w) return s;
    return { ...s, windows: [...s.windows.filter((x) => x.id !== id), { ...w, minimised: false }] };
  });

/** Opens a second window (or a first), with an empty tab ready to type in. */
export function openWindow(url = "") {
  const s = browserStore.get();
  if (s.windows.length >= BROWSER_WINDOWS_MAX) return null;
  const w = newWindow(s.windows.length, url);
  set((x) => ({ ...x, windows: [...x.windows, w], focusAddress: url ? null : w.tabs[0].id }));
  return w.id;
}

export const closeWindow = (id: string) => set((s) => ({ ...s, windows: s.windows.filter((w) => w.id !== id) }));

export const minimiseWindow = (id: string, minimised = true) => set((s) => mapWindow(s, id, (w) => ({ ...w, minimised })));

export const placeWindow = (id: string, box: Partial<Pick<BrowserWindow, "x" | "y" | "w" | "h">>) =>
  set((s) => mapWindow(s, id, (w) => ({ ...w, ...box })));

/** The window in front, if any. */
const front = (s: BrowserState) => s.windows.at(-1);

/** Opens `url` (or an empty tab to type in) in a new tab of the window in
 *  front, opening a window if there's none. */
export function openTab(url = "") {
  const s = browserStore.get();
  const w = front(s);
  if (!w) return void openWindow(url);
  const tab = newTab(url);
  set((x) => ({
    ...mapWindow(x, w.id, (win) => ({ ...win, tabs: [...win.tabs, tab], active: tab.id, minimised: false })),
    focusAddress: url ? null : tab.id,
  }));
  focusWindow(w.id);
}

export function newTabIn(windowId: string) {
  const tab = newTab();
  set((s) => ({
    ...mapWindow(s, windowId, (w) => ({ ...w, tabs: [...w.tabs, tab], active: tab.id })),
    focusAddress: tab.id,
  }));
}

export const showTab = (windowId: string, tabId: string) => set((s) => mapWindow(s, windowId, (w) => ({ ...w, active: tabId })));

/** Closes a tab; the window goes with its last one. */
export function closeTab(windowId: string, tabId: string) {
  set((s) => {
    const w = s.windows.find((x) => x.id === windowId);
    if (!w) return s;
    const i = w.tabs.findIndex((t) => t.id === tabId);
    const tabs = w.tabs.filter((t) => t.id !== tabId);
    if (!tabs.length) return { ...s, windows: s.windows.filter((x) => x.id !== windowId) };
    const active = w.active === tabId ? tabs[Math.max(0, i - 1)].id : w.active;
    return mapWindow(s, windowId, (x) => ({ ...x, tabs, active }));
  });
}

/** Opens what was typed (or a link) in a tab, ahead of where it was. */
export function navigate(windowId: string, tabId: string, input: string) {
  const url = resolveInput(input);
  if (!url) return;
  set((s) =>
    mapWindow(s, windowId, (w) => ({
      ...w,
      tabs: w.tabs.map((t) => (t.id === tabId ? { ...t, history: [...t.history.slice(0, t.at + 1), url], at: t.at + 1 } : t)),
    })),
  );
}

export function step(windowId: string, tabId: string, by: -1 | 1) {
  set((s) =>
    mapWindow(s, windowId, (w) => ({
      ...w,
      tabs: w.tabs.map((t) => (t.id === tabId ? { ...t, at: Math.min(t.history.length - 1, Math.max(0, t.at + by)) } : t)),
    })),
  );
}

export const addressFocused = () => set((s) => ({ ...s, focusAddress: null }));

/** The search shortcut: a new tab in the window in front, ready to type
 *  into; or the first window. */
export const openSearch = () => openTab();

/** A link, in the in-app browser if it can show there, else a real tab. */
export function openLinkInApp(url: string) {
  if (placeFor(url).kind === "external") return openExternal(url);
  openTab(url);
}
