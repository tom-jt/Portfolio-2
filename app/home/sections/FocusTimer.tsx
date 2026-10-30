"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Droplet,
  Flame,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  SkipForward,
  Timer as TimerIcon,
  X,
} from "lucide-react";
import {
  Eyebrow,
  IconButton,
  Panel,
  PrimaryButton,
  Segmented,
  Stepper,
  Switch,
  type PanelChrome,
} from "@/components/home/ui";
import { primeAudio } from "@/lib/home/ambience";
import { formatClock, formatMinutes, formatNumber } from "@/lib/home/format";
import { currentStreak, focusReward, useGardenValue } from "@/lib/home/garden";
import { useNow } from "@/lib/home/store";
import {
  LIMITS,
  MODE_LABEL,
  pause,
  reset,
  setMode,
  skip,
  notificationsSupported,
  start,
  timeLeft,
  todayStats,
  updateSettings,
  useTimer,
  type TimerMode,
  type TimerSettings,
} from "@/lib/home/timer";
import { cn } from "@/lib/utils";

const MODES: { value: TimerMode; label: string }[] = [
  { value: "focus", label: "Focus" },
  { value: "short", label: "Short break" },
  { value: "long", label: "Long break" },
];

const RING_R = 100;
const RING_C = 2 * Math.PI * RING_R;

/** Instrument Serif's figures are proportional; fixed cells stop the clock jittering. */
const Digits = ({ value }: { value: string }) => (
  <span aria-hidden="true">
    {value.split("").map((ch, i) => (
      <span
        key={i}
        className={cn(
          "inline-block text-center",
          ch === ":" ? "w-[0.32em] -translate-y-[0.06em]" : "w-[0.56em]",
        )}
      >
        {ch}
      </span>
    ))}
  </span>
);

const Settings = ({
  settings,
  onClose,
}: {
  settings: TimerSettings;
  onClose: () => void;
}) => {
  const [blocked, setBlocked] = useState(false);

  const setNotify = async (on: boolean) => {
    if (!on) return updateSettings({ notify: false });
    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
    setBlocked(permission !== "granted");
    updateSettings({ notify: permission === "granted" });
  };

  return (
    <motion.div
      key="settings"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      className="flex flex-1 flex-col"
    >
      <div className="mb-2 flex items-center justify-between">
        <Eyebrow>Timer settings</Eyebrow>
        <IconButton label="Close settings" className="size-8" onClick={onClose}>
          <X className="size-4" />
        </IconButton>
      </div>
      <Stepper
        label="focus"
        format={(v) => `${v} min`}
        step={5}
        min={LIMITS.focus[0]}
        max={LIMITS.focus[1]}
        value={settings.focus}
        onChange={(focus) => updateSettings({ focus })}
      />
      <Stepper
        label="short break"
        format={(v) => `${v} min`}
        step={1}
        min={LIMITS.short[0]}
        max={LIMITS.short[1]}
        value={settings.short}
        onChange={(short) => updateSettings({ short })}
      />
      <Stepper
        label="long break"
        format={(v) => `${v} min`}
        step={5}
        min={LIMITS.long[0]}
        max={LIMITS.long[1]}
        value={settings.long}
        onChange={(long) => updateSettings({ long })}
      />
      <Stepper
        label="long break every"
        format={(v) => `${v} focus`}
        step={1}
        min={LIMITS.longEvery[0]}
        max={LIMITS.longEvery[1]}
        value={settings.longEvery}
        onChange={(longEvery) => updateSettings({ longEvery })}
      />
      <div className="border-glass-edge my-2 border-t" />
      <Switch
        label="Start the next session automatically"
        checked={settings.autoStart}
        onChange={(autoStart) => updateSettings({ autoStart })}
      />
      <Switch
        label="Chime when a session ends"
        checked={settings.chime}
        onChange={(chime) => updateSettings({ chime })}
      />
      {notificationsSupported() && (
        <Switch
          label="Notify me when away"
          hint={
            blocked
              ? "Notifications are blocked in your browser settings."
              : undefined
          }
          checked={settings.notify}
          onChange={setNotify}
        />
      )}
      <p className="text-muted-foreground mt-auto pt-3 text-xs">
        applies to the next session
      </p>
    </motion.div>
  );
};

/**
 * The timer's controls. What keeps time, chimes and pays out lives in
 * TimerEngine, which stays mounted while this card is tucked away.
 */
