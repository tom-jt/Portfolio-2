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

import type { PhotoId } from "@/components/home/scenes/PhotoScene";
import type { Unlock } from "./cosmetics";

/** The classic, drawn scenes, then the picture ones ("p-" plus the photo). */
export type SceneId =
  | "rain"
  | "hill"
  | "sunset"
  | "cafe"
  | "p-aurora"
  | "p-forest"
  | "p-space"
  | "p-sunset";

/** Ambient sounds. Each scene has a default, and the visitor can pick another.
 *  Their recipes are in lib/home/ambience.ts. */
export type AmbienceKind =
  | "glass"
  | "cafe"
  | "hill"
  | "storm"
  | "waves"
  | "wind"
  | "leaves"
  | "deluge"
  | "lake"
  | "woods"
  | "cosmos"
  | "shore";

export interface AmbienceMeta {
  id: AmbienceKind;
  label: string;
  /** One word for the sound chip. */
  short: string;
  /** Earned rather than free. */
  unlock?: Unlock;
}

export const AMBIENCES: AmbienceMeta[] = [
  { id: "glass", label: "rain on glass", short: "rain" },
  { id: "cafe", label: "café and jazz", short: "café" },
  { id: "hill", label: "hilltop rain", short: "hill" },
  { id: "storm", label: "thunderstorm", short: "storm" },
  { id: "waves", label: "ocean waves", short: "waves" },
  { id: "wind", label: "wind and drizzle", short: "wind", unlock: { level: 6 } },
  { id: "leaves", label: "rain on the leaves", short: "leaves", unlock: { level: 9 } },
  { id: "deluge", label: "downpour", short: "deluge", unlock: { level: 13 } },
  // The picture scenes' own sounds.
  { id: "lake", label: "night by the lake", short: "lake" },
  { id: "woods", label: "forest birdsong", short: "birds" },
  { id: "cosmos", label: "deep space", short: "space" },
  { id: "shore", label: "warm shore", short: "shore" },
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
  /** For the picture scenes: which photograph. */
  photo?: PhotoId;
}

export const SCENES: SceneMeta[] = [
  { id: "rain", name: "rainy window", unlockLevel: 1, ambience: "glass" },
  { id: "hill", name: "rain on the hill", unlockLevel: 2, ambience: "hill" },
  { id: "sunset", name: "sunset over the sea", unlockLevel: 3, ambience: "waves" },
  { id: "cafe", name: "late-night café", unlockLevel: 4, ambience: "cafe" },
  // Picture scenes: photographs with motion layered on. Open from the start.
  { id: "p-aurora", name: "aurora lake", unlockLevel: 1, ambience: "lake", photo: "aurora" },
  { id: "p-forest", name: "sunlit forest", unlockLevel: 1, ambience: "woods", photo: "forest" },
  { id: "p-space", name: "nebula", unlockLevel: 1, ambience: "cosmos", photo: "space" },
  { id: "p-sunset", name: "tropical sunset", unlockLevel: 1, ambience: "shore", photo: "sunset" },
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
