"use client";

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Globe,
  Minus,
  Plus,
  RotateCw,
  Search,
  SquarePlus,
  X,
} from "lucide-react";
import {
  addressFocused,
  addressFor,
  BROWSER_WINDOWS_MAX,
  closeTab,
  closeWindow,
  focusWindow,
  minimiseWindow,
  navigate,
  newTabIn,
  openExternal,
  openWindow,
  placeFor,
  placeWindow,
  showTab,
  step,
  tabUrl,
  useBrowser,
  type BrowserTab,
  type BrowserWindow,
} from "@/lib/home/browser";
import { cn } from "@/lib/utils";
import { chipGlass, IconButton } from "./ui";

/** A tab's name in its strip: the site, a search's words, or "new tab". */
function tabName(t: BrowserTab) {
  const url = tabUrl(t);
  if (!url) return "new tab";
  const shown = addressFor(url);
  if (shown !== url) return shown;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/** The smallest a window can be dragged to. */
const MIN_W = 420;
const MIN_H = 300;

/** The address bar: what's showing, or what's being typed. */
const AddressBar = ({ win, tab }: { win: BrowserWindow; tab: BrowserTab }) => {
  const { focusAddress } = useBrowser();
  const shown = addressFor(tabUrl(tab));
  const [draft, setDraft] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  // A new tab, or the search shortcut: the keyboard goes straight here.
  useEffect(() => {
    if (focusAddress !== tab.id) return;
    input.current?.focus();
    addressFocused();
  }, [focusAddress, tab.id]);

  return (
    <form
      className="min-w-0 flex-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft !== null) navigate(win.id, tab.id, draft);
        setDraft(null);
        input.current?.blur();
      }}
    >
      <label className="relative block">
        <span className="sr-only">address or search</span>
        <Search aria-hidden="true" className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
        <input
          ref={input}
          value={draft ?? shown}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={(e) => e.target.select()}
          onBlur={() => setDraft(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            }
          }}
          placeholder="search google or type an address"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className="border-glass-edge focus:border-glow/70 focus:ring-glow/20 h-8 w-full rounded-full border bg-black/25 pr-3 pl-8 text-base normal-case md:text-[0.8rem] outline-none placeholder:text-white/40 focus:ring-4"
        />
      </label>
    </form>
  );
};

/** One tab's page: its frame, or why it can't show here. */
const Page = ({ tab, shown, reload, dragging }: { tab: BrowserTab; shown: boolean; reload: number; dragging: boolean }) => {
  const url = tabUrl(tab);
  if (!url) {
    return (
      <div className={cn("absolute inset-0 grid place-items-center p-6 text-center", !shown && "hidden")}>
        <div className="flex flex-col items-center gap-3">
          <Globe className="text-glow size-8" />
          <p className="font-display text-3xl">where to?</p>
          <p className="text-muted-foreground max-w-xs text-xs">
            search, or type an address above. some sites won&apos;t show inside another page; those open in a real tab.
          </p>
        </div>
      </div>
    );
  }
  const place = placeFor(url);
  if (place.kind === "external") {
    return (
      <div className={cn("absolute inset-0 grid place-items-center p-6 text-center", !shown && "hidden")}>
        <div className="flex max-w-sm flex-col items-center gap-3">
          <ExternalLink className="text-glow size-7" />
          <p className="text-sm">this site won&apos;t show inside another page.</p>
          <button
            type="button"
            onClick={() => openExternal(url)}
            className="bg-glow text-primary-foreground focus-visible:ring-ring h-9 cursor-pointer rounded-full px-4 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
          >
            open it in a real tab
          </button>
          <p className="text-muted-foreground truncate text-[0.7rem] normal-case">{url}</p>
        </div>
      </div>
    );
  }
  return (
    <iframe
      key={`${place.url}#${reload}`}
      src={place.url}
      title={tabName(tab)}
      // Frames can't take this page with them (no top navigation), but can
      // run, sign in where the site allows, and open real tabs.
      sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals allow-downloads allow-presentation allow-storage-access-by-user-activation"
      allow="autoplay; fullscreen; clipboard-write; encrypted-media; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
      className={cn("absolute inset-0 h-full w-full border-0 bg-white", !shown && "hidden", dragging && "pointer-events-none")}
    />
  );
};

