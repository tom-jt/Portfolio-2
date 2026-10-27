"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowDown,
  ArrowUp,
  CloudOff,
  CornerDownLeft,
  Link2,
  Pencil,
  Pin,
  PinOff,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import {
  cleanKey,
  LINK_KEY_MAX,
  LINK_LABEL_MAX,
  LINK_SYNC_MAX,
  linkForKey,
  linkName,
  LINKS_MAX,
  linkSyncs,
  linkStore,
  moveLink,
  removeLink,
  saveLink,
  sortLinks,
  useLinks,
  type LinkDraft,
  type QuickLink,
} from "@/lib/home/links";
import { setPrefs, togglePanel, usePrefs } from "@/lib/home/prefs";
import { cn } from "@/lib/utils";
import { chipButton, chipGlass, Eyebrow, IconButton, Panel, PrimaryButton, textButton, type PanelChrome } from "./ui";

const openLink = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

/** Whether a key press is someone typing into a field, not at the page. */
const typingIn = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** How long typed letters wait for their Enter or Space before they're
 *  forgotten. */
const KEY_WAIT_MS = 2500;

/** Whether any link's key starts with this letter, so typing can begin with it. */
const startsAKey = (letter: string) => linkStore.get().some((l) => l.key.startsWith(letter));

/**
 * Typing a link's key and then Enter or Space anywhere on the page opens
 * it, unless the typing is going into a text box. A first letter no key
 * starts with is ignored, so ordinary key presses don't start anything;
 * after that, up to three letters are kept, and shown, matching or not, so
 * a slip can be backspaced. Returns them, and a count that moves on each
 * key press, to restart the hint's countdown.
 */
function useLinkKeys() {
  const [typed, setTyped] = useState({ text: "", presses: 0 });

  useEffect(() => {
    let buffer = "";
    let presses = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const reset = () => {
      buffer = "";
      setTyped({ text: "", presses });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.isComposing || typingIn(e.target)) return;
      if ((e.key === "Enter" || e.key === " ") && buffer) {
        clearTimeout(timer);
        const link = linkForKey(buffer);
        reset();
        if (!link) return;
        // Before the browser presses whatever has focus, or scrolls.
        e.preventDefault();
        openLink(link.url);
        return;
      }
      if (e.key === "Backspace" && buffer) {
        buffer = buffer.slice(0, -1);
      } else if (/^[a-z0-9]$/i.test(e.key)) {
        const letter = e.key.toLowerCase();
        if (buffer.length >= LINK_KEY_MAX || (!buffer && !startsAKey(letter))) return;
        buffer += letter;
      } else if (e.key.length === 1 || e.key === "Escape") {
        clearTimeout(timer);
        return reset();
      } else return;
      clearTimeout(timer);
      presses += 1;
      setTyped({ text: buffer, presses });
      timer = setTimeout(reset, KEY_WAIT_MS);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  return typed;
}

/**
 * A link's tile: its key, to type for it, on the scene's glow; or, with no
 * key, its first letter, quieter.
 */
const LinkTile = ({ link }: { link: QuickLink }) =>
  link.key ? (
    <kbd
      title={`type ${link.key} then enter or space`}
      className="bg-glow/15 text-glow grid h-8 min-w-8 shrink-0 place-items-center rounded-lg px-1 font-mono text-xs font-semibold normal-case"
    >
      {link.key}
    </kbd>
  ) : (
    <span className="text-muted-foreground grid size-8 shrink-0 place-items-center rounded-lg bg-white/6 text-sm font-semibold uppercase">
      {linkName(link).charAt(0)}
    </span>
  );

const FIELD =
  "border-glass-edge placeholder:text-muted-foreground/50 focus:border-glow/70 focus:ring-glow/20 h-9 min-w-0 rounded-full border bg-black/20 px-3.5 text-[0.8rem] normal-case transition outline-none focus:ring-4";

const EMPTY: LinkDraft = { label: "", url: "", key: "" };

/** The form for adding a link, or editing one. */
const LinkForm = ({ editing, onDone }: { editing: QuickLink | null; onDone: () => void }) => {
  const [draft, setDraft] = useState<LinkDraft>(editing ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const tooLong = draft.url.trim().length > LINK_SYNC_MAX;

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        const why = saveLink(draft, editing?.id);
        setError(why);
        if (!why) {
          setDraft(EMPTY);
          onDone();
        }
      }}
    >
      <Eyebrow>{editing ? `editing ${linkName(editing)}` : "add a link"}</Eyebrow>
      <input
        value={draft.url}
        onChange={(e) => setDraft({ ...draft, url: e.target.value })}
        placeholder="address, like github.com"
        aria-label="address"
        inputMode="url"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        className={FIELD}
      />
      <div className="flex gap-2">
        <input
          value={draft.label}
          onChange={(e) => setDraft({ ...draft, label: e.target.value.slice(0, LINK_LABEL_MAX) })}
          placeholder="name (optional)"
          aria-label="name"
          autoComplete="off"
          className={cn(FIELD, "flex-1")}
        />
        <input
          value={draft.key}
          onChange={(e) => setDraft({ ...draft, key: cleanKey(e.target.value) })}
          placeholder="key"
          aria-label={`key, up to ${LINK_KEY_MAX} letters`}
          title="type it then enter or space, anywhere on the page, to open this link"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="none"
          spellCheck={false}
          className={cn(FIELD, "w-16 text-center font-mono")}
        />
      </div>
      {tooLong && (
        <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CloudOff className="size-3.5 shrink-0" />
          over {LINK_SYNC_MAX} characters, so it won&apos;t sync to your other devices.
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
      <div className="flex items-center justify-end gap-3">
        {editing && (
          <button type="button" onClick={onDone} className={cn(textButton, "text-muted-foreground text-xs")}>
            cancel
          </button>
        )}
        <PrimaryButton type="submit" className="h-9 px-4 text-xs" disabled={!draft.url.trim()}>
          {editing ? "save" : "add"}
        </PrimaryButton>
      </div>
    </form>
  );
};


/** Closes something on a press outside `root` or on Escape, while `active`. */
function useDismiss(active: boolean, root: RefObject<HTMLElement | null>, close: () => void, spare?: string) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      const target = e.target as Element;
      if (root.current?.contains(target) || (spare && target.closest?.(spare))) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [active, root, close, spare]);
}

