"use client";

import { useRef, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Eye, Gamepad2, Headphones, ListTodo, Pause, Play, Sprout, Timer as TimerIcon } from "lucide-react";
import EyeBreak from "@/components/home/EyeBreak";
import HudChip from "@/components/home/HudChip";
import SceneSwitcher from "@/components/home/SceneSwitcher";
import TimerEngine from "@/components/home/TimerEngine";
import { chipButton, chipGlass } from "@/components/home/ui";
import SiteSwitcher from "@/components/shared/SiteSwitcher";
import { primeAudio, useAmbiencePlaying } from "@/lib/home/ambience";
import { formatClock } from "@/lib/home/format";
import { activeAmbience, closePanels, togglePanel, usePrefs, type PanelId } from "@/lib/home/prefs";
import { getAmbience } from "@/lib/home/scenes";
import { useHydrated, useNow } from "@/lib/home/store";
import { MODE_LABEL, pause, start, timeLeft, useTimer } from "@/lib/home/timer";
import { sortTodos, useTodos } from "@/lib/home/todos";
import { cn } from "@/lib/utils";
import Arcade from "./Arcade";
import Eyes, { useEyeStatus } from "./Eyes";
import FocusTimer from "./FocusTimer";
import Garden from "./Garden";
import Greeting from "./Greeting";
import Sound, { Equaliser } from "./Sound";
import Tasks from "./Tasks";

/**
 * The whole of /home: the scene with a few small controls on it, and cards
 * that open from them.
 *
 * On desktop each card stays open until its chip is clicked again, or the
 * scene itself is, which closes them all. Tasks open bottom left. Everything on the right packs into a reverse L anchored
 * above the bottom-right chips: the garden, timer and eyes cards stack up
 * the right edge (garden at the top, under its level chip), while sound and
 * the arcade line up along the bottom, leftwards. Phones get a tab bar and
 * one sheet at a time instead.
 */

const LABEL: Record<PanelId, string> = {
  timer: "focus timer",
  tasks: "tasks",
  garden: "rain garden",
  eyes: "eye breaks",
  sound: "sound",
  arcade: "arcade",
};

const WIDE = "(min-width: 768px)";

function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Desktop or phone layout. False on the server, so cards and the sheet
 *  only appear once the client knows which it is. */
const useWide = () =>
  useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE).matches, () => false);

function useClock() {
  const timer = useTimer();
  const running = timer.status === "running";
  const now = useNow(250, running);
  return { timer, running, clock: formatClock(running && now ? timeLeft(timer, now) : timeLeft(timer)) };
}

const startOrPause = (running: boolean) => {
  if (running) return pause();
  // Unlock audio inside the click, so the end chime can play later.
  primeAudio();
  start();
};

/**
 * A card. `layout` lets the others glide into place when one opens or
 * closes; min-h-0 lets it shrink and scroll inside when space runs short.
 */
const Card = ({ className, children }: { className?: string; children: ReactNode }) => (
  <motion.div
    layout="position"
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.15 } }}
    transition={{ type: "spring", stiffness: 420, damping: 34 }}
    className={cn("pointer-events-auto flex min-h-0 flex-col", className)}
  >
    {children}
  </motion.div>
);

// Inside a card the panel shrinks to fit and scrolls.
const CARD_PANEL = "min-h-0 w-full overflow-y-auto";

const TasksChip = ({ open, onClick }: { open: boolean; onClick: () => void }) => {
  const todos = useTodos();
  const hydrated = useHydrated();
  const left = todos.filter((t) => !t.done).length;
  const next = sortTodos(todos).find((t) => !t.done);

  return (
    <button
      type="button"
      aria-expanded={open}
      onClick={onClick}
      className={cn(
        chipButton,
        "absolute bottom-8 left-10 hidden w-[19rem] flex-col gap-1 rounded-[1.25rem] px-4 py-3 text-left md:flex",
        open && "border-glow/55",
      )}
    >
      <span className="flex w-full items-center gap-2">
        <ListTodo className="text-glow size-4" />
        <span className="text-sm font-medium">tasks</span>
        <span className="text-muted-foreground ml-auto text-xs">
          {hydrated && (left ? `${left} to go` : "all clear")}
        </span>
      </span>
      <span className="text-muted-foreground w-full truncate text-[0.8rem]">
        {!hydrated ? " " : next ? (
          <>
            next: <span className="normal-case">{next.text}</span>
          </>
        ) : (
          "nothing yet"
        )}
      </span>
    </button>
  );
};

