"use client";

import { createPersistentStore, useStore } from "./store";
import { DEFAULT_SCENE, isSceneId, PREFS_KEY, type SceneId } from "./scenes";

export interface HomePrefs {
  scene: SceneId;
  /** Whether ambience was playing last visit. Browsers block autoplay, so
   *  this resumes it on the first click anywhere rather than on load. */
  ambienceOn: boolean;
  ambienceVolume: number;
  /** A visitor's own Spotify link, overriding the default playlist. */
  spotifyUrl: string | null;
  /** Spotify's embed is heavy, so it stays a facade until asked for once. */
  spotifyLoaded: boolean;
}

const initial: HomePrefs = {
  scene: DEFAULT_SCENE,
  ambienceOn: false,
  ambienceVolume: 0.5,
  spotifyUrl: null,
  spotifyLoaded: false,
};

export const prefsStore = createPersistentStore<HomePrefs>(
  PREFS_KEY,
  initial,
  (raw, init) => {
    const merged = { ...init, ...(raw as Partial<HomePrefs>) };
    if (!isSceneId(merged.scene)) merged.scene = init.scene;
    merged.ambienceVolume = Math.min(1, Math.max(0, +merged.ambienceVolume || 0));
    return merged;
  },
);

export const usePrefs = () => useStore(prefsStore);

export const setPrefs = (patch: Partial<HomePrefs>) =>
  prefsStore.set((p) => ({ ...p, ...patch }));
