"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { Panel, Stepper, Switch, textButton, type PanelChrome } from "@/components/home/ui";
import { primeAudio } from "@/lib/home/ambience";
import {
  breaksToday,
  EYE_LIMITS,
  setEnabled,
  setEyeInterval,
  setEyeOption,
  startRest,
  useEyes,
  type EyeState,
} from "@/lib/home/eyes";
import { formatMinutes } from "@/lib/home/format";
import { useHydrated, useNow } from "@/lib/home/store";
import { notificationsSupported } from "@/lib/home/timer";
import { cn } from "@/lib/utils";

/** "12m", "now" or "off": the eye reminder at a glance, for chips and tabs. */
export function useEyeStatus() {
  const eyes = useEyes();
  const hydrated = useHydrated();
  const now = useNow(15_000, eyes.enabled && eyes.phase === "idle");
  return eyeStatus(eyes, hydrated ? now : 0);
}

function eyeStatus(eyes: EyeState, now: number) {
  if (!eyes.enabled) return "off";
  if (eyes.phase !== "idle") return "now";
  if (!now || !eyes.nextAt) return `${eyes.interval}m`;
  return `${Math.max(1, Math.ceil((eyes.nextAt - now) / 60_000))}m`;
}

/** Eye-break settings: how often, and how it gets your attention. */
const Eyes = ({
  className,
  chrome,
}: {
  className?: string;
  chrome?: PanelChrome;
}) => {
  const eyes = useEyes();
  const status = useEyeStatus();
  const [blocked, setBlocked] = useState(false);

  const setNotify = async (on: boolean) => {
    if (!on) return setEyeOption({ notify: false });
    const permission =
      Notification.permission === "default"
        ? await Notification.requestPermission()
        : Notification.permission;
    setBlocked(permission !== "granted");
    setEyeOption({ notify: permission === "granted" });
  };

  return (
    <Panel
      id="eyes"
      title="eyes"
      icon={Eye}
      className={className}
      chrome={chrome}
      actions={
        <span className="text-muted-foreground text-xs">
          {status === "off"
            ? "off"
            : status === "now"
              ? "break due"
              : `next in ${status}`}
        </span>
      }
    >
      <Switch
        label="break reminders"
        hint="look 20 metres away for 20 seconds"
        checked={eyes.enabled}
        onChange={(on) => {
          // Inside the click, so the reminder's sound is allowed to play later.
          primeAudio();
          setEnabled(on);
        }}
      />
      <Stepper
        label="remind every"
        value={eyes.interval}
        min={EYE_LIMITS.min}
        max={EYE_LIMITS.max}
        step={EYE_LIMITS.step}
        format={formatMinutes}
        onChange={setEyeInterval}
      />
      <Switch
        label="gentle sound"
        checked={eyes.sound}
        onChange={(sound) => setEyeOption({ sound })}
      />
      {notificationsSupported() && (
        <Switch
          label="notify me in other tabs"
          hint={
            blocked
              ? "notifications are blocked in your browser settings"
              : undefined
          }
          checked={eyes.notify}
          onChange={setNotify}
        />
      )}
      <div className="border-glass-edge mt-2 flex items-center justify-between gap-3 border-t pt-3 text-xs">
        <span className="text-muted-foreground">
          <span className="font-pixel text-foreground/80">
            {breaksToday(eyes)}
          </span>{" "}
          breaks today
        </span>
        <button
          type="button"
          onClick={() => {
            primeAudio();
            startRest(false);
          }}
          className={cn(textButton, "text-glow")}
        >
          rest now
        </button>
      </div>
    </Panel>
  );
};

export default Eyes;