const TimerChip = ({ open, onOpen }: { open: boolean; onOpen: () => void }) => {
  const { timer, running, clock } = useClock();

  return (
    <div className={cn(chipGlass, "flex h-13 items-center gap-1 rounded-[1.1rem] p-1.5", open && "border-glow/55")}>
      <button
        type="button"
        aria-expanded={open}
        aria-label={`${LABEL.timer}, ${clock} left`}
        onClick={onOpen}
        className="focus-visible:ring-ring flex h-full cursor-pointer flex-col items-start justify-center rounded-xl px-3 leading-tight transition hover:bg-white/8 focus-visible:ring-2 focus-visible:outline-none"
      >
        <span className="text-muted-foreground text-[0.7rem]">
          {timer.status === "paused" ? "paused" : MODE_LABEL[timer.mode]}
        </span>
        <span className="font-pixel text-xl tabular-nums">{clock}</span>
      </button>
      <button
        type="button"
        aria-label={running ? "pause" : "start"}
        onClick={() => startOrPause(running)}
        className="bg-glow text-primary-foreground focus-visible:ring-ring grid size-10 cursor-pointer place-items-center rounded-xl transition hover:brightness-110 focus-visible:ring-2 focus-visible:outline-none"
      >
        {running ? <Pause className="size-4" /> : <Play className="ml-0.5 size-4" />}
      </button>
    </div>
  );
};

const SoundChip = ({ open, onClick }: { open: boolean; onClick: () => void }) => {
  const prefs = usePrefs();
  const playing = useAmbiencePlaying();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={LABEL.sound}
      onClick={onClick}
      className={cn(chipButton, "flex h-13 items-center gap-2.5 rounded-[1.1rem] px-4", open && "border-glow/55")}
    >
      <Equaliser on={playing} />
      <span className="text-sm">{getAmbience(activeAmbience(prefs)).short}</span>
    </button>
  );
};

const EyesChip = ({ open, onClick }: { open: boolean; onClick: () => void }) => {
  const status = useEyeStatus();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={`${LABEL.eyes}, ${status === "off" ? "off" : status === "now" ? "break due" : `next in ${status}`}`}
      onClick={onClick}
      className={cn(chipButton, "flex h-13 items-center gap-2 rounded-[1.1rem] px-4", open && "border-glow/55")}
    >
      <Eye className={cn("size-4", status === "now" ? "text-glow-2" : status === "off" && "text-muted-foreground")} />
      <span className={cn("font-pixel text-sm", status === "off" && "text-muted-foreground")}>{status}</span>
    </button>
  );
};

const TABS: { id: PanelId; icon: ComponentType<{ className?: string }> }[] = [
  { id: "timer", icon: TimerIcon },
  { id: "tasks", icon: ListTodo },
  { id: "garden", icon: Sprout },
  { id: "eyes", icon: Eye },
  { id: "sound", icon: Headphones },
  { id: "arcade", icon: Gamepad2 },
];