/** The links as a list to arrange, edit and remove, with the form under it. */
const LinkEditor = () => {
  const links = sortLinks(useLinks());
  const [editing, setEditing] = useState<QuickLink | null>(null);

  return (
    <>
      {links.length > 0 && (
        <ul className="flex flex-col gap-1">
          {links.map((l, i) => (
            <li
              key={l.id}
              className={cn("flex items-center gap-2 rounded-xl p-1.5", editing?.id === l.id && "bg-white/8")}
            >
              <LinkTile link={l} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm normal-case">{linkName(l)}</span>
                <span className="text-muted-foreground block truncate text-[0.7rem] normal-case">{l.url}</span>
              </span>
              {!linkSyncs(l) && (
                <span title={`over ${LINK_SYNC_MAX} characters: kept on this device only`}>
                  <CloudOff aria-label="not synced: address too long" className="text-muted-foreground size-3.5" />
                </span>
              )}
              <div className="flex">
                <IconButton label="move up" className="size-7 border-0" disabled={i === 0} onClick={() => moveLink(l.id, -1)}>
                  <ArrowUp className="size-3.5" />
                </IconButton>
                <IconButton
                  label="move down"
                  className="size-7 border-0"
                  disabled={i === links.length - 1}
                  onClick={() => moveLink(l.id, 1)}
                >
                  <ArrowDown className="size-3.5" />
                </IconButton>
                <IconButton label="edit" className="size-7 border-0" onClick={() => setEditing(l)}>
                  <Pencil className="size-3.5" />
                </IconButton>
                <IconButton
                  label="remove"
                  className="size-7 border-0"
                  onClick={() => {
                    removeLink(l.id);
                    if (editing?.id === l.id) setEditing(null);
                  }}
                >
                  <Trash2 className="size-3.5" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing || links.length < LINKS_MAX ? (
        <LinkForm key={editing?.id ?? "new"} editing={editing} onDone={() => setEditing(null)} />
      ) : (
        <p className="text-muted-foreground flex items-center gap-1.5 px-1 text-xs">
          <Plus className="size-3.5" /> that&apos;s {LINKS_MAX}: remove one to add another.
        </p>
      )}
    </>
  );
};

const EMPTY_HINT = `no links yet. add up to ${LINKS_MAX}, and give each a key of up to ${LINK_KEY_MAX} letters: type it then enter or space, anywhere on the page, to open it.`;

const POPOVER =
  "bg-glass-strong border-glass-edge flex flex-col gap-3 overflow-y-auto rounded-2xl border p-3 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.8)]";

/**
 * Phones: a button at the bottom right, above the tab bar, opening a drawer
 * of the links, which can
 * be switched to editing them. (Desktop has the bar by the tasks instead.)
 */
export const QuickLinksMenu = ({ className }: { className?: string }) => {
  const links = sortLinks(useLinks());
  const [show, setShow] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const close = () => setShow(false);
  useDismiss(show, root, close);

  return (
    <div ref={root} className={cn("relative", className)}>
      <button
        type="button"
        aria-label="quick links"
        aria-expanded={show}
        aria-haspopup="true"
        onClick={() => setShow((s) => !s)}
        className={cn(chipButton, "grid size-12 place-items-center rounded-2xl", show && "border-glow/55")}
      >
        <Link2 className="text-glow size-5" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            // Across the screen, just above the button.
            className={cn(
              POPOVER,
              "fixed inset-x-4 bottom-[calc(10rem+env(safe-area-inset-bottom))] z-50 max-h-[calc(100dvh-14rem)] origin-bottom",
            )}
          >
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-muted-foreground text-xs font-medium">
                quick links {links.length > 0 && `(${links.length}/${LINKS_MAX})`}
              </p>
              <button
                type="button"
                aria-pressed={editMode}
                onClick={() => setEditMode((m) => !m)}
                className={cn(textButton, "text-muted-foreground flex items-center gap-1 text-xs")}
              >
                {editMode ? <X className="size-3" /> : <Pencil className="size-3" />}
                {editMode ? "done" : "edit"}
              </button>
            </div>
            {editMode ? (
              <LinkEditor />
            ) : links.length ? (
              <ul className="grid grid-cols-2 gap-1.5">
                {links.map((l) => (
                  <li key={l.id}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={close}
                      title={l.url}
                      className="focus-visible:ring-ring flex items-center gap-2 rounded-xl p-1.5 transition hover:bg-white/8 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <LinkTile link={l} />
                      <span className="min-w-0 flex-1 truncate text-sm normal-case">{linkName(l)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground px-1 text-sm">{EMPTY_HINT}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Desktop: a square chip beside the tasks that opens into a row of the
 * links, like a tab bar, with a pin and an edit button, which opens the
 * links card. Unpinned, it folds away on a press elsewhere; pinned, it stays
 * open, across visits too.
 */
export const QuickLinksBar = ({ className }: { className?: string }) => {
  const links = sortLinks(useLinks());
  const { linksPinned: pinned, openPanels } = usePrefs();
  const editing = openPanels.includes("links");
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const shown = pinned || open;
  // Unpinned, it folds on a press anywhere but itself and its card.
  useDismiss(open && !pinned, root, () => setOpen(false), "#links");

  return (
    // Laid out open all the time, so nothing inside reflows as it opens: the
    // glass behind grows from a square to the full row, and the row is
    // uncovered with it. Only what's uncovered takes clicks.
    <div ref={root} className={cn("pointer-events-none flex items-end", className)}>
      <div className="relative h-13 max-w-full">
        <span
          aria-hidden="true"
          className={cn(
            chipGlass,
            "absolute inset-y-0 left-0 rounded-[1.1rem] transition-[width,border-color] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            shown && "border-glow/55",
          )}
          style={{ width: shown ? "100%" : "3.25rem" }}
        />
        <div
          className="pointer-events-auto relative flex h-full items-center gap-1 p-1.5 transition-[clip-path] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]"
          style={{ clipPath: shown ? "inset(0 0 0 0 round 1.1rem)" : "inset(0 calc(100% - 3.25rem) 0 0 round 1.1rem)" }}
        >
          <button
            type="button"
            aria-expanded={shown}
            aria-label={shown ? "hide quick links" : "show quick links"}
            title="quick links"
            onClick={() => {
              if (pinned) setPrefs({ linksPinned: false });
              setOpen(!shown);
            }}
            className="focus-visible:ring-ring grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl transition hover:bg-white/8 focus-visible:ring-2 focus-visible:outline-none"
          >
            <Link2 className="text-glow size-4" />
          </button>

          <div
            inert={!shown}
            className={cn("flex min-w-0 items-center gap-1 transition-opacity duration-300", !shown && "opacity-0")}
          >
            <span aria-hidden="true" className="bg-glass-edge mx-0.5 h-6 w-px shrink-0" />
            {links.length ? (
              // Like a browser's tabs: they share the room, narrowing as more
              // are added, the name giving way to the tile.
              <ul className="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
                {links.map((l) => (
                  <li key={l.id} className="@container w-36 min-w-11 shrink">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={l.url}
                      className="focus-visible:ring-ring flex h-10 min-w-0 items-center gap-2 rounded-xl px-1 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      <LinkTile link={l} />
                      <span className="hidden min-w-0 flex-1 truncate text-sm normal-case @[5rem]:block">{linkName(l)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={() => !editing && togglePanel("links")}
                className="text-muted-foreground hover:text-foreground shrink-0 cursor-pointer rounded-xl px-2 text-sm transition"
              >
                add your first link
              </button>
            )}
            <span aria-hidden="true" className="bg-glass-edge mx-0.5 h-6 w-px shrink-0" />
            <IconButton
              label={editing ? "done editing" : "edit links"}
              aria-pressed={editing}
              className={cn("size-9 shrink-0 border-0", editing && "text-foreground bg-white/12")}
              onClick={() => togglePanel("links")}
            >
              <Pencil className="size-3.5" />
            </IconButton>
            <IconButton
              label={pinned ? "unpin" : "pin open"}
              aria-pressed={pinned}
              className={cn("size-9 shrink-0 border-0", pinned && "text-glow")}
              onClick={() => {
                setPrefs({ linksPinned: !pinned });
                setOpen(true);
              }}
            >
              {pinned ? <PinOff className="size-3.5" /> : <Pin className="size-3.5" />}
            </IconButton>
          </div>
        </div>

      </div>
    </div>
  );
};

/** The links card: where they're added and arranged, a card like the others. */
export const QuickLinksPanel = ({ className, chrome }: { className?: string; chrome?: PanelChrome }) => {
  const links = useLinks();
  return (
    <Panel
      id="links"
      title="quick links"
      icon={Link2}
      className={className}
      chrome={chrome}
      actions={<span className="text-muted-foreground text-xs">{links.length}/{LINKS_MAX}</span>}
    >
      <div className="flex min-h-0 flex-col gap-3">
        <p className="text-muted-foreground text-sm">
          up to {LINKS_MAX} links, in the bar beside your tasks. give one a key of up to {LINK_KEY_MAX} letters, then
          type it and press enter or space anywhere on the page to open it. they sync with your tasks.
        </p>
        <LinkEditor />
      </div>
    </Panel>
  );
};

/** The keys, listened for page-wide, and what's been typed so far. Mounted once. */
export const LinkKeys = () => {
  const { text: typed, presses } = useLinkKeys();
  const links = useLinks();
  const hinted = typed ? links.find((l) => l.key === typed) : undefined;

  return (
    <AnimatePresence>
      {typed && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.12 }}
          aria-live="polite"
          className="bg-glass-strong border-glass-edge pointer-events-none fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 overflow-hidden rounded-full border px-3.5 py-2 text-sm shadow-lg md:top-24 md:bottom-auto"
        >
          <span className="font-mono normal-case">{typed}</span>
          {hinted ? (
            <>
              <CornerDownLeft className="text-glow size-3.5" />
              <span className="text-muted-foreground normal-case">{linkName(hinted)}</span>
            </>
          ) : (
            <span className="text-muted-foreground">…</span>
          )}
          {/* Runs down until the letters are forgotten, from each key press. */}
          <span
            key={presses}
            aria-hidden="true"
            className="bg-glow/60 absolute inset-x-0 bottom-0 h-0.5 origin-left"
            style={{ animation: `home-countdown ${KEY_WAIT_MS}ms linear forwards` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
