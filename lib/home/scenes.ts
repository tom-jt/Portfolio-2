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
  | "p-sunset"
  | "p-alps"
  | "p-autumn"
  | "p-majula"
  | "p-moonlight"
  | "p-tram"
  | "p-ruins"
  | "p-overpass";

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
  | "shore"
  | "majula"
  | "snow"
  | "city";

export interface AmbienceMeta {
  id: AmbienceKind;
  label: string;
  /** One word for the sound chip. */
  short: string;
  /** Earned rather than free. */
  unlock?: Unlock;
}

/** In the order of the scenes they belong to, as the scene picker and the
 *  colours run, each the first time a scene uses it; then the rest. */
export const AMBIENCES: AmbienceMeta[] = [
  // The scenes' own sounds.
  { id: "glass", label: "rain on glass", short: "rain" },
  { id: "hill", label: "hilltop rain", short: "hill" },
  { id: "waves", label: "ocean waves", short: "waves" },
  { id: "cafe", label: "café and jazz", short: "café" },
  { id: "lake", label: "night by the lake", short: "lake" },
  { id: "woods", label: "forest birdsong", short: "birds" },
  { id: "cosmos", label: "deep space", short: "space" },
  { id: "shore", label: "warm shore", short: "shore" },
  { id: "majula", label: "majula bonfire", short: "majula" },
  { id: "snow", label: "falling snow", short: "snow" },
  { id: "city", label: "empty city", short: "city" },
  // Belonging to no scene: more ways to have it rain.
  { id: "storm", label: "thunderstorm", short: "storm" },
  { id: "wind", label: "wind and drizzle", short: "wind" },
  { id: "leaves", label: "rain on the leaves", short: "leaves" },
  { id: "deluge", label: "downpour", short: "deluge" },
];

const AMBIENCE_IDS = AMBIENCES.map((a) => a.id);

export function isAmbienceKind(value: unknown): value is AmbienceKind {
  return (
    typeof value === "string" && AMBIENCE_IDS.includes(value as AmbienceKind)
  );
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
  {
    id: "sunset",
    name: "sunset over the sea",
    unlockLevel: 3,
    ambience: "waves",
  },
  { id: "cafe", name: "late-night café", unlockLevel: 4, ambience: "cafe" },
  // Picture scenes: photographs with motion layered on. The first opens at
  // level 5, then one every two levels.
  {
    id: "p-aurora",
    name: "aurora lake",
    unlockLevel: 5,
    ambience: "lake",
    photo: "aurora",
  },
  {
    id: "p-forest",
    name: "sunlit forest",
    unlockLevel: 7,
    ambience: "woods",
    photo: "forest",
  },
  {
    id: "p-space",
    name: "nebula",
    unlockLevel: 9,
    ambience: "cosmos",
    photo: "space",
  },
  {
    id: "p-sunset",
    name: "tropical sunset",
    unlockLevel: 11,
    ambience: "shore",
    photo: "sunset",
  },
  {
    id: "p-alps",
    name: "alpine hill",
    unlockLevel: 13,
    ambience: "hill",
    photo: "alps",
  },
  {
    id: "p-autumn",
    name: "autumn path",
    unlockLevel: 15,
    ambience: "woods",
    photo: "autumn",
  },
  {
    id: "p-majula",
    name: "majula",
    unlockLevel: 17,
    ambience: "majula",
    photo: "majula",
  },
  {
    id: "p-moonlight",
    name: "moonlight",
    unlockLevel: 19,
    ambience: "snow",
    photo: "moonlight",
  },
  {
    id: "p-tram",
    name: "rainy tram stop",
    unlockLevel: 21,
    ambience: "leaves",
    photo: "tram",
  },
  {
    id: "p-ruins",
    name: "overgrown city",
    unlockLevel: 23,
    ambience: "wind",
    photo: "ruins",
  },
  {
    id: "p-overpass",
    name: "hazy overpass",
    unlockLevel: 25,
    ambience: "city",
    photo: "overpass",
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
