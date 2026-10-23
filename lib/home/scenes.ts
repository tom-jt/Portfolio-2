/**
 * Scene metadata. Kept free of React so the game rules (which unlock scenes)
 * and the boot script (which applies one before paint) can both read it.
 *
 * Adding a scene:
 *   1. add its id and entry here,
 *   2. add a palette block for it in globals.css
 *      (html[data-home-scene="<id>"] [data-site="home"]),
 *   3. register its background in components/home/scenes/index.tsx,
 *   4. draw its picker thumbnail in components/home/scenes/previews.tsx,
 *   5. pick its default sound from AMBIENCES below.
 */

export type SceneId = "rain" | "hill" | "sunset" | "cafe";

/** Ambient sounds. Each scene has a default, and the visitor can pick another.
 *  Their recipes are in lib/home/ambience.ts. */
export type AmbienceKind = "glass" | "cafe" | "hill" | "storm" | "waves";

export interface AmbienceMeta {
  id: AmbienceKind;
  label: string;
  /** One word for the sound chip. */
  short: string;
}

export const AMBIENCES: AmbienceMeta[] = [
  { id: "glass", label: "rain on glass", short: "rain" },
  { id: "cafe", label: "café and jazz", short: "café" },
  { id: "hill", label: "hilltop rain", short: "hill" },
  { id: "storm", label: "thunderstorm", short: "storm" },
  { id: "waves", label: "ocean waves", short: "waves" },
];

const AMBIENCE_IDS = AMBIENCES.map((a) => a.id);

export function isAmbienceKind(value: unknown): value is AmbienceKind {
  return typeof value === "string" && AMBIENCE_IDS.includes(value as AmbienceKind);
}

export function getAmbience(id: AmbienceKind) {
  return AMBIENCES.find((a) => a.id === id) ?? AMBIENCES[0];
}

export interface SceneMeta {
  id: SceneId;
  name: string;
  /** Garden level that unlocks it. 1 means available from the start. */
  unlockLevel: number;
  /** The sound it plays unless the visitor has picked one. */
  ambience: AmbienceKind;
}

export const SCENES: SceneMeta[] = [
  { id: "rain", name: "rainy window", unlockLevel: 1, ambience: "glass" },
  { id: "hill", name: "rain on the hill", unlockLevel: 2, ambience: "hill" },
  { id: "sunset", name: "sunset over the sea", unlockLevel: 3, ambience: "waves" },
  { id: "cafe", name: "late-night café", unlockLevel: 4, ambience: "cafe" },
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
