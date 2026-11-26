"use client";

import { useState, type CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Pencil, Plus, Trash2, Check } from "lucide-react";
import { setSearch } from "@/lib/hobby/client";
import { slug, type HobbyDoc, type Tag } from "@/lib/hobby/model";
import { cn } from "@/lib/utils";

const tab = (active: boolean) =>
  cn(
    "hb-tape flex h-[30px] shrink-0 cursor-pointer items-center gap-1.5 px-4 text-[13px] font-semibold text-[#2a2530] transition-[translate,filter]",
    active ? "-translate-y-0.5 drop-shadow-[0_3px_4px_rgb(0_0_0/0.25)]" : "opacity-85 hover:-translate-y-0.5 hover:opacity-100",
  );

/** Each strip sits a little crooked, and the picked one is fully inked. */
const TILTS = [-3, 2, -1.5, 3, -2.5, 1.5, -1];
const tapeStyle = (i: number, rgb: string, active: boolean) =>
  ({
    rotate: `${TILTS[i % TILTS.length]}deg`,
    "--tape": active
      ? `color-mix(in srgb, rgb(${rgb}) 72%, white)`
      : `color-mix(in srgb, rgb(${rgb}) 30%, #f4efe5)`,
  }) as CSSProperties;

/**
 * The tag filter, as strips of washi tape above the grid, each in its tag's
 * colour. In admin mode a pencil turns them into editors: rename, move,
 * delete, and add.
 */
const TagTabs = ({
  doc,
  active,
  admin,
  busy,
  onAdd,
  onRename,
  onMove,
  onDelete,
}: {
  doc: HobbyDoc;
  active: string | null;
  admin: boolean;
  busy: boolean;
  onAdd: (name: string) => Promise<boolean>;
  onRename: (tag: Tag, name: string) => Promise<boolean>;
  onMove: (tag: Tag, by: -1 | 1) => void;
  onDelete: (tag: Tag) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [names, setNames] = useState<Record<string, string>>({});

  const live = doc.cards.filter((c) => !c.deletedAt);
  const count = (t: Tag) => live.filter((c) => c.tagIds.includes(t.id)).length;
  const activeTag = doc.tags.find((t) => slug(t.name) === active);
  const pick = (t: Tag | null) => setSearch({ tag: t ? slug(t.name) : null });

  if (admin && editing) {
    return (
      <div className="hb-paper mb-3 flex flex-col gap-2 rounded-md p-3 [box-shadow:var(--hb-polaroid-shadow)]">
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-muted-foreground text-[13px]">
            Tags for this tab. Changes save as you make them.
          </span>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="hb-lens flex h-9 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-medium"
          >
            <Check size={15} /> Done
          </button>
        </div>
        <ul className="flex flex-col gap-1">
          {doc.tags.map((t, i) => {
            const draft = names[t.id] ?? t.name;
            const n = count(t);
            return (
              <li key={t.id} className="flex flex-wrap items-center gap-1.5 rounded-xl px-1 py-1">
                <span className={`hb-tag-${t.colour} size-2.5 shrink-0 rounded-[3px] bg-[rgb(var(--t))]`} />
                <label htmlFor={`hb-tag-${t.id}`} className="sr-only">
                  Name of {t.name}
                </label>
                <input
                  id={`hb-tag-${t.id}`}
                  value={draft}
                  onChange={(e) => setNames((m) => ({ ...m, [t.id]: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                  onBlur={async () => {
                    if (draft.trim() && draft.trim() !== t.name) await onRename(t, draft);
                    setNames((m) => {
                      const rest = { ...m };
                      delete rest[t.id];
                      return rest;
                    });
                  }}
                  className="border-input bg-field h-9 min-w-0 flex-1 rounded-lg border px-2.5 text-sm outline-none focus:border-[var(--hb)]"
                />
                <span className="text-faint w-16 text-xs">
                  {n} card{n === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  disabled={busy || i === 0}
                  onClick={() => onMove(t, -1)}
                  aria-label={`Move ${t.name} left`}
                  className="hover:bg-accent grid size-9 cursor-pointer place-items-center rounded-lg disabled:cursor-default disabled:opacity-35"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  disabled={busy || i === doc.tags.length - 1}
                  onClick={() => onMove(t, 1)}
                  aria-label={`Move ${t.name} right`}
                  className="hover:bg-accent grid size-9 cursor-pointer place-items-center rounded-lg disabled:cursor-default disabled:opacity-35"
                >
                  <ChevronRight size={16} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onDelete(t)}
                  aria-label={`Delete ${t.name}`}
                  className="text-destructive hover:bg-accent grid size-9 cursor-pointer place-items-center rounded-lg disabled:opacity-35"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="flex items-center gap-1.5 px-1"
          onSubmit={async (e) => {
            e.preventDefault();
            if (newName.trim() && (await onAdd(newName))) setNewName("");
          }}
        >
          <label htmlFor="hb-new-tag" className="sr-only">
            New tag
          </label>
          <input
            id="hb-new-tag"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New tag"
            className="border-input bg-field placeholder:text-faint h-9 min-w-0 flex-1 rounded-lg border px-2.5 text-sm outline-none focus:border-[var(--hb)]"
          />
          <button
            type="submit"
            disabled={busy || !newName.trim()}
            className="bg-hb-btn text-hb-on flex h-9 cursor-pointer items-center gap-1.5 rounded-lg px-3 text-sm font-semibold disabled:opacity-50"
          >
            <Plus size={15} /> Add
          </button>
        </form>
      </div>
    );
  }

  return (
    <div
      role="tablist"
      aria-label="Tags"
      className="flex items-center gap-2.5 overflow-x-auto px-1 py-2 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible"
    >
      <button
        type="button"
        role="tab"
        aria-selected={!activeTag}
        onClick={() => pick(null)}
        className={tab(!activeTag)}
        style={tapeStyle(0, "var(--hb-rgb)", !activeTag)}
      >
        All
        <span className="font-medium opacity-60">{live.length}</span>
      </button>
      {doc.tags.map((t, i) => {
        const on = activeTag?.id === t.id;
        return (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => pick(on ? null : t)}
            className={cn(tab(on), `hb-tag-${t.colour}`)}
            style={tapeStyle(i + 1, "var(--t)", on)}
          >
            {t.name}
            <span className="font-medium opacity-60">{count(t)}</span>
          </button>
        );
      })}
      {admin && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit tags"
          title="Edit tags"
          className="text-muted-foreground hover:text-foreground ml-1 grid size-9 cursor-pointer place-items-center rounded-full"
        >
          <Pencil size={15} />
        </button>
      )}
    </div>
  );
};

export default TagTabs;