const TabBar = ({ active, onPick }: { active: PanelId | null; onPick: (id: PanelId) => void }) => {
  const { clock } = useClock();
  const eyes = useEyeStatus();
  const open = useTodos().filter((t) => !t.done).length;
  const hydrated = useHydrated();
  const caption = (id: PanelId) => (id === "timer" ? clock : id === "eyes" ? eyes : id);

  return (
    <nav
      aria-label="tools"
      className={cn(
        chipGlass,
        "fixed inset-x-3 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 grid h-16 grid-cols-6 items-center rounded-[1.6rem] px-1 md:hidden",
      )}
    >
      {TABS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={LABEL[id]}
          aria-pressed={active === id}
          onClick={() => onPick(id)}
          className={cn(
            "focus-visible:ring-ring relative mx-0.5 flex h-13 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[1.1rem] transition focus-visible:ring-2 focus-visible:outline-none",
            active === id ? "bg-white/14" : "hover:bg-white/6",
          )}
        >
          <Icon className="size-5" />
          <span
            className={cn(
              "text-[0.62rem]",
              id === "timer" || id === "eyes" ? "font-pixel" : "text-muted-foreground",
            )}
          >
            {caption(id)}
          </span>
          {id === "tasks" && hydrated && open > 0 && (
            <span className="bg-glow text-primary-foreground absolute top-1 right-2.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.6rem] font-semibold">
              {open}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

const PANELS: Record<PanelId, typeof Tasks> = {
  timer: FocusTimer,
  tasks: Tasks,
  garden: Garden,
  eyes: Eyes,
  sound: Sound,
  arcade: Arcade,
};

const Room = () => {
  const wide = useWide();
  const { openPanels } = usePrefs();
  const [sheet, setSheet] = useState<PanelId | null>(null);

  const isOpen = (id: PanelId) => wide && openPanels.includes(id);
  const toggle = (id: PanelId) => {
    if (wide) return togglePanel(id);
    setSheet((s) => (s === id ? null : id));
  };
  const chipOpen = (id: PanelId) => (wide ? openPanels.includes(id) : sheet === id);

  const rightColumn = isOpen("garden") || isOpen("timer") || isOpen("eyes");
  const SheetPanel = sheet ? PANELS[sheet] : null;

  // Only a press that starts and ends on the scene closes the cards. Cards
  // and chips sit over it, so the target says which was clicked, and
  // checking the start too means a drag out of a card (reordering tasks,
  // a slider) that is let go over the scene does not count.
  const pressedScene = useRef(false);

  return (
    <div
      className="relative h-dvh overflow-hidden"
      onPointerDown={(e) => {
        pressedScene.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // Phones close their sheet from its own scrim.
        if (wide && pressedScene.current && e.target === e.currentTarget) closePanels();
      }}
    >
      <TimerEngine />
      <EyeBreak />

      <Greeting className="pointer-events-none absolute top-[4.25rem] left-6 md:top-8 md:left-10" />

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 md:top-7 md:right-8 md:gap-2.5">
        <HudChip open={chipOpen("garden")} onClick={() => toggle("garden")} />
        <SceneSwitcher />
        <SiteSwitcher to="cs" className="text-nav-fg hover:text-nav-fg-hover size-10 justify-center" />
        <SiteSwitcher to="law" className="text-nav-fg hover:text-nav-fg-hover size-10 justify-center" />
      </div>

      <AnimatePresence>
        {isOpen("tasks") && (
          <motion.div
            key="tasks"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            className="absolute bottom-[7.25rem] left-10 z-10 flex max-h-[calc(100dvh-17rem)] w-[22rem] flex-col"
          >
            <Tasks className={CARD_PANEL} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* The reverse L. Its left edge stays clear of the tasks card. */}
      <div
        className={cn(
          "pointer-events-none absolute top-20 right-8 bottom-[6.5rem] z-10 hidden flex-row-reverse items-end gap-4 md:flex",
          isOpen("tasks") ? "left-[27rem]" : "left-10",
        )}
      >
        <AnimatePresence>
          {rightColumn && (
            <motion.div
              key="column"
              layout="position"
              exit={{ opacity: 0, transition: { duration: 0.15 } }}
              className="flex h-full w-[23rem] shrink-0 flex-col gap-4"
            >
              <AnimatePresence>
                {isOpen("garden") && (
                  // Takes only the room the cards below leave, up to its own
                  // height, so they never scroll while it can still give
                  // way. Its shop list scrolls well at any height.
                  <Card key="garden" className="max-h-fit min-h-48 flex-1 basis-0">
                    <Garden className={CARD_PANEL} />
                  </Card>
                )}
              </AnimatePresence>
              <div className="mt-auto flex min-h-0 flex-col-reverse gap-4">
                <AnimatePresence>
                  {isOpen("timer") && (
                    <Card key="timer">
                      <FocusTimer className={CARD_PANEL} />
                    </Card>
                  )}
                  {isOpen("eyes") && (
                    <Card key="eyes">
                      <Eyes className={CARD_PANEL} />
                    </Card>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
          {isOpen("sound") && (
            <Card key="sound" className="max-h-full w-[22rem] min-w-[19rem] shrink">
              <Sound className={CARD_PANEL} />
            </Card>
          )}
          {isOpen("arcade") && (
            // Shrinks before sound does: its cartridges reflow to fit.
            <Card key="arcade" className="@container max-h-full w-[34rem] min-w-[16rem] shrink-[3]">
              <Arcade className={CARD_PANEL} />
            </Card>
          )}
        </AnimatePresence>
      </div>

      <TasksChip open={chipOpen("tasks")} onClick={() => toggle("tasks")} />
      <div className="absolute right-8 bottom-8 hidden items-center gap-2.5 md:flex">
        <button
          type="button"
          aria-label={LABEL.arcade}
          aria-expanded={chipOpen("arcade")}
          onClick={() => toggle("arcade")}
          className={cn(chipButton, "grid size-13 place-items-center rounded-[1.1rem]", chipOpen("arcade") && "border-glow/55")}
        >
          <Gamepad2 className="size-5" />
        </button>
        <SoundChip open={chipOpen("sound")} onClick={() => toggle("sound")} />
        <EyesChip open={chipOpen("eyes")} onClick={() => toggle("eyes")} />
        <TimerChip open={chipOpen("timer")} onOpen={() => toggle("timer")} />
      </div>

      <AnimatePresence>
        {!wide && SheetPanel && (
          <motion.div
            key="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheet(null)}
            className="fixed inset-0 z-30 bg-black/30 md:hidden"
          />
        )}
        {!wide && SheetPanel && sheet && (
          <motion.div
            key="sheet"
            role="dialog"
            aria-label={LABEL[sheet]}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            // Anchored above the tab bar and only as tall as its contents,
            // up to just under the greeting.
            className="bg-glass-strong/85 border-glass-edge @container fixed inset-x-2.5 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-30 max-h-[calc(100dvh-16.25rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-[1.75rem] border px-5 pt-1.5 pb-5 backdrop-blur-xl md:hidden"
          >
            <button
              type="button"
              aria-label="close"
              onClick={() => setSheet(null)}
              className="mb-1 block h-6 w-full cursor-pointer"
            >
              <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-white/25" />
            </button>
            <SheetPanel chrome="bare" />
          </motion.div>
        )}
      </AnimatePresence>

      <TabBar active={sheet} onPick={toggle} />
    </div>
  );
};

export default Room;
