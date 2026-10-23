"use client";

import { useSyncExternalStore } from "react";

const SPOTIFY_LINK =
  /^(?:https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?|spotify:)(playlist|album|track|artist|show|episode)[/:]([A-Za-z0-9]{22})/;

/**
 * Turns any open.spotify.com link (or spotify: URI) into its embed URL, or
 * null if it isn't one. Only Spotify's own embed host is ever framed, so a
 * pasted link can't point the iframe anywhere else.
 */
export function spotifyEmbedUrl(link: string) {
  const match = link.trim().match(SPOTIFY_LINK);
  if (!match) return null;
  const [, type, id] = match;
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}

/** The same link as a spotify: URI, for Spotify's iFrame API. */
export function spotifyUri(link: string) {
  const match = link.trim().match(SPOTIFY_LINK);
  return match ? `spotify:${match[1]}:${match[2]}` : null;
}

/* Whether the embed is playing. Spotify's iFrame API reports it, and /home
   uses it to keep the player alive while its card is closed. */
let playing = false;
const listeners = new Set<() => void>();

export function setSpotifyPlaying(next: boolean) {
  if (next === playing) return;
  playing = next;
  listeners.forEach((l) => l());
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSpotifyPlaying = () =>
  useSyncExternalStore(subscribe, () => playing, () => false);

export interface SpotifyController {
  addListener: (event: "playback_update", cb: (e: { data: { isPaused: boolean } }) => void) => void;
  destroy?: () => void;
}

interface SpotifyIframeApi {
  createController: (
    element: HTMLElement,
    options: { uri: string; width?: string | number; height?: string | number },
    callback: (controller: SpotifyController) => void,
  ) => void;
}

let api: Promise<SpotifyIframeApi> | null = null;

/** Loads Spotify's iFrame API once. */
export function loadSpotifyApi() {
  api ??= new Promise<SpotifyIframeApi>((resolve, reject) => {
    (window as { onSpotifyIframeApiReady?: (a: SpotifyIframeApi) => void }).onSpotifyIframeApiReady = resolve;
    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    script.onerror = () => {
      api = null;
      script.remove();
      reject(new Error("Spotify's iFrame API didn't load"));
    };
    document.body.appendChild(script);
  });
  return api;
}

