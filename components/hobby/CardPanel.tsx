"use client";

import { useState } from "react";
import {
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Lock,
  Pencil,
  Play,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { Hobby } from "@/data/hobby/hobbies";
import type { Draft } from "@/lib/hobby/draft";
import {
  cardImage,
  LIMITS,
  MAX_FIELDS,
  PROGRESS,
  shortUrl,
  youTube,
  youTubeEmbed,
  type Card,
  type HobbyDoc,
} from "@/lib/hobby/model";
import { cn } from "@/lib/utils";
import { Stamp, TagChip, TagNote, Thumb } from "./bits";

const isNotes = (name: string) => name.trim().toLowerCase() === "notes";

/** Washi tape across the top corners, in the hobby's colour. */
const Tape = () => (
  <>
    <span
      aria-hidden="true"
      className="absolute -top-1.5 -left-2.5 z-[3] h-6 w-[78px] -rotate-12 opacity-85"
      style={{
        backgroundColor: "rgb(var(--hb-rgb) / 0.55)",
        backgroundImage: "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.22) 0 4px, transparent 4px 9px)",
      }}
    />
    <span
      aria-hidden="true"
      className="absolute -top-1 -right-2 z-[3] h-6 w-16 rotate-9 opacity-85"
      style={{
        backgroundColor: "rgb(var(--hb-rgb) / 0.55)",
        backgroundImage: "repeating-linear-gradient(45deg, rgb(255 255 255 / 0.22) 0 4px, transparent 4px 9px)",
      }}
    />
  </>
);

/** A photo stuck on the index card: a white border and a small tilt. */
const photo =
  "fit:max-h-[26dvh] fit-short:max-h-[22dvh] relative block aspect-video w-full -rotate-1 overflow-hidden rounded-[2px] border-[7px] border-white shadow-[0_6px_14px_rgb(40_30_60/0.18)]";

/** The card's picture; a click plays its YouTube video in place, or opens
 *  any other link in a new tab. */
const Media = ({ card, mark, spot }: { card: Card; mark: string; spot: number }) => {
  const [playing, setPlaying] = useState(false);
  const yt = youTube(card.url);
  if (!card.url) {
    return (
      <div className="bg-muted fit:max-h-[26dvh] fit-short:max-h-[22dvh] grid aspect-video place-items-center rounded-[2px] border-[7px] border-white shadow-[0_6px_14px_rgb(40_30_60/0.18)]">
        <span className="font-hand text-hb-ink text-[28px]">no video for this one</span>
      </div>
    );
  }
  if (yt && playing) {
    return (
      <div className="fit:max-h-[26dvh] fit-short:max-h-[22dvh] relative aspect-video overflow-hidden rounded-[2px] border-[7px] border-white bg-black shadow-[0_6px_14px_rgb(40_30_60/0.18)]">
        <iframe
          src={youTubeEmbed(yt)}
          title={card.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
        <button
          type="button"
          onClick={() => setPlaying(false)}
          aria-label="Close video"
          className="absolute top-2.5 right-2.5 grid size-9 cursor-pointer place-items-center rounded-full bg-black/60 text-white"
        >
          <X size={14} strokeWidth={2.4} />
        </button>
      </div>
    );
  }
  const inner = (
    <>
      <Thumb
        image={cardImage(card)}
        mark={mark}
        spot={spot}
        className="absolute inset-0"
        markClassName="-right-7 -bottom-10 size-[210px]"
      />
      <span className="hb-lens absolute top-1/2 left-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full">
        {yt ? <Play size={22} fill="currentColor" className="ml-1" /> : <ExternalLink size={20} />}
      </span>
    </>
  );
  return yt ? (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${card.title}`}
      className={cn(photo, "cursor-pointer")}
    >
      {inner}
    </button>
  ) : (
    <a
      href={card.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Open ${card.title} in a new tab`}
      className={photo}
    >
      {inner}
    </a>
  );
};

const EyeButton = ({ on, what, onClick }: { on: boolean; what: string; onClick: () => void }) => {
  const label = `${on ? "Shown" : "Hidden"} on the grid for every card in this tab. Click to ${on ? "hide" : "show"} ${what}.`;
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-10 cursor-pointer place-items-center rounded-full transition hover:bg-accent",
        on ? "text-foreground" : "text-faint/70",
      )}
    >
      {on ? <Eye size={18} /> : <EyeOff size={18} />}
    </button>
  );
};

