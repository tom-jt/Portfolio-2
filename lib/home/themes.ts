/**
 * Colour themes for the /home chrome: cards, chips, glass and accents, never
 * the scene behind them. With none picked, each scene's own palette applies.
 * Kept free of React so the boot script's key and the prefs can share it.
 *
 * Adding a theme:
 *   1. add its id and entry here,
 *   2. add a palette block for it in globals.css
 *      (html[data-home-theme="<id>"] [data-site="home"], [data-home-swatch="<id>"]),
 *   3. give it an `unlock` if it has to be earned. A theme made for a scene
 *      needs none: it opens at the same level as its scene.
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
  | "lamplight"
  | "fireside"
  | "nightrail"
  | "fern"
  | "daybreak"
  | "ember"
  | "sakura"
  | "aurora"
  | "pastel"
  | "iridescent"
  | "canopy"
  | "tropic"
  | "alpine"
  | "maple"
  | "mint"
  | "overgrowth"
  | "haze"
  | "vespers";

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
  {
    id: "glacier",
    name: "glacier",
    hint: "icy blue and white",
    pairsWith: "p-moonlight",
  },
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
    id: "lamplight",
    name: "lamplight",
    hint: "bottle green and brass",
    pairsWith: "library",
  },
  {
    id: "fireside",
    name: "fireside",
    hint: "firelight and wool red",
    pairsWith: "cabin",
  },
  {
    id: "nightrail",
    name: "night rail",
    hint: "navy and lamplit amber",
    pairsWith: "train",
  },
  {
    id: "fern",
    name: "fern",
    hint: "fern green and misted glass",
    pairsWith: "greenhouse",
  },
  {
    id: "daybreak",
    name: "daybreak",
    hint: "peach, lilac, and first gold",
    pairsWith: "dawn",
  },
  {
    id: "canopy",
    name: "canopy",
    hint: "sunlight through the pines",
    pairsWith: "p-forest",
  },
  {
    id: "tropic",
    name: "tropic",
    hint: "magenta sky and a gold sun",
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
  {
    id: "mint",
    name: "mint",
    hint: "tram mint and blossom pink",
    pairsWith: "p-tram",
  },
  {
    id: "overgrowth",
    name: "overgrowth",
    hint: "neon pink over moss",
    pairsWith: "p-ruins",
  },
  {
    id: "haze",
    name: "haze",
    hint: "sun-faded signs and green steel",
    pairsWith: "p-overpass",
  },
  {
    id: "vespers",
    name: "vespers",
    hint: "candlelight and cold stained glass",
    pairsWith: "p-cathedral",
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
  },
  {
    id: "aurora",
    name: "aurora",
    hint: "green and violet lights",
    pairsWith: "p-aurora",
  },
  {
    id: "iridescent",
    name: "iridescent",
    hint: "space blue and turquoise",
    pairsWith: "p-space",
  },
];

// A theme made for a scene opens with it, so the colours never arrive
// before the scene they were made for.
for (const t of THEMES) {
  const level = t.pairsWith ? getScene(t.pairsWith).unlockLevel : 1;
  if (!t.unlock && level > 1) t.unlock = { level };
}

// Shown in the order they open up, which for the scene-made ones is also
// the order of the scenes. Sorting is stable, so ties keep the order above.
THEMES.sort((a, b) => (a.unlock?.level ?? 1) - (b.unlock?.level ?? 1));

const THEME_IDS = THEMES.map((t) => t.id);

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === "string" && THEME_IDS.includes(value as ThemeId);
}

/** The theme made for a scene: the colours it wears when following it. */
export const sceneTheme = (scene: SceneId): ThemeId | null =>
  THEMES.find((t) => t.pairsWith === scene)?.id ?? null;

/** Each scene's own theme, for the boot script, which can't import. */
export const SCENE_THEMES: Partial<Record<SceneId, ThemeId>> =
  Object.fromEntries(
    THEMES.filter((t) => t.pairsWith).map((t) => [t.pairsWith, t.id]),
  );

/** "pink and cyan, made for the rainy window" */
export function describeTheme(t: ThemeMeta) {
  return t.pairsWith
    ? `${t.hint}, made for the ${getScene(t.pairsWith).name}`
    : t.hint;
}