/**
 * One browser window. On desktop it floats: dragged by its tab strip,
 * resized from its corner, brought to the front when touched. On phones it
 * fills the screen above the tab bar.
 */
const Window = ({ win, z, wide, count }: { win: BrowserWindow; z: number; wide: boolean; count: number }) => {
  const tab = win.tabs.find((t) => t.id === win.active) ?? win.tabs[0];
  const [reloads, setReloads] = useState<Record<string, number>>({});
  // Where it's being dragged or sized to, before it's let go and saved.
  const [live, setLive] = useState<Pick<BrowserWindow, "x" | "y" | "w" | "h"> | null>(null);
  const box = live ?? win;

  const drag = (e: ReactPointerEvent, kind: "move" | "size") => {
    if (e.button !== 0) return;
    if (kind === "move" && (e.target as Element).closest("button, input, a")) return;
    e.preventDefault();
    focusWindow(win.id);
    const start = { px: e.clientX, py: e.clientY, x: win.x, y: win.y, w: win.w, h: win.h };
    let last = start as Pick<BrowserWindow, "x" | "y" | "w" | "h">;
    const move = (ev: PointerEvent) => {
      const dx = ev.clientX - start.px;
      const dy = ev.clientY - start.py;
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      last =
        kind === "move"
          ? {
              ...start,
              // Some of it always left on screen to grab, and never off the
              // bottom, so the chips under it stay in reach beside it.
              x: Math.min(vw - 120, Math.max(120 - start.w, start.x + dx)),
              y: Math.min(Math.max(0, vh - start.h), Math.max(0, start.y + dy)),
            }
          : { ...start, w: Math.max(MIN_W, Math.min(vw - start.x, start.w + dx)), h: Math.max(MIN_H, Math.min(vh - start.y, start.h + dy)) };
      setLive(last);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      placeWindow(win.id, { x: last.x, y: last.y, w: last.w, h: last.h });
      setLive(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  if (win.minimised) return null;
  const url = tabUrl(tab);
  const place = url ? placeFor(url) : null;

  return (
    <section
      aria-label="browser"
      onPointerDownCapture={() => focusWindow(win.id)}
      className={cn(
        "bg-glass-strong border-glass-edge fixed flex flex-col overflow-hidden border shadow-[0_30px_80px_-20px_rgb(0_0_0/0.75)]",
        wide ? "rounded-2xl" : "inset-x-2 top-[calc(0.5rem+env(safe-area-inset-top))] bottom-[calc(6.25rem+env(safe-area-inset-bottom))] rounded-[1.4rem]",
      )}
      style={wide ? { left: box.x, top: box.y, width: box.w, height: box.h, zIndex: 30 + z } : { zIndex: 45 }}
    >
      {/* The tab strip, which is also the handle to drag it by. */}
      <div
        onPointerDown={(e) => wide && drag(e, "move")}
        className={cn("flex items-center gap-1 px-2 pt-2", wide && "cursor-grab active:cursor-grabbing")}
      >
        <ul className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          {win.tabs.map((t) => (
            <li key={t.id} className="w-44 min-w-20 shrink">
              <div
                className={cn(
                  "group flex h-8 items-center rounded-lg pl-2.5 text-xs transition",
                  t.id === tab.id ? "bg-white/12 text-foreground" : "text-muted-foreground hover:bg-white/6",
                )}
              >
                <button
                  type="button"
                  aria-pressed={t.id === tab.id}
                  onClick={() => showTab(win.id, t.id)}
                  className="min-w-0 flex-1 cursor-pointer truncate text-left normal-case focus-visible:outline-none"
                  title={tabUrl(t) || "new tab"}
                >
                  {tabName(t)}
                </button>
                <button
                  type="button"
                  aria-label={`close ${tabName(t)}`}
                  onClick={() => closeTab(win.id, t.id)}
                  className="grid size-7 shrink-0 cursor-pointer place-items-center rounded-md opacity-60 hover:bg-white/10 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none"
                >
                  <X className="size-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
        <IconButton label="new tab" className="size-8 border-0" onClick={() => newTabIn(win.id)}>
          <Plus className="size-4" />
        </IconButton>
        {wide && (
          <>
            <span aria-hidden="true" className="bg-glass-edge mx-1 h-5 w-px" />
            <IconButton
              label="new window"
              title={count >= BROWSER_WINDOWS_MAX ? `${BROWSER_WINDOWS_MAX} windows at most` : "new window"}
              disabled={count >= BROWSER_WINDOWS_MAX}
              className="size-8 border-0"
              onClick={() => openWindow()}
            >
              <SquarePlus className="size-4" />
            </IconButton>
            <IconButton label="minimise" className="size-8 border-0" onClick={() => minimiseWindow(win.id)}>
              <Minus className="size-4" />
            </IconButton>
          </>
        )}
        <IconButton label="close browser window" className="size-8 border-0" onClick={() => closeWindow(win.id)}>
          <X className="size-4" />
        </IconButton>
      </div>

      {/* The toolbar. */}
      <div className="flex items-center gap-1 px-2 py-2">
        <IconButton label="back" className="size-8 border-0" disabled={tab.at <= 0} onClick={() => step(win.id, tab.id, -1)}>
          <ArrowLeft className="size-4" />
        </IconButton>
        <IconButton
          label="forward"
          className="size-8 border-0"
          disabled={tab.at >= tab.history.length - 1}
          onClick={() => step(win.id, tab.id, 1)}
        >
          <ArrowRight className="size-4" />
        </IconButton>
        <IconButton
          label="reload"
          className="size-8 border-0"
          disabled={!url}
          onClick={() => setReloads((r) => ({ ...r, [tab.id]: (r[tab.id] ?? 0) + 1 }))}
        >
          <RotateCw className="size-3.5" />
        </IconButton>
        <AddressBar key={`${tab.id}:${tab.at}`} win={win} tab={tab} />
        <IconButton
          label="open in a real tab"
          title="open in a real tab: for sites that won't show here"
          className="size-8 border-0"
          disabled={!url}
          onClick={() => openExternal(place?.kind === "frame" ? place.url : url)}
        >
          <ExternalLink className="size-3.5" />
        </IconButton>
      </div>

      <div className="bg-background/90 relative min-h-0 flex-1">
        {win.tabs.map((t) => (
          <Page key={t.id} tab={t} shown={t.id === tab.id} reload={reloads[t.id] ?? 0} dragging={live !== null} />
        ))}
        {/* Under a dragged edge, frames would swallow the pointer. */}
        {live && <div className="absolute inset-0" />}
      </div>

      {wide && (
        <div
          aria-hidden="true"
          onPointerDown={(e) => drag(e, "size")}
          className="absolute right-0 bottom-0 size-4 cursor-nwse-resize"
        />
      )}
    </section>
  );
};

/** Every browser window open, in stacking order. Mounted once. */
export const BrowserWindows = ({ wide }: { wide: boolean }) => {
  const { windows } = useBrowser();
  // Phones show one window at a time: the one in front.
  const shown = wide ? windows : windows.slice(-1);
  return (
    <>
      {shown.map((w, i) => (
        <Window key={w.id} win={w} z={i} wide={wide} count={windows.length} />
      ))}
    </>
  );
};

/**
 * The chip that brings the browser up: opens a window if there's none,
 * shows any minimised, and hides them again when they're all showing.
 */
export const BrowserChip = ({ className }: { className?: string }) => {
  const { windows } = useBrowser();
  const showing = windows.some((w) => !w.minimised);
  return (
    <button
      type="button"
      aria-label="browser"
      aria-expanded={showing}
      title="browser (space or enter to search)"
      onClick={() => {
        if (!windows.length) return void openWindow();
        windows.forEach((w) => minimiseWindow(w.id, showing));
      }}
      className={cn(
        chipGlass,
        "focus-visible:ring-ring grid size-13 cursor-pointer place-items-center rounded-[1.1rem] transition hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none",
        showing && "border-glow/55",
        className,
      )}
    >
      <Globe className="text-glow size-5" />
    </button>
  );
};
