/**
 * The tab title, shared by everything on /home that wants to show in it
 * (the timer's countdown, an eye-break reminder), so they don't overwrite
 * each other. The page's own title comes back once nothing is shown.
 */

const ORDER = ["eyes", "timer"] as const;
type Part = (typeof ORDER)[number];

const parts = new Map<Part, string>();
let base: string | null = null;

export function setTitlePart(part: Part, text: string | null) {
  if (typeof document === "undefined") return;
  if (base === null) base = document.title;
  if (text) parts.set(part, text);
  else parts.delete(part);

  const shown = ORDER.map((p) => parts.get(p)).filter(Boolean);
  if (shown.length) {
    document.title = shown.join(" · ");
  } else {
    document.title = base;
    base = null;
  }
}