const Preset = () => (
  <span title="Preset field, can't be deleted" className="text-faint/60 flex justify-center">
    <Lock size={14} aria-label="Preset field, can't be deleted" />
  </span>
);

const input =
  "rounded-[10px] border border-transparent bg-transparent outline-none transition hover:border-border hover:bg-muted focus:border-[var(--hb)] focus:bg-field";
const row = "grid grid-cols-[80px_minmax(0,1fr)_40px_28px] items-center gap-1.5 rounded-[14px] px-1.5 transition hover:bg-muted/60";

const Editor = ({
  hobby,
  doc,
  draft,
  setDraft,
  onLookup,
}: {
  hobby: Hobby;
  doc: HobbyDoc;
  draft: Draft;
  setDraft: (fn: (d: Draft) => Draft) => void;
  onLookup: (url: string) => void;
}) => {
  const [tagInput, setTagInput] = useState("");
  const d = draft;
  const card = (patch: Partial<Draft["card"]>) => setDraft((x) => ({ ...x, card: { ...x.card, ...patch } }));
  const eye = (k: "thumb" | "title" | "tags" | "progress") => () =>
    setDraft((x) => ({ ...x, show: { ...x.show, [k]: !x.show[k] } }));

  const typed = tagInput.trim();
  const has = (name: string) => d.card.tags.some((t) => t.name.toLowerCase() === name.toLowerCase());
  const suggestions = doc.tags.filter(
    (t) => !has(t.name) && (!typed || t.name.toLowerCase().includes(typed.toLowerCase())),
  );
  const canCreate = typed && !has(typed) && !doc.tags.some((t) => t.name.toLowerCase() === typed.toLowerCase());
  const addTag = (tag: { id?: string; name: string }) => {
    card({ tags: [...d.card.tags, tag] });
    setTagInput("");
  };
  const colourOf = (t: { id?: string; name: string }) =>
    doc.tags.find((x) => x.id === t.id)?.colour ??
    // A tag made in this edit: a stable colour from its name until saved.
    [...t.name].reduce((n, c) => n + c.charCodeAt(0), 0) % 7;

  return (
    <div className="flex flex-col gap-0.5 pt-4 pr-1 pb-1 pl-5">
      <div className={cn(row, "min-h-[54px]")}>
        <label htmlFor="hb-e-title" className="text-faint text-[13px]">
          Title
        </label>
        <input
          id="hb-e-title"
          value={d.card.title}
          maxLength={LIMITS.title}
          onChange={(e) => card({ title: e.target.value })}
          placeholder="Untitled"
          className={cn(input, "font-display h-11 min-w-0 px-2.5 text-[22px] font-bold placeholder:text-faint")}
        />
        <EyeButton on={d.show.title} what="the title" onClick={eye("title")} />
        <Preset />
      </div>
      <div className={cn(row, "min-h-[50px]")}>
        <label htmlFor="hb-e-url" className="text-faint text-[13px]">
          Link
        </label>
        <input
          id="hb-e-url"
          type="url"
          value={d.card.url}
          maxLength={LIMITS.url}
          onChange={(e) => card({ url: e.target.value })}
          onBlur={(e) => onLookup(e.target.value)}
          placeholder="Paste a YouTube link"
          className={cn(input, "h-10 min-w-0 px-2.5 text-sm placeholder:text-faint")}
        />
        <EyeButton on={d.show.thumb} what="the picture" onClick={eye("thumb")} />
        <Preset />
      </div>
      <div className={cn(row, "items-start py-2")}>
        <span className="text-faint pt-[7px] text-[13px]">Tags</span>
        <div className="flex flex-col gap-2 px-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {[...d.card.tags]
              .sort((a, b) => a.name.localeCompare(b.name))
              .map((t) => (
                <TagChip key={t.id ?? t.name} tag={{ name: t.name, colour: colourOf(t) }} large className="h-[30px] pr-0.5">
                  <button
                    type="button"
                    onClick={() => card({ tags: d.card.tags.filter((x) => x !== t) })}
                    aria-label={`Remove tag ${t.name}`}
                    className="grid size-[26px] cursor-pointer place-items-center rounded-md"
                  >
                    <X size={11} strokeWidth={3} />
                  </button>
                </TagChip>
              ))}
            <label htmlFor="hb-e-tag" className="sr-only">
              Add a tag
            </label>
            <input
              id="hb-e-tag"
              value={tagInput}
              maxLength={LIMITS.tagName}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== "Enter" || !typed) return;
                e.preventDefault();
                const existing = doc.tags.find((t) => t.name.toLowerCase() === typed.toLowerCase());
                if (has(typed)) setTagInput("");
                else addTag(existing ? { id: existing.id, name: existing.name } : { name: typed });
              }}
              placeholder="+ add tag"
              className={cn(input, "h-[30px] w-[110px] px-2 text-[13px] placeholder:text-faint")}
            />
          </div>
          {(suggestions.length > 0 || canCreate) && (
            <div className="flex flex-wrap gap-1.5">
              {canCreate && (
                <button
                  type="button"
                  onClick={() => addTag({ name: typed })}
                  className="border-input h-7 cursor-pointer rounded-lg border border-dashed px-2.5 text-xs"
                >
                  Create “{typed}”
                </button>
              )}
              {suggestions.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => addTag({ id: t.id, name: t.name })}
                  className={`hb-tag-${t.colour} h-7 cursor-pointer rounded-lg border border-dashed border-[rgb(var(--t)/0.38)] px-2.5 text-xs text-(--t-ink)`}
                >
                  + {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
        <EyeButton on={d.show.tags} what="tags" onClick={eye("tags")} />
        <span className="pt-3.5">
          <Preset />
        </span>
      </div>
      <div className={cn(row, "min-h-[54px]")}>
        <span className="text-faint text-[13px]">Progress</span>
        <div role="radiogroup" aria-label="Progress" className="bg-field border-border ml-1 flex gap-0.5 justify-self-start rounded-[13px] border p-[3px]">
          {PROGRESS.map((p) => {
            const on = d.card.progress === p;
            return (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => card({ progress: p })}
                className={cn(
                  "flex h-[34px] cursor-pointer items-center rounded-[10px] px-2.5 text-[13px] transition",
                  on ? `hb-chip hb-p-${p.toLowerCase()} border-transparent` : "text-muted-foreground hover:text-foreground",
                )}
              >
                {p}
              </button>
            );
          })}
        </div>
        <EyeButton on={d.show.progress} what="progress" onClick={eye("progress")} />
        <Preset />
      </div>

      <div className="flex items-center gap-2.5 px-1.5 pt-3.5 pb-1.5">
        <span className="text-faint text-xs">Fields for every {hobby.name} card</span>
        <span className="bg-border h-px flex-1" />
      </div>

      {d.fields.map((f) => (
        <div key={f.key} className={cn(row, isNotes(f.name) ? "items-start py-1.5" : "min-h-[50px]")}>
          <input
            aria-label="Field name"
            value={f.name}
            maxLength={LIMITS.fieldName}
            onChange={(e) =>
              setDraft((x) => ({ ...x, fields: x.fields.map((y) => (y.key === f.key ? { ...y, name: e.target.value } : y)) }))
            }
            className={cn(input, "text-muted-foreground -ml-1.5 h-9 min-w-0 px-1.5 text-[13px]")}
          />
          {isNotes(f.name) ? (
            <textarea
              aria-label={`${f.name} value`}
              value={d.card.values[f.key] ?? ""}
              maxLength={LIMITS.value}
              rows={3}
              onChange={(e) => card({ values: { ...d.card.values, [f.key]: e.target.value } })}
              placeholder="Empty"
              className={cn(input, "min-w-0 resize-y px-2.5 py-2 text-sm leading-relaxed placeholder:text-faint")}
            />
          ) : (
            <input
              aria-label={`${f.name} value`}
              value={d.card.values[f.key] ?? ""}
              maxLength={LIMITS.value}
              onChange={(e) => card({ values: { ...d.card.values, [f.key]: e.target.value } })}
              placeholder="Empty"
              className={cn(input, "h-10 min-w-0 px-2.5 text-sm placeholder:text-faint")}
            />
          )}
          <EyeButton
            on={!!d.show.fields[f.key]}
            what={f.name}
            onClick={() =>
              setDraft((x) => ({ ...x, show: { ...x.show, fields: { ...x.show.fields, [f.key]: !x.show.fields[f.key] } } }))
            }
          />
          <button
            type="button"
            onClick={() => {
              if (f.id && !window.confirm(`Delete the ${f.name} field from every ${hobby.name} card? It goes when you save.`)) return;
              setDraft((x) => ({ ...x, fields: x.fields.filter((y) => y.key !== f.key) }));
            }}
            aria-label={`Delete field ${f.name} from all ${hobby.name} cards`}
            title={`Delete field from all ${hobby.name} cards`}
            className="text-faint hover:text-foreground grid h-10 w-7 cursor-pointer place-items-center rounded-[10px]"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ))}

      <div className="flex flex-wrap items-center justify-between gap-2.5 px-1.5 pt-2.5 pb-1">
        <button
          type="button"
          disabled={d.fields.length >= MAX_FIELDS}
          onClick={() => {
            const key = `new-${Date.now()}`;
            setDraft((x) => ({
              ...x,
              fields: [...x.fields, { id: null, key, name: "New field" }],
              show: { ...x.show, fields: { ...x.show.fields, [key]: false } },
            }));
          }}
          className="border-input flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-3.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={13} strokeWidth={2.4} />
          Add field
          <span className="text-faint">
            {d.fields.length} / {MAX_FIELDS}
          </span>
        </button>
        <span className="font-hand text-muted-foreground -rotate-2 text-[22px]">
          eye = on the grid for every {hobby.name} card
        </span>
      </div>
    </div>
  );
};

