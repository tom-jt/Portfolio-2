/**
 * Scene metadata. Kept free of React so the game rules (which unlock scenes)
 * and the boot script (which applies one before paint) can both read it.
 *
 * Adding a scene:
 *   1. add its id and entry here,
 *   2. add a palette block for it in globals.css
 *      (html[data-home-scene="<id>"] [data-site="home"]),
 *   3. register its background in components/home/scenes/index.tsx.
 */

export type SceneId = "rain" | "sunset";

export type AmbienceKind = "rain" | "waves";

export interface SceneMeta {
  id: SceneId;
  name: string;
  /** Garden level that unlocks it. 1 means available from the start. */
  unlockLevel: number;
  ambience: AmbienceKind;
  ambienceLabel: string;
  /** Two colours for the switcher's preview swatch. */
  swatch: [string, string];
}

export const SCENES: SceneMeta[] = [
  {
    id: "rain",
    name: "rainy window",
    unlockLevel: 1,
    ambience: "rain",
    ambienceLabel: "rain on glass",
    swatch: ["#0b1124", "#f2b46d"],
  },
  {
    id: "sunset",
    name: "sunset over the sea",
    unlockLevel: 3,
    ambience: "waves",
    ambienceLabel: "waves",
    swatch: ["#5a2a5e", "#ffb36b"],
  },
];

export const DEFAULT_SCENE: SceneId = "rain";

export const SCENE_IDS = SCENES.map((s) => s.id);

export function isSceneId(value: unknown): value is SceneId {
  return typeof value === "string" && SCENE_IDS.includes(value as SceneId);
}

export function getScene(id: SceneId) {
  return SCENES.find((s) => s.id === id) ?? SCENES[0];
}

/** Storage key read by the boot script in app/layout.tsx; keep them in sync. */
export const PREFS_KEY = "home:prefs:v1";
