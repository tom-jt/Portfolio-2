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
import { currentHoliday } from "@/lib/home/cosmetics";
import { awayToast, noteHoliday, tick } from "@/lib/home/garden";
import { activeAmbience, usePrefs } from "@/lib/home/prefs";
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