const View = ({ doc, card }: { doc: HobbyDoc; card: Card }) => {
  const tags = card.tagIds
    .map((id) => doc.tags.find((t) => t.id === id))
    .filter((t) => t !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));
  const fields = doc.fields.filter((f) => card.values[f.id]);
  const notes = fields.filter((f) => isNotes(f.name));
  const rest = fields.filter((f) => !isNotes(f.name));
  return (
    <div className="flex flex-col gap-2.5 pt-4 pr-2.5 pb-1 pl-6">
      <div className="flex items-start justify-between gap-3">
        <h2
          id="hb-card-title"
          className="font-display text-[30px] leading-[1.04] font-semibold tracking-[-0.6px] text-balance"
        >
          {card.title}
        </h2>
        <Stamp progress={card.progress} size={1.05} className="mt-1 -rotate-6" />
      </div>
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {tags.map((t) => (
            <TagNote key={t.id} tag={t} className="text-[24px]" />
          ))}
        </div>
      )}
      {/* Fields and notes, written on the card's ruled lines. */}
      {rest.length > 0 && (
        <dl className="hb-ruled font-hand mt-1 text-[22px]">
          {rest.map((f) => (
            <div key={f.id} className="grid grid-cols-[100px_minmax(0,1fr)] gap-3">
              <dt className="text-muted-foreground">{f.name}</dt>
              <dd className="break-words">{card.values[f.id]}</dd>
            </div>
          ))}
        </dl>
      )}
      {notes.map((f) => (
        <div key={f.id} className="font-hand text-[22px]">
          <span className="text-muted-foreground block leading-[30px]">{f.name}</span>
          <p className="hb-ruled break-words whitespace-pre-line">{card.values[f.id]}</p>
        </div>
      ))}
    </div>
  );
};

