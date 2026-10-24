/**
 * Colour themes for the /home chrome: cards, chips, glass and accents, never
 * the scene behind them. With none picked, each scene's own palette applies.
 * Kept free of React so the boot script's key and the prefs can share it.
 *
 * Adding a theme:
 *   1. add its id and entry here,
 *   2. add a palette block for it in globals.css
 *      (html[data-home-theme="<id>"] [data-site="home"], [data-home-swatch="<id>"]),
 *   3. give it an `unlock` if it has to be earned.
 */

import type { Unlock } from "./cosmetics";
import { getScene, type SceneId } from "./scenes";

export type ThemeId =
  | "mono"
  | "rose"
  | "glacier"
  | "neon"
  | "meadow"
  | "lavender"
  | "mocha"
  | "ember"
  | "sakura"
  | "aurora"
  | "pastel"
  | "iridescent"
  | "canopy"
  | "tropic"
  | "alpine"
  | "maple";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  /** Its colours in words, for the picker's caption. */
  hint: string;
  /** The scene it was made to sit with, if any. */
  pairsWith?: SceneId;
  /** Earned rather than free. */
  unlock?: Unlock;
}

/** The first row stands on its own; the next follow the classic scenes and
 *  then the picture scenes they were made for; the earned ones come last. */
export const THEMES: ThemeMeta[] = [
  { id: "mono", name: "mono", hint: "black and white" },
  { id: "rose", name: "rose", hint: "red and pink" },
  { id: "glacier", name: "glacier", hint: "icy blue and white", pairsWith: "p-moonlight" },
  { id: "neon", name: "neon", hint: "pink and cyan", pairsWith: "rain" },
  {
    id: "meadow",
    name: "meadow",
    hint: "grass and buttercups",
    pairsWith: "hill",
  },
  {
    id: "lavender",
    name: "lavender",
    hint: "lavender and peach",
    pairsWith: "sunset",
  },
  { id: "mocha", name: "mocha", hint: "latte and cinnamon", pairsWith: "cafe" },
  {
    id: "canopy",
    name: "canopy",
    hint: "sunlight through the pines",
    pairsWith: "p-forest",
  },
  {
    id: "tropic",
    name: "tropic",
    hint: "coral and twilight violet",
    pairsWith: "p-sunset",
  },
  {
    id: "alpine",
    name: "alpine",
    hint: "sky, meadow, and sunlit rock",
    pairsWith: "p-alps",
  },
  {
    id: "maple",
    name: "maple",
    hint: "rust, gold, and red leaves",
    pairsWith: "p-autumn",
  },
  // Earned: a third row that fills in as the garden grows.
  {
    id: "pastel",
    name: "pastel",
    hint: "soft pinks, blues, and lilacs",
    unlock: { level: 6 },
  },
  {
    id: "sakura",
    name: "sakura",
    hint: "blossom and cream",
    unlock: { level: 8 },
  },
  {
    id: "ember",
    name: "ember",
    hint: "embers and ash",
    pairsWith: "p-majula",
    unlock: { level: 11 },
  },
  {
    id: "aurora",
    name: "aurora",
    hint: "green and violet lights",
    pairsWith: "p-aurora",
    unlock: { level: 15 },
  },
  {
    id: "iridescent",
    name: "iridescent",
    hint: "space blue and turquoise",
    pairsWith: "p-space",
    unlock: { level: 20 },
  },
];

const THEME_IDS = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.includes(value as ThemeId);
}

/** "pink and cyan, made for the rainy window" */
export function describeTheme(t: ThemeMeta) {
  return t.pairsWith
    ? `${t.hint}, made for the ${getScene(t.pairsWith).name}`
    : t.hint;
}
