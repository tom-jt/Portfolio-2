"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import {
  addTag,
  deleteCard,
  deleteTag,
  logout,
  lookupLink,
  moveTag,
  renameTag,
  restoreCard,
  saveCard,
  type ActionResult,
} from "@/app/hobby/actions";
import { hobbyById, type HobbyId } from "@/data/hobby/hobbies";
import { parseSearch, setSearch, useAdmin, useSearch, useWide } from "@/lib/hobby/client";
import { draftFrom, draftShow, sameDraft, type Draft } from "@/lib/hobby/draft";
import { runQuery, slug, youTube, type Card, type HobbyDoc, type Tag } from "@/lib/hobby/model";
import { cn } from "@/lib/utils";
import AdminDoor from "./AdminDoor";
import { Mark } from "./bits";
import CardPanel from "./CardPanel";
import CardTile from "./CardTile";
import Doodle from "./Doodle";
import HobbyNav from "./HobbyNav";
import TagTabs from "./TagTabs";
import Toolbar from "./Toolbar";

interface Edit {
  draft: Draft;
  /** The draft as it opened, to tell whether anything changed. */
  base: Draft;
}

interface Toast {
  id: number;
  text: string;
  action?: { label: string; run: () => void };
}

const HobbyApp = ({ hobby: hobbyId, initialDoc }: { hobby: HobbyId; initialDoc: HobbyDoc }) => {
  const hobby = hobbyById(hobbyId)!;
  const [doc, setDoc] = useState(initialDoc);
  const admin = useAdmin();
  const wide = useWide();
  const view = parseSearch(useSearch());
  const [edit, setEdit] = useState<Edit | null>(null);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const cards = runQuery(doc, view);
  const total = doc.cards.filter((c) => !c.deletedAt).length;
  const selected = view.card ? doc.cards.find((c) => c.id === view.card && !c.deletedAt) ?? null : null;
  const creating = !!edit && edit.draft.card.id === null;
  const panelOpen = !!selected || creating;
  const dirty = !!edit && !sameDraft(edit.draft, edit.base);
  const show = edit ? draftShow(edit.draft) : doc.show;
  const spotOf = (c: Card | null) => (c ? doc.cards.indexOf(c) : 0);

  // ---- toasts -------------------------------------------------------------
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const say = useCallback((text: string, action?: Toast["action"]) => {
    clearTimeout(toastTimer.current);
    setToast({ id: Date.now(), text, action });
    toastTimer.current = setTimeout(() => setToast(null), action ? 7000 : 4000);
  }, []);

  // ---- leaving an edit ----------------------------------------------------
  const dirtyRef = useRef(false);
  useEffect(() => {
    dirtyRef.current = dirty;
  }, [dirty]);
  /** True when it's fine to move on: nothing unsaved, or the admin agreed to drop it. */
  const leave = useCallback(
    () => !dirtyRef.current || window.confirm("Discard your unsaved changes?"),
    [],
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ---- actions ------------------------------------------------------------
  const run = async (act: () => Promise<ActionResult>, ok?: (r: Extract<ActionResult, { ok: true }>) => void) => {
    setBusy(true);
    try {
      const r = await act();
      if (r.ok) {
        setDoc(r.doc);
        ok?.(r);
        return true;
      }
      say(r.error);
      return false;
    } catch {
      say("Couldn't reach the server. Try again in a moment.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const open = (c: Card) => {
    if (c.id === view.card && !edit) return;
    if (!leave()) return;
    setEdit(null);
    // On a phone the card opens over the grid, so Back should close it.
    setSearch({ card: c.id }, !view.card);
  };
  const close = () => {
    if (!leave()) return;
    setEdit(null);
    if (view.card) setSearch({ card: null });
  };
  const startEdit = () => {
    if (!selected) return;
    const d = draftFrom(doc, selected);
    setEdit({ draft: d, base: d });
  };
  const startNew = () => {
    if (!leave()) return;
    const d = draftFrom(doc, null);
    setEdit({ draft: d, base: d });
    if (view.card) setSearch({ card: null });
  };
  const cancel = () => {
    if (!leave()) return;
    setEdit(null);
  };
  const setDraft = (fn: (d: Draft) => Draft) => setEdit((e) => (e ? { ...e, draft: fn(e.draft) } : e));

  const save = async () => {
    if (!edit || busy) return;
    const d = edit.draft;
    await run(
      () => saveCard({ hobby: hobbyId, card: d.card, fields: d.fields, show: d.show }),
      (r) => {
        setEdit(null);
        if (r.cardId && r.cardId !== view.card) setSearch({ card: r.cardId }, !view.card);
        say(d.card.id ? "Saved." : "Card added.");
      },
    );
  };

  const remove = async () => {
    if (!selected) return;
    const gone = selected;
    await run(
      () => deleteCard(hobbyId, gone.id),
      () => {
        setEdit(null);
        setSearch({ card: null });
        say(`Deleted “${gone.title}”.`, {
          label: "Undo",
          run: () => {
            setToast(null);
            void run(
              () => restoreCard(hobbyId, gone.id),
              () => setSearch({ card: gone.id }),
            );
          },
        });
      },
    );
  };

  const lookup = async (url: string) => {
    if (!edit || !url.trim() || url === edit.base.card.url) return;
    const found = await lookupLink(url).catch(() => ({}) as { title?: string; image?: string });
    setEdit((e) => {
      if (!e || e.draft.card.url !== url) return e;
      return {
        ...e,
        draft: {
          ...e.draft,
          card: { ...e.draft.card, title: e.draft.card.title.trim() ? e.draft.card.title : found.title ?? "" },
          previewImage: youTube(url) ? undefined : found.image,
        },
      };
    });
  };

  // ---- keyboard: Esc cancels or closes, Ctrl+S saves -----------------------
  const keys = useRef({ save, cancel, close, editing: false, open: false });
  useEffect(() => {
    keys.current = { save, cancel, close, editing: !!edit, open: panelOpen };
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = keys.current;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && k.editing) {
        e.preventDefault();
        void k.save();
      } else if (e.key === "Escape" && !e.defaultPrevented) {
        if (k.editing) k.cancel();
        else if (k.open && !(e.target instanceof HTMLInputElement)) k.close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // A deleted or unknown card in the URL: drop it.
  useEffect(() => {
    if (view.card && !selected) setSearch({ card: null });
  }, [view.card, selected]);

  // ---- tags ---------------------------------------------------------------
  const tagOps = {
    onAdd: (name: string) => run(() => addTag(hobbyId, name)),
    onRename: (t: Tag, name: string) =>
      run(
        () => renameTag(hobbyId, t.id, name),
        () => {
          if (view.tag === slug(t.name)) setSearch({ tag: slug(name) });
        },
      ),
    onMove: (t: Tag, by: -1 | 1) => void run(() => moveTag(hobbyId, t.id, by)),
    onDelete: (t: Tag) => {
      const n = doc.cards.filter((c) => !c.deletedAt && c.tagIds.includes(t.id)).length;
      if (!window.confirm(`Delete the tag “${t.name}”? ${n ? `It comes off ${n} card${n === 1 ? "" : "s"}.` : "No cards use it."}`)) return;
      void run(
        () => deleteTag(hobbyId, t.id),
        () => {
          if (view.tag === slug(t.name)) setSearch({ tag: null });
        },
      );
    },
  };

  const panel = panelOpen ? (
    <CardPanel
      hobby={hobby}
      doc={doc}
      card={selected}
      draft={edit?.draft ?? null}
      admin={admin}
      busy={busy}
      spot={spotOf(selected)}
      onClose={close}
      onEdit={startEdit}
      onCancel={cancel}
      onSave={save}
      onDelete={remove}
      setDraft={setDraft}
      onLookup={lookup}
    />
  ) : null;

  const filtered = !!(view.tag || view.q.trim() || view.progress.length || view.contains.trim());

  return (
    <div data-hobby={hobbyId} className="relative min-h-dvh overflow-x-clip">
      {/* The ground: dots, the hobby's glow, and its mark, large and faint. */}
      <div aria-hidden="true" className="hb-dots pointer-events-none fixed inset-0 -z-10">
        <div className="absolute top-[120px] right-[6%] size-[640px] rounded-full bg-[radial-gradient(circle,var(--hb)_0%,transparent_62%)] opacity-[0.16]" />
        <Mark d={hobby.mark} strokeWidth={0.09} className="text-hb absolute -top-[120px] -right-[220px] size-[980px] opacity-[0.22]" />
      </div>

      <HobbyNav hobby={hobbyId} leave={leave} />

      <main className="mx-auto flex w-full max-w-[1376px] flex-col gap-6 px-4 pt-24 pb-16 sm:px-8 lg:pt-28">
        <header className="flex flex-col">
          <div className="flex items-end justify-between gap-8">
            <div className="hb-rise flex max-w-[600px] flex-col gap-2 pb-6">
              <span className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm font-medium tracking-wide">
                Hobbies
                {admin && (
                  <>
                    <span className="border-hb/35 bg-hb/14 text-hb-ink inline-flex h-7 items-center gap-1.5 rounded-full border px-3 text-[13px] tracking-normal">
                      <span className="bg-hb size-1.5 rounded-full" />
                      Admin
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (leave()) void logout(hobbyId);
                      }}
                      className="hover:text-foreground flex cursor-pointer items-center gap-1.5 tracking-normal underline-offset-[3px] hover:underline"
                    >
                      <LogOut size={14} aria-hidden="true" />
                      Log out
                    </button>
                  </>
                )}
              </span>
              <h1 className="font-display text-(color:--hb-title) text-[clamp(3.5rem,9vw,5.25rem)] leading-[0.92] font-bold tracking-[-3px]">
                {hobby.name}
              </h1>
              <p className="text-muted-foreground mt-1 max-w-[520px] text-[15px] leading-normal">{hobby.blurb}</p>
            </div>
            <div className="relative z-[2] -mb-3 flex shrink-0 items-end gap-1 pr-10 max-sm:hidden">
              <span className="font-hand text-hb-ink hb-rise relative -top-14 -rotate-5 text-[26px] leading-none">
                {hobby.quip}
              </span>
              <span className="hb-bob inline-flex">
                <Doodle hobby={hobbyId} />
              </span>
            </div>
          </div>
          <Toolbar view={view} hobbyName={hobby.name} fields={doc.fields} admin={admin} onNew={startNew} />
        </header>

        <div className="flex items-start gap-5">
          <section aria-label="Cards" className="flex min-w-0 flex-1 flex-col">
            <TagTabs doc={doc} active={view.tag} admin={admin} busy={busy} {...tagOps} />
            <div className="hb-glass flex flex-col gap-3.5 rounded-[28px] px-4 pt-[18px] pb-5 sm:px-5">
              <div className="text-muted-foreground flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
                <span>
                  {cards.length} of {total}
                </span>
                {filtered && (
                  <button
                    type="button"
                    onClick={() => setSearch({ tag: null, q: null, progress: null, field: null, has: null })}
                    className="hover:text-foreground cursor-pointer underline underline-offset-[3px]"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              {cards.length > 0 ? (
                <div className="grid grid-cols-[repeat(auto-fill,minmax(min(200px,100%),1fr))] gap-3.5 max-sm:grid-cols-2">
                  {cards.map((c, i) => (
                    <CardTile
                      key={c.id}
                      card={c}
                      doc={doc}
                      show={show}
                      mark={hobby.mark}
                      spot={spotOf(c)}
                      selected={c.id === view.card}
                      delay={120 + Math.min(i, 12) * 60}
                      onOpen={() => open(c)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 px-4 py-12 text-center">
                  <span className="font-hand text-hb-ink text-[34px]">hmm, nothing here yet</span>
                  <span className="text-muted-foreground text-sm">
                    {filtered
                      ? "Try another tag, or loosen the filters."
                      : admin
                        ? "Add the first card with New card."
                        : "Check back soon."}
                  </span>
                </div>
              )}
              <span className="font-hand text-faint self-center pt-1.5 text-[22px]">
                learnt slowly, logged happily — Tom
              </span>
            </div>
          </section>

          <aside
            aria-label="Card details"
            className="hb-glass sticky top-24 hidden max-h-[calc(100dvh-7rem)] w-[min(460px,36vw)] shrink-0 overflow-y-auto rounded-[30px] p-3.5 [scrollbar-width:thin] lg:block"
          >
            {wide && panel ? (
              panel
            ) : (
              <div className="flex flex-col items-center gap-1.5 px-6 py-[70px] text-center">
                <span className="font-hand text-hb-ink text-[34px]">pick a card, any card</span>
                <span className="text-muted-foreground text-sm">Its details and video open here.</span>
              </div>
            )}
          </aside>
        </div>
      </main>

      {/* Phones and narrow windows: the card opens as a sheet over the grid. */}
      {!wide && panel && (
        <div className="fixed inset-0 z-[110] lg:hidden" role="dialog" aria-modal="true" aria-label="Card details">
          <div className="hb-fade absolute inset-0 bg-(--hb-scrim) backdrop-blur-[4px]" onClick={close} />
          <div className="hb-sheet hb-pop absolute inset-x-0 bottom-0 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-[34px] border-b-0">
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="bg-muted-foreground/40 h-[5px] w-10 rounded-full" />
            </div>
            <div className="overflow-y-auto px-3 pb-7">{panel}</div>
          </div>
        </div>
      )}

      {!admin && <AdminDoor hobby={hobbyId} />}

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="hb-pop hb-rise fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-full py-2 pr-2 pl-5 text-sm shadow-lg"
        >
          <span>{toast.text}</span>
          {toast.action ? (
            <button
              type="button"
              onClick={toast.action.run}
              className="bg-hb-btn text-hb-on h-9 cursor-pointer rounded-full px-4 font-semibold"
            >
              {toast.action.label}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setToast(null)}
              aria-label="Dismiss"
              className={cn("text-muted-foreground hover:text-foreground h-9 cursor-pointer rounded-full px-3")}
            >
              OK
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default HobbyApp;
