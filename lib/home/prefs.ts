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
import { isDecorPick, isPotPick, type DecorPick, type PotPick } from "./cosmetics";
import { isThemeId, type ThemeId } from "./themes";

/** Every card on /home, each opened from its own chip. */
export type PanelId = "timer" | "tasks" | "garden" | "eyes" | "sound" | "arcade";
export const PANEL_IDS: PanelId[] = ["timer", "tasks", "garden", "eyes", "sound", "arcade"];

export interface HomePrefs {
  scene: SceneId;
  /** The colours they picked for the cards and chips, or null for the
   *  scene's own. */
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
  /** The garden's pots, and the decor in its window. */
  pot: PotPick;
  decor: DecorPick;
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
  pot: "classic",
  decor: "auto",
};

export const prefsStore = createPersistentStore<HomePrefs>(
  PREFS_KEY,
  initial,
  (raw, init) => {
    const merged = { ...init, ...(raw as Partial<HomePrefs>) };
    if (!isSceneId(merged.scene)) merged.scene = init.scene;
    if (!isThemeId(merged.theme)) merged.theme = null;
    if (!isPotPick(merged.pot)) merged.pot = init.pot;
    if (!isDecorPick(merged.decor)) merged.decor = init.decor;
    merged.ambienceVolume = Math.min(1, Math.max(0, +merged.ambienceVolume || 0));
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

/** The sound to play: the visitor's pick, else the scene's own. */
export const activeAmbience = (p: Pick<HomePrefs, "ambience" | "scene">) =>
  p.ambience ?? getScene(p.scene).ambience;
