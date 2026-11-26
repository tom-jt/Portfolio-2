"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { setSearch, type View } from "@/lib/hobby/client";
import {
  DEFAULT_DIR,
  PROGRESS,
  SORTS,
  type Field,
  type SortKey,
} from "@/lib/hobby/model";
import { cn } from "@/lib/utils";
import { ProgressMark } from "./bits";
import Select from "./Select";

/** Search, filters, and sort, kept quiet: a search line on the page, and
 *  text buttons for the rest. Tags are on the tape strips below. */
const Toolbar = ({
  view,
  hobbyName,
  fields,
  admin,
  onNew,
}: {
  view: View;
  hobbyName: string;
  fields: Field[];
  admin: boolean;
  onNew: () => void;
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const filterCount = view.progress.length + (view.contains.trim() ? 1 : 0);

  useEffect(() => {
    if (!filterOpen) return;
    const away = (e: PointerEvent) => {
      if (!filterRef.current?.contains(e.target as Node)) setFilterOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      // A dropdown inside handles its own Esc and marks it handled.
      if (e.key === "Escape" && !e.defaultPrevented) setFilterOpen(false);
    };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [filterOpen]);

  const toggleProgress = (p: string) => {
    const lower = view.progress.map((x) => x.toLowerCase());
    const key = p.toLowerCase();
    const next = lower.includes(key)
      ? lower.filter((x) => x !== key)
      : [...lower, key];
    setSearch({ progress: next.join(",") || null });
  };

  const seg = (on: boolean) =>
    cn(
      "h-8 cursor-pointer px-1 text-[13px] font-medium underline-offset-[5px] transition",
      on
        ? "text-foreground decoration-hb underline decoration-2"
        : "text-muted-foreground hover:text-foreground",
    );

  return (
    <div
      role="search"
      className="relative z-10 flex w-full flex-wrap items-end gap-x-6 gap-y-2"
    >
      <div className="border-foreground/25 focus-within:border-hb flex h-11 max-w-[640px] min-w-0 flex-[1_1_320px] items-center gap-2.5 border-b-[1.5px] transition-colors">
        <Search
          size={18}
          className="text-muted-foreground shrink-0"
          aria-hidden="true"
        />
        <label htmlFor="hb-q" className="sr-only">
          Search cards
        </label>
        <input
          id="hb-q"
          value={view.q}
          onChange={(e) => setSearch({ q: e.target.value })}
          placeholder={`Search ${hobbyName}`}
          className="placeholder:text-faint h-10 min-w-0 flex-1 bg-transparent text-base outline-none"
        />
        {view.q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setSearch({ q: null })}
            className="text-muted-foreground hover:text-foreground grid size-8 cursor-pointer place-items-center rounded-full"
          >
            <X size={15} />
          </button>
        )}
        <div
          role="group"
          aria-label="Search in"
          className="flex shrink-0 items-center gap-1"
        >
          <button
            type="button"
            aria-pressed={view.mode === "title"}
            onClick={() => setSearch({ in: null })}
            className={seg(view.mode === "title")}
          >
            Title
          </button>
          <span className="text-faint text-xs" aria-hidden="true">
            |
          </span>
          <button
            type="button"
            aria-pressed={view.mode === "all"}
            onClick={() => setSearch({ in: "all" })}
            className={seg(view.mode === "all")}
          >
            Everything
          </button>
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <div ref={filterRef} className="relative">
          <button
            type="button"
            aria-expanded={filterOpen}
            onClick={() => setFilterOpen((o) => !o)}
            className={cn(
              "flex h-11 cursor-pointer items-center gap-1.5 font-medium transition",
              filterOpen || filterCount > 0
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontal size={15} aria-hidden="true" />
            Filter
            {filterCount > 0 && (
              <span className="border-hb text-hb-ink font-hand grid size-6 place-items-center rounded-full border-[1.5px] text-lg leading-none">
                {filterCount}
              </span>
            )}
          </button>
          {filterOpen && (
            <div className="hb-pop hb-drop absolute top-12 right-0 z-30 flex w-[min(340px,calc(100vw-2rem))] flex-col gap-3 rounded-[22px] p-[18px] max-sm:-right-24">
              <span className="text-muted-foreground text-[13px]">
                Progress
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PROGRESS.map((p) => {
                  const on = view.progress.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleProgress(p)}
                      className={cn(
                        "flex h-[38px] cursor-pointer items-center gap-[7px] rounded-xl border px-[13px] text-[13px] font-medium transition",
                        on
                          ? `hb-chip hb-p-${p.toLowerCase()}`
                          : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      <ProgressMark progress={p} size={14} />
                      {p}
                    </button>
                  );
                })}
              </div>
              <span className="text-muted-foreground pt-1 text-[13px]">
                Other fields
              </span>
              <div className="flex gap-1.5">
                <Select
                  label="Field"
                  value={view.field}
                  options={[
                    { value: "", label: "Any field" },
                    ...fields.map((f) => ({ value: f.id, label: f.name })),
                  ]}
                  onChange={(field) => setSearch({ field: field || null })}
                  className="border-input bg-field h-10 w-[128px] shrink-0 rounded-xl border px-3 text-sm"
                />
                <label htmlFor="hb-fv" className="sr-only">
                  Contains
                </label>
                <input
                  id="hb-fv"
                  value={view.contains}
                  onChange={(e) => setSearch({ has: e.target.value })}
                  placeholder="contains…"
                  className="border-input bg-field placeholder:text-faint h-10 min-w-0 flex-1 rounded-xl border px-3 text-sm outline-none focus:border-[var(--hb)]"
                />
              </div>
              <div className="flex items-center justify-between pt-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setSearch({ progress: null, field: null, has: null })
                  }
                  className="text-muted-foreground hover:text-foreground h-10 cursor-pointer text-sm underline underline-offset-[3px]"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  className="bg-hb-btn text-hb-on h-10 cursor-pointer rounded-xl px-[18px] text-sm font-semibold"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex h-11 items-center gap-1">
          <span className="text-muted-foreground" aria-hidden="true">
            Sort
          </span>
          <Select
            label="Sort by"
            value={view.sort}
            options={(Object.keys(SORTS) as SortKey[]).map((k) => ({
              value: k,
              label: SORTS[k],
            }))}
            onChange={(sort) =>
              setSearch({ sort: sort === "updated" ? null : sort, dir: null })
            }
            align="right"
            className="decoration-foreground/40 h-9 w-[112px] text-sm font-medium underline decoration-dashed underline-offset-4"
          />
          <button
            type="button"
            onClick={() => {
              const dir = view.dir === "asc" ? "desc" : "asc";
              setSearch({ dir: dir === DEFAULT_DIR[view.sort] ? null : dir });
            }}
            aria-label={
              view.dir === "asc"
                ? "Ascending, switch to descending"
                : "Descending, switch to ascending"
            }
            title={view.dir === "asc" ? "Ascending" : "Descending"}
            className="text-muted-foreground hover:text-foreground grid size-8 cursor-pointer place-items-center rounded-full"
          >
            {view.dir === "asc" ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
          </button>
        </div>

        {admin && (
          <button
            type="button"
            onClick={onNew}
            className="bg-hb-btn text-hb-on flex h-10 cursor-pointer items-center gap-2 rounded-md px-4 text-sm font-semibold"
          >
            <Plus size={16} strokeWidth={2.4} aria-hidden="true" />
            New card
          </button>
        )}
      </div>
    </div>
  );
};

export default Toolbar;
