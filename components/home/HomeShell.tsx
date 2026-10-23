"use client";

import { useEffect, type ReactNode } from "react";
import SceneBackground from "@/components/home/scenes";
import RewardToasts from "@/components/home/RewardToasts";
import {
  audioUnlocked,
  playAmbience,
  setAmbienceVolume,
  stopAmbience,
} from "@/lib/home/ambience";
import { awayToast, tick } from "@/lib/home/garden";
import { activeAmbience, usePrefs } from "@/lib/home/prefs";
import { useTodoSync } from "@/lib/home/sync";
import { cn } from "@/lib/utils";

/** Pays out the garden's passive income every second while /home is open. */
function useGardenEngine() {
  useEffect(() => {
    const payOut = () => {
      const { away, gain } = tick();
      if (away > 300 && gain >= 1) awayToast(gain, away);
    };
    payOut();
    const interval = setInterval(payOut, 1000);
    const onVisible = () => !document.hidden && payOut();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      tick();
    };
  }, []);
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

  useEffect(() => setAmbienceVolume(ambienceVolume), [ambienceVolume]);

  useEffect(() => stopAmbience, []);
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
  const { scene, theme } = usePrefs();

  // The boot script sets these on first paint; this keeps them current when
  // the scene or colours change, or when arriving by client-side navigation.
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.homeScene = scene;
    if (theme) html.dataset.homeTheme = theme;
    else delete html.dataset.homeTheme;
  }, [scene, theme]);

  useGardenEngine();
  useAmbience();
  useTodoSync();

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
