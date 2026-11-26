import type { CSSProperties } from "react";
import { cardImage, type Card, type HobbyDoc, type Show, type Tag } from "@/lib/hobby/model";
import { cn } from "@/lib/utils";
import { hashOf, Stamp, TagNote, Thumb, tiltOf } from "./bits";

/** One card in the grid, as a polaroid: the picture, a handwritten caption,
 *  its tags, a progress stamp, and any extra fields the tab's eyes show. */
const CardTile = ({
  card,
  doc,
  show,
  mark,
  spot,
  selected,
  delay,
  onOpen,
}: {
  card: Card;
  doc: HobbyDoc;
  show: Show;
  mark: string;
  spot: number;
  selected: boolean;
  delay: number;
  onOpen: () => void;
}) => {
  const tags = card.tagIds
    .map((id) => doc.tags.find((t) => t.id === id))
    .filter((t): t is Tag => !!t)
    .sort((a, b) => a.name.localeCompare(b.name));
  const info = doc.fields.filter((f) => show.fields[f.id] && card.values[f.id]);
  const h = hashOf(card.id);
  // Every third card is taped down, in its first tag's colour; the open one
  // always is, in the hobby's.
  const taped = selected || h % 3 === 0;
  const tapeTag = !selected && tags[0] ? tags[0].colour : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      style={{ animationDelay: `${delay}ms`, "--tilt": `${tiltOf(card.id)}deg` } as CSSProperties}
      className="hb-rise hb-paper hb-polaroid relative flex cursor-pointer flex-col p-2.5 pb-3 text-left"
    >
      {taped && (
        <span
          aria-hidden="true"
          className={cn(
            "hb-tape absolute -top-2.5 left-1/2 z-[2] h-[22px] w-[72px] -translate-x-1/2",
            tapeTag !== null && `hb-tag-${tapeTag}`,
          )}
          style={
            {
              rotate: `${h % 2 ? -4 : 5}deg`,
              "--tape": tapeTag !== null ? "rgb(var(--t) / 0.5)" : "rgb(var(--hb-paper-rgb) / 0.6)",
            } as CSSProperties
          }
        />
      )}
      {show.thumb && (
        <Thumb
          image={cardImage(card)}
          mark={mark}
          spot={spot}
          className="aspect-video w-full rounded-[2px]"
          markClassName="-right-4 -bottom-6 size-[140px]"
        />
      )}
      <span className="flex flex-col gap-1.5 px-1 pt-3">
        {show.title && (
          <span className="font-display text-[19px] leading-tight font-medium tracking-[-0.2px] text-balance">
            {card.title}
          </span>
        )}
        {((show.tags && tags.length > 0) || show.progress || info.length > 0) && (
          <span className="flex items-end justify-between gap-2">
            <span className="flex min-w-0 flex-col gap-1">
              {show.tags && tags.length > 0 && (
                <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                  {tags.map((t) => (
                    <TagNote key={t.id} tag={t} className="text-[21px]" />
                  ))}
                </span>
              )}
              {info.length > 0 && (
                <span className="font-hand text-muted-foreground text-[19px] leading-tight">
                  {info.map((f) => card.values[f.id]).join(" | ")}
                </span>
              )}
            </span>
            {show.progress && (
              <Stamp
                progress={card.progress}
                size={0.92}
                className={cn("-mb-1", ["-rotate-6", "rotate-3", "-rotate-2"][h % 3])}
              />
            )}
          </span>
        )}
      </span>
    </button>
  );
};

export default CardTile;
