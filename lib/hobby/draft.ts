/**
 * An admin's edit in progress: one card, plus the tab-wide fields and eyes,
 * which save together with it. Fields are keyed by a draft key so a field
 * added in this edit can hold values before it has an id.
 */

import type { CardDraft, FieldDraft, SaveInput } from "@/app/hobby/actions";
import type { Card, HobbyDoc, Show } from "./model";

export interface Draft {
  card: CardDraft;
  fields: FieldDraft[];
  show: SaveInput["show"];
  /** A page preview found for a new link, shown until the card is saved. */
  previewImage?: string;
}

export function draftFrom(doc: HobbyDoc, card: Card | null): Draft {
  return {
    card: {
      id: card?.id ?? null,
      title: card?.title ?? "",
      url: card?.url ?? "",
      progress: card?.progress ?? "Todo",
      tags: (card?.tagIds ?? [])
        .map((id) => doc.tags.find((t) => t.id === id))
        .filter((t) => t !== undefined)
        .map((t) => ({ id: t.id, name: t.name })),
      values: { ...(card?.values ?? {}) },
    },
    fields: doc.fields.map((f) => ({ id: f.id, key: f.id, name: f.name })),
    show: { ...doc.show, fields: { ...doc.show.fields } },
  };
}

/** The eyes as the grid should show them while this draft is open. */
export function draftShow(draft: Draft): Show {
  return {
    ...draft.show,
    fields: Object.fromEntries(
      draft.fields.filter((f) => f.id).map((f) => [f.id!, !!draft.show.fields[f.key]]),
    ),
  };
}

export const sameDraft = (a: Draft, b: Draft) =>
  JSON.stringify({ ...a, previewImage: undefined }) === JSON.stringify({ ...b, previewImage: undefined });