/**
 * The open card: its details for visitors, and for the admin an editor that
 * saves the card along with the tab's fields and eyes.
 */
const CardPanel = ({
  hobby,
  doc,
  card,
  draft,
  admin,
  busy,
  spot,
  onClose,
  onEdit,
  onCancel,
  onSave,
  onDelete,
  setDraft,
  onLookup,
}: {
  hobby: Hobby;
  doc: HobbyDoc;
  card: Card | null;
  draft: Draft | null;
  admin: boolean;
  busy: boolean;
  spot: number;
  onClose: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onDelete: () => void;
  setDraft: (fn: (d: Draft) => Draft) => void;
  onLookup: (url: string) => void;
}) => {
  const pill = "flex h-10 cursor-pointer items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition";
  const previewImage = draft ? (youTube(draft.card.url) ? cardImage(draft.card) : draft.previewImage ?? card?.image ?? null) : null;

  return (
    <div className="relative">
      <div className="hb-pop sticky top-3 z-[5] float-right mt-3 mr-3 -mb-16 flex items-center gap-0.5 rounded-full p-1">
        {admin && !draft && (
          <button type="button" onClick={onEdit} className={cn(pill, "hover:bg-accent")}>
            <Pencil size={16} /> Edit
          </button>
        )}
        {draft && (
          <>
            <button type="button" onClick={onCancel} className={cn(pill, "text-muted-foreground hover:text-foreground")}>
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={busy}
              className={cn(pill, "bg-hb-btn text-hb-on font-semibold disabled:opacity-60")}
            >
              <Check size={14} strokeWidth={2.6} /> {busy ? "Saving…" : "Save"}
            </button>
          </>
        )}
        {admin && card && (
          <>
            <span className="bg-border mx-1 h-[22px] w-px" />
            <button
              type="button"
              onClick={onDelete}
              disabled={busy}
              aria-label="Delete card"
              title="Delete card"
              className="text-destructive hover:bg-accent grid size-10 cursor-pointer place-items-center rounded-full"
            >
              <Trash2 size={17} />
            </button>
          </>
        )}
        {!draft && card?.url && (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${shortUrl(card.url)} in a new tab`}
            title={shortUrl(card.url)}
            className="hover:bg-accent grid size-10 place-items-center rounded-full"
          >
            <ExternalLink size={16} />
          </a>
        )}
        {!draft && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close details"
            className="hover:bg-accent grid size-10 cursor-pointer place-items-center rounded-full"
          >
            <X size={15} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {draft ? (
        <>
          <div className="relative">
            <Thumb
              image={previewImage}
              mark={hobby.mark}
              spot={spot}
              className={cn("aspect-[16/6] rounded-[2px] border-[7px] border-white transition-opacity", !draft.show.thumb && "opacity-40")}
              markClassName="-right-7 -bottom-12 size-[200px]"
            />
          </div>
          <Editor hobby={hobby} doc={doc} draft={draft} setDraft={setDraft} onLookup={onLookup} />
        </>
      ) : card ? (
        <>
          <div className="relative">
            <Tape />
            <Media key={card.id} card={card} mark={hobby.mark} spot={spot} />
          </div>
          <View doc={doc} card={card} />
        </>
      ) : null}
    </div>
  );
};

export default CardPanel;
