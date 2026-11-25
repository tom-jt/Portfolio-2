import { cardImage, type Card, type HobbyDoc, type Show, type Tag } from "@/lib/hobby/model";
import { cn } from "@/lib/utils";
import { ProgressBadge, TagChip, Thumb } from "./bits";

/** One card in the grid: picture, title, tags, progress, and any extra
 *  fields the tab's eyes have switched on. */
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

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-pressed={selected}
      style={{ animationDelay: `${delay}ms` }}
      className={cn(
        "hb-rise bg-muted flex cursor-pointer flex-col rounded-[20px] border p-2 text-left transition-[transform,border-color,box-shadow] duration-250 hover:-translate-y-[3px]",
        selected
          ? "border-hb/70 shadow-[0_0_0_4px_rgb(var(--hb-rgb)/0.16)]"
          : "border-border",
      )}
    >
      {show.thumb && (
        <Thumb
          image={cardImage(card)}
          mark={mark}
          spot={spot}
          className="aspect-video w-full rounded-[13px]"
          markClassName="-right-4 -bottom-6 size-[140px]"
        />
      )}
      <span className="flex flex-col gap-2 px-2 pt-3 pb-2">
        {show.title && (
          <span className="font-display text-[19px] leading-tight font-semibold tracking-[-0.2px]">
            {card.title}
          </span>
        )}
        {show.tags && tags.length > 0 && (
          <span className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <TagChip key={t.id} tag={t} />
            ))}
          </span>
        )}
        {(show.progress || info.length > 0) && (
          <span className="flex flex-wrap items-center justify-between gap-2">
            {show.progress && <ProgressBadge progress={card.progress} />}
            {info.length > 0 && (
              <span className="text-faint min-w-0 truncate text-[13px]">
                {info.map((f) => card.values[f.id]).join(" | ")}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  );
};

export default CardTile;
