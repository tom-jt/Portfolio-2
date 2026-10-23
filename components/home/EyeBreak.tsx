"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye } from "lucide-react";
import { playEyeChime, playRestDone } from "@/lib/home/ambience";
import {
  DUE_LEAD_MS,
  eyeStore,
  finishRestIfDone,
  markDueIfTime,
  REST_SECONDS,
  schedule,
  skipBreak,
  startRestIfDue,
  useEyes,
} from "@/lib/home/eyes";
import { useNow } from "@/lib/home/store";
import { notificationsSupported } from "@/lib/home/timer";
import { setTitlePart } from "@/lib/home/title";
import { cn } from "@/lib/utils";
import { textButton } from "./ui";

const RING_R = 54;
const RING_C = 2 * Math.PI * RING_R;

/** Keeps the eye-break schedule while /home is open: due, rest, repeat. */
function useEyeEngine() {
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const announce = () => {
      const s = eyeStore.get();
      if (s.sound) playEyeChime();
      if (s.notify && notificationsSupported() && Notification.permission === "granted" && document.hidden) {
        new Notification("rest your eyes", {
          body: `look at something far away for ${REST_SECONDS} seconds`,
          icon: "/images/logos/LogoSimpleDarkTrans.png",
        });
      }
    };

    const check = () => {
      const now = Date.now();
      if (markDueIfTime(now)) announce();
      startRestIfDue(now);
      if (finishRestIfDone(now) && eyeStore.get().sound) playRestDone();
    };

    const sync = () => {
      clearTimeout(timeout);
      const s = eyeStore.get();
      const at =
        s.phase === "idle" ? s.nextAt : s.phase === "due" ? s.dueAt + DUE_LEAD_MS : s.restUntil;
      if (s.enabled && at) timeout = setTimeout(check, Math.max(0, at - Date.now()) + 50);
    };

    // Left alone for longer than a whole interval with a reminder up, or
    // arriving after one fell due with the page closed: the eyes have had
    // their rest. Start counting again rather than greet anyone with it.
    const stale = () => {
      const s = eyeStore.get();
      const now = Date.now();
      if (!s.enabled) return false;
      if (s.phase === "idle") return !s.nextAt || now - s.nextAt > 60_000;
      if (s.phase === "due") return now - s.dueAt > s.interval * 60_000;
      return false;
    };

    if (stale()) schedule();
    check();
    sync();
    const unsubscribe = eyeStore.subscribe(sync);
    const interval = setInterval(check, 15_000);
    const onVisible = () => {
      if (document.hidden) return;
      if (eyeStore.get().phase === "due" && stale()) schedule();
      check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      unsubscribe();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}

/**
 * The reminder itself: a quiet card over a dimmed scene, which turns into
 * the rest as the chime fades. While resting the room darkens further and
 * counts down the twenty seconds.
 */
const EyeBreak = () => {
  useEyeEngine();
  const eyes = useEyes();
  const due = eyes.phase === "due";
  const resting = eyes.phase === "resting";
  const now = useNow(250, resting);
  // Capped: the shared clock rounds down, so it can read a moment early.
  const secondsLeft =
    resting && now ? Math.min(REST_SECONDS, Math.max(0, Math.ceil((eyes.restUntil - now) / 1000))) : REST_SECONDS;
  const progress = 1 - secondsLeft / REST_SECONDS;

  useEffect(() => {
    setTitlePart("eyes", due ? "rest your eyes" : resting ? `resting ${secondsLeft}s` : null);
  }, [due, resting, secondsLeft]);
  useEffect(() => () => setTitlePart("eyes", null), []);

  // Escape skips, as the button does.
  useEffect(() => {
    if (!due && !resting) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && skipBreak();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [due, resting]);

  return (
    <AnimatePresence>
      {(due || resting) && (
        <motion.div
          key="eye-break"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-60 grid place-items-center p-6"
        >
          <div
            aria-hidden="true"
            className={cn(
              "absolute inset-0 backdrop-blur-[2px] transition-colors duration-1000",
              resting ? "bg-black/60" : "bg-black/25",
            )}
          />
          <motion.div
            role="alertdialog"
            aria-labelledby="eye-break-title"
            aria-describedby={due ? "eye-break-text" : undefined}
            initial={{ y: 12, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="home-glass relative flex w-full max-w-sm flex-col items-center rounded-[1.75rem] p-7 text-center"
          >
            {due ? (
              <>
                <motion.span
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="bg-glow-2/15 text-glow-2 grid size-14 place-items-center rounded-full"
                >
                  <Eye className="size-6" />
                </motion.span>
                <h2 id="eye-break-title" className="font-display mt-4 text-3xl leading-none">
                  rest your eyes
                </h2>
                <p id="eye-break-text" className="text-muted-foreground mt-3 text-sm">
                  look at something far away for {REST_SECONDS} seconds
                </p>
                <button
                  type="button"
                  onClick={skipBreak}
                  className={cn(textButton, "text-muted-foreground mt-5 h-9 rounded-full px-4 text-xs")}
                >
                  skip
                </button>
              </>
            ) : (
              <>
                <div className="relative size-36">
                  <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
                    <circle cx="60" cy="60" r={RING_R} fill="none" stroke="currentColor" strokeOpacity="0.1" strokeWidth="3" />
                    <circle
                      cx="60"
                      cy="60"
                      r={RING_R}
                      fill="none"
                      stroke="var(--glow-2)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={RING_C}
                      strokeDashoffset={RING_C * (1 - progress)}
                      className="transition-[stroke-dashoffset] duration-300"
                    />
                  </svg>
                  <span
                    role="timer"
                    aria-label={`${secondsLeft} seconds left`}
                    className="font-display absolute inset-0 grid place-items-center text-6xl"
                  >
                    {secondsLeft}
                  </span>
                </div>
                <h2 id="eye-break-title" className="font-display mt-4 text-3xl leading-none">
                  look away
                </h2>
                <button
                  type="button"
                  onClick={skipBreak}
                  className={cn(textButton, "text-muted-foreground mt-5 h-9 rounded-full px-4 text-xs")}
                >
                  end early
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default EyeBreak;
