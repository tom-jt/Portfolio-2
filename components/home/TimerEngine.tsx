"use client";

import { useCallback, useEffect, useState } from "react";
import { playChime } from "@/lib/home/ambience";
import { formatClock } from "@/lib/home/format";
import { useNow } from "@/lib/home/store";
import {
  MODE_LABEL,
  notificationsSupported,
  timeLeft,
  timerStore,
  useTimer,
  useTimerEngine,
  type Completion,
} from "@/lib/home/timer";
import { pushToast } from "@/lib/home/toasts";

/**
 * Keeps the timer running while its card is tucked away: finishes sessions,
 * chimes, notifies, and shows the countdown in the tab title. Renders only a
 * screen-reader announcement.
 */
const TimerEngine = () => {
  const timer = useTimer();
  const [announcement, setAnnouncement] = useState("");

  const onComplete = useCallback((c: Completion) => {
    const { settings } = timerStore.get();
    if (settings.chime) playChime();
    const message =
      c.finished === "focus"
        ? `focus session done. time for a ${c.next === "long" ? "long" : "short"} break.`
        : "break's over.";
    setAnnouncement(message);
    if (c.finished !== "focus") pushToast({ kind: "info", title: "break's over" });
    if (
      settings.notify &&
      notificationsSupported() &&
      Notification.permission === "granted" &&
      document.hidden
    ) {
      new Notification(c.finished === "focus" ? "focus session done" : "break's over", {
        body: message,
        icon: "/images/logos/LogoSimpleDarkTrans.png",
      });
    }
  }, []);

  useTimerEngine(onComplete);

  // Countdown in the tab title, so it can be watched from other tabs.
  const active = timer.status !== "idle";
  // Same resolution as the chip, so the title and the chip turn over together.
  const now = useNow(250, timer.status === "running");
  const clock = formatClock(timer.status === "running" && now ? timeLeft(timer, now) : timeLeft(timer));
  useEffect(() => {
    if (!active) return;
    const previous = document.title;
    return () => {
      document.title = previous;
    };
  }, [active]);
  useEffect(() => {
    if (!active) return;
    document.title = `${timer.status === "paused" ? "❚❚ " : ""}${clock} · ${MODE_LABEL[timer.mode]}`;
  }, [active, clock, timer.status, timer.mode]);

  return (
    <p className="sr-only" aria-live="assertive">
      {announcement}
    </p>
  );
};

export default TimerEngine;
