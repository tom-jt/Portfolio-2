"use client";

/**
 * Client state for /hobby that lives outside React: the query string (the
 * tab's tag, search, filters, sort, and open card), the admin check, and the
 * screen width.
 */

import { useEffect, useState, useSyncExternalStore } from "react";
import {
  DEFAULT_DIR,
  PROGRESS,
  SORTS,
  type Progress,
  type Query,
  type SortKey,
} from "./model";

// ---------------------------------------------------------------------------
// The query string. It is the source of truth, so a card or a filtered view
// can be linked to, and Back steps out of an opened card.
// ---------------------------------------------------------------------------

const URL_EVENT = "hobby:url";

function subscribeUrl(cb: () => void) {
  window.addEventListener("popstate", cb);
  window.addEventListener(URL_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(URL_EVENT, cb);
  };
}

export const useSearch = () =>
  useSyncExternalStore(subscribeUrl, () => window.location.search, () => "");

/** Sets or clears query params. `push` adds a history entry (opening a card),
 *  so Back undoes it; everything else replaces the current one. */
export function setSearch(patch: Record<string, string | null>, push = false) {
  const params = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  const s = params.toString();
  const url = window.location.pathname + (s ? `?${s}` : "");
  if (url === window.location.pathname + window.location.search) return;
  if (push) window.history.pushState(null, "", url);
  else window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event(URL_EVENT));
}

export interface View extends Query {
  card: string | null;
}

export function parseSearch(search: string): View {
  const p = new URLSearchParams(search);
  const sort = (p.get("sort") ?? "updated") as SortKey;
  const sortKey: SortKey = sort in SORTS ? sort : "updated";
  const dir = p.get("dir");
  const progress = (p.get("progress") ?? "")
    .split(",")
    .map((s) => PROGRESS.find((x) => x.toLowerCase() === s))
    .filter((x): x is Progress => !!x);
  return {
    tag: p.get("tag"),
    q: p.get("q") ?? "",
    mode: p.get("in") === "all" ? "all" : "title",
    sort: sortKey,
    dir: dir === "asc" || dir === "desc" ? dir : DEFAULT_DIR[sortKey],
    progress,
    field: p.get("field") ?? "",
    contains: p.get("has") ?? "",
    card: p.get("card"),
  };
}

// ---------------------------------------------------------------------------
// Admin. The pages are static for everyone, so the session is asked for
// after they load.
// ---------------------------------------------------------------------------

export function useAdmin() {
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    let live = true;
    fetch("/api/hobby/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { admin?: boolean }) => {
        if (live) setAdmin(!!d.admin);
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);
  return admin;
}

// ---------------------------------------------------------------------------
// Wide screens get the side panel; narrow ones get a sheet over the grid.
// ---------------------------------------------------------------------------

const WIDE = "(min-width: 1024px)";

function subscribeWide(cb: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

export const useWide = () =>
  useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);
