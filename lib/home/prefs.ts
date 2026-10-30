"use client";

import { createPersistentStore, useStore } from "./store";
import {
  DEFAULT_SCENE,
  getScene,
  isAmbienceKind,
  isSceneId,
  PREFS_KEY,
  type AmbienceKind,
  type SceneId,
} from "./scenes";
import {
  isDecorPick,
  isFramePick,
  isPotPick,
  type DecorPick,
  type FramePick,
  type PotPick,
} from "./cosmetics";
import { isPetId, type PetId } from "./pets";
import { isThemeId, sceneTheme, type ThemeId } from "./themes";

/** Every card on /home, each opened from its own chip. */
export type PanelId =
  "timer" | "tasks" | "garden" | "eyes" | "sound" | "arcade" | "links";
export const PANEL_IDS: PanelId[] = [
  "timer",
  "tasks",
  "garden",
  "eyes",
  "sound",
  "arcade",
  "links",
];

/** The garden card's tabs. */
export type GardenTab = "plants" | "upgrades" | "season" | "shed" | "journal";
const GARDEN_TABS: GardenTab[] = [
  "plants",
  "upgrades",
  "season",
  "shed",
  "journal",
];

export interface HomePrefs {
  scene: SceneId;
  /** The colours they picked for the cards and chips, or null to wear each
   *  scene's own theme. */
  theme: ThemeId | null;
  /** Whether ambience was playing last visit. Browsers block autoplay, so
   *  this resumes it on the first click anywhere rather than on load. */
  ambienceOn: boolean;
  ambienceVolume: number;
  /** The sound they picked, or null to play each scene's own. */
  ambience: AmbienceKind | null;
  /** A visitor's own Spotify link, overriding the default playlist. */
  spotifyUrl: string | null;
  /** Spotify's embed is heavy, so it stays a facade until asked for once. */
  spotifyLoaded: boolean;
  /** Cards open on desktop. They stay open, across visits too, until their
   *  chip is clicked again or the scene behind them is. */
  openPanels: PanelId[];
  /** Whether the tasks card folds its finished tasks away. */
  hideDone: boolean;
  /** The garden tab last open, so it opens there again. */
  gardenTab: GardenTab;
  /** The garden's pots, and the decor in its window. */
  pot: PotPick;
  decor: DecorPick;
  /** The garden window's frame, and gold-leaf foliage (once earned). */
  frame: FramePick;
  goldLeaf: boolean;
  /** The pet on the chips, or none. */
  pet: PetId | null;
  /** The quick links row, kept open beside the tasks chip. */
  linksPinned: boolean;
  /** Immersive mode: the controls faded out, leaving the scene. */
  immersive: boolean;
}

const initial: HomePrefs = {
  scene: DEFAULT_SCENE,
  theme: null,
  ambienceOn: false,
  ambienceVolume: 0.5,
  ambience: null,
  spotifyUrl: null,
  spotifyLoaded: false,
  openPanels: [],
  hideDone: false,
  gardenTab: "plants",
  pot: "classic",
  decor: "auto",
  frame: "plain",
  goldLeaf: false,
  pet: null,
  linksPinned: false,
  immersive: false,
};

export const prefsStore = createPersistentStore<HomePrefs>(
  PREFS_KEY,
  initial,
  (raw, init) => {
    const merged = { ...init, ...(raw as Partial<HomePrefs>) };
    if (!isSceneId(merged.scene)) merged.scene = init.scene;
    if (!isThemeId(merged.theme)) merged.theme = null;
    if (!GARDEN_TABS.includes(merged.gardenTab))
      merged.gardenTab = init.gardenTab;
    if (!isPotPick(merged.pot)) merged.pot = init.pot;
    if (!isDecorPick(merged.decor)) merged.decor = init.decor;
    if (!isFramePick(merged.frame)) merged.frame = init.frame;
    merged.goldLeaf = merged.goldLeaf === true;
    merged.linksPinned = merged.linksPinned === true;
    merged.immersive = merged.immersive === true;
    if (!isPetId(merged.pet)) merged.pet = null;
    merged.ambienceVolume = Math.min(
      1,
      Math.max(0, +merged.ambienceVolume || 0),
    );
    if (!isAmbienceKind(merged.ambience)) merged.ambience = null;
    merged.openPanels = Array.isArray(merged.openPanels)
      ? merged.openPanels.filter((id): id is PanelId => PANEL_IDS.includes(id))
      : [];
    return merged;
  },
);

export const usePrefs = () => useStore(prefsStore);

export const setPrefs = (patch: Partial<HomePrefs>) =>
  prefsStore.set((p) => ({ ...p, ...patch }));

export const togglePanel = (id: PanelId) =>
  prefsStore.set((p) => ({
    ...p,
    openPanels: p.openPanels.includes(id)
      ? p.openPanels.filter((x) => x !== id)
      : [...p.openPanels, id],
  }));

export const closePanels = () => setPrefs({ openPanels: [] });

/** The colours to wear: the visitor's pick, else the scene's own theme. */
export const activeTheme = (p: Pick<HomePrefs, "theme" | "scene">) =>
  p.theme ?? sceneTheme(p.scene);

/** The sound to play: the visitor's pick, else the scene's own. */
export const activeAmbience = (p: Pick<HomePrefs, "ambience" | "scene">) =>
  p.ambience ?? getScene(p.scene).ambience;
