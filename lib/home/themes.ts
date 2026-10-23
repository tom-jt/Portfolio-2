/**
 * Colour themes for the /home chrome: cards, chips, glass and accents, never
 * the scene behind them. With none picked, each scene's own palette applies.
 * Kept free of React so the boot script's key and the prefs can share it.
 *
 * Adding a theme:
 *   1. add its id and entry here,
 *   2. add a palette block for it in globals.css
 *      (html[data-home-theme="<id>"] [data-site="home"], [data-home-swatch="<id>"]).
 */

import { getScene, type SceneId } from "./scenes";

export type ThemeId =
  | "mono"
  | "rose"
  | "glacier"
  | "neon"
  | "meadow"
  | "lavender"
  | "mocha";

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  /** Its colours in words, for the picker's caption. */
  hint: string;
  /** The scene it was made to sit with, if any. */
  pairsWith?: SceneId;
}

/** The first row stands on its own; the second follows the scenes in order. */
export const THEMES: ThemeMeta[] = [
  { id: "mono", name: "mono", hint: "black and white" },
  { id: "rose", name: "rose", hint: "red and pink" },
  { id: "glacier", name: "glacier", hint: "icy blue and white" },
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
