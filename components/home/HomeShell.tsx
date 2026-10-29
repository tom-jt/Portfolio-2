"use client";

import { useEffect, type ReactNode } from "react";
import SceneBackground from "@/components/home/scenes";
import RewardToasts from "@/components/home/RewardToasts";
import {
  audioUnlocked,
  playAmbience,
  primeAudio,
  setAmbienceVolume,
  stopAmbience,
} from "@/lib/home/ambience";
import { currentHoliday } from "@/lib/home/cosmetics";
import { awayToast, noteHoliday, tick } from "@/lib/home/garden";
import { activeAmbience, activeTheme, setPrefs, usePrefs } from "@/lib/home/prefs";
import { getAmbience, getScene } from "@/lib/home/scenes";
import { useTodoSync } from "@/lib/home/sync";
import { cn } from "@/lib/utils";

/**
 * Pays out the garden's passive income every second while /home is open.
 *
 * Timers are throttled or frozen whenever the browser thinks nobody is
 * looking (a hidden tab, but also a window left visible behind another app),
 * so payouts arrive in lumps that each look like time away. They are added
 * up and announced once, only when the visitor is actually back: on load,
 * when the tab shows again, or when the window gets focus.
 */
function useGardenEngine() {
  useEffect(() => {
    let awayFor = 0;
    let awayGain = 0;
    const payOut = () => {
      const { away, gain } = tick();
      if (away > 0) {
        awayFor += away;
        awayGain += gain;
      }
    };
    const welcomeBack = () => {
      payOut();
      if (document.hidden) return;
      if (awayFor > 300 && awayGain >= 1) awayToast(awayGain, awayFor);
      // The pet sleeps through a long absence, and wakes a minute after.
      if (awayFor > 300) window.dispatchEvent(new CustomEvent("home:back-from-away"));
      awayFor = 0;
      awayGain = 0;
    };
    welcomeBack();
    // Being here for a holiday unlocks its decor for good.
    const holiday = currentHoliday();
    if (holiday) noteHoliday(holiday);
    const interval = setInterval(payOut, 1000);
    document.addEventListener("visibilitychange", welcomeBack);
    window.addEventListener("focus", welcomeBack);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", welcomeBack);
      window.removeEventListener("focus", welcomeBack);
      tick();
    };
  }, []);
}

/**
 * The ambience on the lock screen and in the phone's media controls: what's
 * playing, with play and pause that work without opening the app. Shown
 * once it has played; where the browser offers it.
 */
function useMediaControls() {
  const prefs = usePrefs();
  const { ambienceOn, scene } = prefs;
  const kind = activeAmbience(prefs);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    session.setActionHandler("play", () => {
      primeAudio();
      setPrefs({ ambienceOn: true });
    });
    session.setActionHandler("pause", () => setPrefs({ ambienceOn: false }));
    return () => {
      session.setActionHandler("play", null);
      session.setActionHandler("pause", null);
      session.metadata = null;
      session.playbackState = "none";
    };
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    if (ambienceOn) {
      session.metadata = new MediaMetadata({
        title: getAmbience(kind).label,
        artist: getScene(scene).name,
        album: "Tom's room",
        artwork: [
          { src: "/home/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/home/icons/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      });
    }
    // Paused, the controls stay, to start it again from the lock screen.
    if (session.metadata) session.playbackState = ambienceOn ? "playing" : "paused";
  }, [ambienceOn, kind, scene]);
}

/**
 * Keeps ambience in step with the prefs and the scene. Browsers refuse to
 * start audio without a gesture, so if it was on last visit it waits for the
 * first click or key press anywhere on the page.
 */
function useAmbience() {
  const prefs = usePrefs();
  const { ambienceOn, ambienceVolume } = prefs;
  const kind = activeAmbience(prefs);

  useEffect(() => {
    if (!ambienceOn) {
      stopAmbience();
      return;
    }
    if (audioUnlocked()) {
      playAmbience(kind, ambienceVolume);
      return;
    }
    const resume = (e: Event) => {
      // The toggle starts the sound itself; resuming here as well would let
      // its click read "playing" and switch it straight back off.
      if (e.target instanceof Element && e.target.closest("[data-ambience-toggle]")) return;
      cleanup();
      playAmbience(kind, ambienceVolume);
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", resume);
      window.removeEventListener("keydown", resume);
    };
    window.addEventListener("pointerdown", resume);
    window.addEventListener("keydown", resume);
    return cleanup;
    // Volume changes are handled below without rebuilding the sound.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ambienceOn, kind]);

  useEffect(() => {
    setAmbienceVolume(ambienceVolume);
  }, [ambienceVolume]);

  useEffect(() => stopAmbience, []);
}

/**
 * Registers the service worker that lets /home open offline once installed
 * as an app (public/sw.js). Only in production builds: in development it
 * would serve stale code.
 */
function useServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/home" }).catch(() => {});
  }, []);
}

/**
 * Client wrapper for /home: the scene, its background, sound, the garden's
 * clock, task sync and the toasts. The layout stays a server component for metadata
 * and fonts.
 */
const HomeShell = ({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) => {
  const prefs = usePrefs();
  const { scene } = prefs;
  const theme = activeTheme(prefs);

  // The boot script sets these on first paint; this keeps them current when
  // the scene or colours change, or when arriving by client-side navigation.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.homeScene = scene;
    if (theme) html.dataset.homeTheme = theme;
    else delete html.dataset.homeTheme;
  }, [scene, theme]);

  // The app's title bar, where it has one, wears the scene's ground colour.
  useEffect(() => {
    const ground = getComputedStyle(document.querySelector('[data-site="home"]') ?? document.body)
      .getPropertyValue("--background")
      .trim();
    const meta = document.querySelector('meta[name="theme-color"]');
    if (ground && meta) meta.setAttribute("content", ground);
  }, [scene]);

  useGardenEngine();
  useAmbience();
  useMediaControls();
  useTodoSync();
  useServiceWorker();

  return (
    // Everything on /home is lowercase, set once here so labels, dates and
    // data all follow. Text people type themselves opts out with normal-case.
    <div
      data-site="home"
      className={cn(
        "bg-background text-foreground relative z-0 min-h-dvh overflow-x-clip font-sans lowercase antialiased",
        className,
      )}
    >
      <SceneBackground scene={scene} />
      {children}
      <RewardToasts />
    </div>
  );
};

export default HomeShell;
