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

/** When it last stopped playing, so a pause can be resumed for a while. */
let pausedAt = 0;

export function setSpotifyPlaying(next: boolean) {
  if (next === playing) return;
  if (playing && !next) pausedAt = Date.now();
  playing = next;
  listeners.forEach((l) => l());
}

/** After a pause the player stays loaded this long, to be resumed from the
 *  chip, before it's let go to free the memory. */
export const SPOTIFY_HOLD_MS = 10 * 60_000;

/** Whether the player should stay loaded with its card closed. */
export const spotifyHeld = (now: number) =>
  playing || (pausedAt > 0 && now - pausedAt < SPOTIFY_HOLD_MS);

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useSpotifyPlaying = () =>
  useSyncExternalStore(subscribe, () => playing, () => false);

export interface SpotifyController {
  addListener: (event: "playback_update", cb: (e: { data: { isPaused: boolean } }) => void) => void;
  togglePlay?: () => void;
  pause?: () => void;
  resume?: () => void;
  destroy?: () => void;
}

/* The player that's loaded, if any, so controls outside the sound card (the
   collapsed chip) can play and pause it. */
let controller: SpotifyController | null = null;
const controllerListeners = new Set<() => void>();

export function setSpotifyController(next: SpotifyController | null) {
  if (next === controller) return;
  controller = next;
  controllerListeners.forEach((l) => l());
}

const subscribeController = (l: () => void) => {
  controllerListeners.add(l);
  return () => controllerListeners.delete(l);
};

/** Whether a Spotify player is loaded and can be played or paused. */
export const useSpotifyReady = () =>
  useSyncExternalStore(subscribeController, () => !!controller?.togglePlay, () => false);

export const toggleSpotify = () => controller?.togglePlay?.();

/** Whether the music was paused for a chime, and when to pick it up again. */
let hushed = false;
let hushTimer: ReturnType<typeof setTimeout> | undefined;

/**
 * Pauses the music for a chime, and plays it again `ms` later. Spotify's
 * player can't be turned down from the page, only paused, and its sound
 * doesn't pass through ours to be dipped. A chime during a pause it made
 * only pushes the restart back. Returns whether the music was paused, so
 * the chime can wait a moment for it to stop.
 */
export function hushSpotify(ms: number) {
  const pausing = playing && !!controller;
  if (pausing) {
    (controller!.pause ?? controller!.togglePlay)?.();
    hushed = true;
  }
  if (!hushed) return false;
  clearTimeout(hushTimer);
  hushTimer = setTimeout(() => {
    hushed = false;
    // Only if it's still paused: they may have started it again themselves.
    if (!playing) (controller?.resume ?? controller?.togglePlay)?.();
  }, ms);
  return pausing;
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