const FocusTimer = ({
  className,
  chrome,
}: {
  className?: string;
  chrome?: PanelChrome;
}) => {
  const timer = useTimer();
  const running = timer.status === "running";
  // Quarter-second resolution keeps the seconds digit turning over on time.
  const now = useNow(250, running);
  const [showSettings, setShowSettings] = useState(false);

  const left = running && now ? timeLeft(timer, now) : timeLeft(timer);
  const clock = formatClock(left);
  const progress = timer.duration ? 1 - left / timer.duration : 0;

  const today = todayStats(timer);
  const streak = useGardenValue(currentStreak);
  const minutes = timer.settings.focus;
  const reward = {
    drops: useGardenValue((s) => focusReward(s, minutes).drops),
    xp: useGardenValue((s) => focusReward(s, minutes).xp),
  };
  const isFocus = timer.mode === "focus";
  const sessionNo = (timer.cycle % timer.settings.longEvery) + 1;

  return (
    <Panel
      id="focus"
      title="focus"
      icon={TimerIcon}
      className={className}
      chrome={chrome}
      actions={
        <IconButton
          label={showSettings ? "Close timer settings" : "Timer settings"}
          aria-expanded={showSettings}
          onClick={() => setShowSettings((s) => !s)}
        >
          <Settings2 className="size-4" />
        </IconButton>
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {showSettings ? (
          <Settings
            key="settings"
            settings={timer.settings}
            onClose={() => setShowSettings(false)}
          />
        ) : (
          <motion.div
            key="clock"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-1 flex-col items-center"
          >
            <Segmented
              label="Timer mode"
              options={MODES.map((m) => ({
                ...m,
                label:
                  m.value === "focus" ? m.label : m.label.replace(" break", ""),
              }))}
              value={timer.mode}
              // Switching mode mid-session starts the new one afresh.
              onChange={(mode) => mode !== timer.mode && setMode(mode)}
              className="w-full max-w-xs"
            />
            {timer.status !== "idle" && (
              <p className="sr-only">Switching modes resets the timer.</p>
            )}

            <div className="relative my-5 aspect-square w-full max-w-[15.5rem]">
              <svg
                viewBox="0 0 220 220"
                className="absolute inset-0 -rotate-90"
              >
                <circle
                  cx="110"
                  cy="110"
                  r={RING_R}
                  fill="none"
                  stroke="currentColor"
                  strokeOpacity="0.08"
                  strokeWidth="5"
                />
                <circle
                  cx="110"
                  cy="110"
                  r={RING_R}
                  fill="none"
                  stroke={isFocus ? "var(--glow)" : "var(--glow-2)"}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  strokeDashoffset={RING_C * (1 - progress)}
                  style={{
                    filter: `drop-shadow(0 0 6px ${isFocus ? "var(--glow)" : "var(--glow-2)"})`,
                  }}
                  className={cn(progress === 0 && "opacity-0")}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Eyebrow className="mb-1">{MODE_LABEL[timer.mode]}</Eyebrow>
                <p
                  className="font-display text-[4.6rem] leading-none sm:text-[5.2rem]"
                  role="timer"
                  aria-label={`${clock} left`}
                >
                  <Digits value={clock} />
                </p>
                <p className="text-muted-foreground mt-2 min-h-4 text-xs">
                  {timer.status === "paused"
                    ? "paused"
                    : isFocus
                      ? `session ${sessionNo} of ${timer.settings.longEvery}`
                      : null}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <IconButton
                label="Reset"
                onClick={reset}
                disabled={timer.status === "idle"}
              >
                <RotateCcw className="size-4" />
              </IconButton>
              <PrimaryButton
                className="w-36"
                onClick={() => {
                  if (running) return pause();
                  // Unlock audio inside the click, so the end chime can play
                  // even if this tab is in the background by then.
                  primeAudio();
                  start();
                }}
              >
                {running ? (
                  <Pause className="size-4" />
                ) : (
                  <Play className="size-4" />
                )}
                {running
                  ? "Pause"
                  : timer.status === "paused"
                    ? "Resume"
                    : "Start"}
              </PrimaryButton>
              <IconButton label="Skip to the next session" onClick={skip}>
                <SkipForward className="size-4" />
              </IconButton>
            </div>

            <div className="border-glass-edge mt-6 grid w-full grid-cols-3 gap-2 border-t pt-4 text-center">
              <div>
                <Eyebrow>Today</Eyebrow>
                <p className="font-pixel mt-1 text-sm">
                  {formatMinutes(today.focusMinutes)}
                </p>
              </div>
              <div>
                <Eyebrow>Sessions</Eyebrow>
                <p className="font-pixel mt-1 text-sm">{today.sessions}</p>
              </div>
              <div>
                <Eyebrow>Streak</Eyebrow>
                <p className="font-pixel mt-1 flex items-center justify-center gap-1 text-sm">
                  <Flame
                    className={cn(
                      "size-3.5",
                      streak ? "text-glow" : "text-muted-foreground",
                    )}
                  />
                  {streak}d
                </p>
              </div>
            </div>
            <p className="text-muted-foreground mt-3 flex flex-wrap items-center justify-center gap-x-1.5 text-center text-xs">
              reward
              <span className="text-glow-2 font-pixel inline-flex items-center gap-0.5">
                <Droplet className="size-3" />
                {formatNumber(reward.drops)}
              </span>
              <span className="text-glow font-pixel">+{reward.xp} xp</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </Panel>
  );
};

export default FocusTimer;
