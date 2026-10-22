"use client";

import { useEffect, useState, useSyncExternalStore, type ComponentType, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Gamepad2, Headphones, ListTodo, Pause, Play, Sprout, Timer as TimerIcon } from "lucide-react";
import HudChip from "@/components/home/HudChip";
import SceneSwitcher from "@/components/home/SceneSwitcher";
import TimerEngine from "@/components/home/TimerEngine";
import { chipButton, chipGlass } from "@/components/home/ui";
import SiteSwitcher from "@/components/shared/SiteSwitcher";
import { primeAudio, useAmbiencePlaying } from "@/lib/home/ambience";
import { formatClock } from "@/lib/home/format";
import { usePrefs } from "@/lib/home/prefs";
import { getScene } from "@/lib/home/scenes";
import { useHydrated, useNow } from "@/lib/home/store";
import { MODE_LABEL, pause, start, timeLeft, useTimer } from "@/lib/home/timer";
import { sortTodos, useTodos } from "@/lib/home/todos";
import { cn } from "@/lib/utils";
import Arcade from "./Arcade";
import FocusTimer from "./FocusTimer";
import Garden from "./Garden";
import Greeting from "./Greeting";
import Sound, { Equaliser } from "./Sound";
import Tasks from "./Tasks";

/**
 * The whole of /home: the scene with a few small controls on it, and
 * everything else tucked into cards that open where their control is.
 *
 * Desktop puts a control in each corner: tasks bottom left, the garden (via
 * the level chip) top right, and timer, sound and arcade bottom right. The
 * right side shows one card at a time, so cards never land on each other.
 * Phones get a tab bar and a sheet instead.
 */

type CardId = "timer" | "tasks" | "garden" | "sound" | "arcade";
type RightCard = Exclude<CardId, "tasks">;

const LABEL: Record<CardId, string> = {
  timer: "focus timer",
  tasks: "tasks",
  garden: "rain garden",
  sound: "sound",
  arcade: "arcade",
};

const WIDE = "(min-width: 768px)";

function subscribeWide(onChange: () => void) {
  const mq = window.matchMedia(WIDE);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

/** Desktop or phone layout. Cards only open after a click, so the server's
 *  guess never has to match. */
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

/** A card opening out of its corner. */
const Card = ({ from, className, children }: { from: "top" | "bottom"; className: string; children: ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: from === "top" ? -10 : 10, scale: 0.98 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: from === "top" ? -10 : 10, scale: 0.98, transition: { duration: 0.15 } }}
    transition={{ type: "spring", stiffness: 420, damping: 34 }}
    className={cn("absolute z-10 flex flex-col", className)}
  >
    {children}
  </motion.div>
);

// Inside a card the panel shrinks to the card's max height and scrolls.
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
  const { scene } = usePrefs();
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
      <span className="text-sm">{getScene(scene).ambience}</span>
    </button>
  );
};

const TABS: { id: CardId; icon: ComponentType<{ className?: string }> }[] = [
  { id: "timer", icon: TimerIcon },
  { id: "tasks", icon: ListTodo },
  { id: "garden", icon: Sprout },
  { id: "sound", icon: Headphones },
  { id: "arcade", icon: Gamepad2 },
];

const TabBar = ({ active, onPick }: { active: CardId | null; onPick: (id: CardId) => void }) => {
  const { clock } = useClock();
  const open = useTodos().filter((t) => !t.done).length;
  const hydrated = useHydrated();

  return (
    <nav
      aria-label="tools"
      className={cn(
        chipGlass,
        "fixed inset-x-3 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-40 grid h-16 grid-cols-5 items-center rounded-[1.6rem] px-1.5 md:hidden",
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
          <span className={cn("text-[0.65rem]", id === "timer" ? "font-pixel" : "text-muted-foreground")}>
            {id === "timer" ? clock : id}
          </span>
          {id === "tasks" && hydrated && open > 0 && (
            <span className="bg-glow text-primary-foreground absolute top-1 right-3 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[0.6rem] font-semibold">
              {open}
            </span>
          )}
        </button>
      ))}
    </nav>
  );
};

const PANELS: Record<CardId, typeof Tasks> = {
  timer: FocusTimer,
  tasks: Tasks,
  garden: Garden,
  sound: Sound,
  arcade: Arcade,
};

const Room = () => {
  const wide = useWide();
  const [tasksOpen, setTasksOpen] = useState(false);
  const [right, setRight] = useState<RightCard | null>(null);
  const [sheet, setSheet] = useState<CardId | null>(null);

  const closeAll = () => {
    setTasksOpen(false);
    setRight(null);
    setSheet(null);
  };

  const toggle = (id: CardId) => {
    if (!wide) return setSheet((s) => (s === id ? null : id));
    if (id === "tasks") return setTasksOpen((o) => !o);
    setRight((r) => (r === id ? null : id));
  };

  // Escape tucks everything away, unless a game is open: that closes first.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || document.querySelector('[aria-modal="true"]')) return;
      setTasksOpen(false);
      setRight(null);
      setSheet(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const SheetPanel = sheet ? PANELS[sheet] : null;

  return (
    <div
      className="relative h-dvh overflow-hidden"
      // A click on the bare scene tucks everything away.
      onPointerDown={(e) => e.target === e.currentTarget && closeAll()}
    >
      <TimerEngine />

      <Greeting className="pointer-events-none absolute top-[4.25rem] left-6 md:top-8 md:left-10" />

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 md:top-7 md:right-8 md:gap-2.5">
        <HudChip open={wide ? right === "garden" : sheet === "garden"} onClick={() => toggle("garden")} />
        <SceneSwitcher />
        <SiteSwitcher to="cs" className="text-nav-fg hover:text-nav-fg-hover size-10 justify-center" />
        <SiteSwitcher to="law" className="text-nav-fg hover:text-nav-fg-hover size-10 justify-center" />
      </div>

      <AnimatePresence>
        {wide && tasksOpen && (
          <Card key="tasks" from="bottom" className="bottom-[7.25rem] left-10 max-h-[calc(100dvh-17rem)] w-[22rem]">
            <Tasks className={CARD_PANEL} />
          </Card>
        )}
        {wide && right === "garden" && (
          <Card key="garden" from="top" className="top-20 right-8 max-h-[calc(100dvh-12rem)] w-[24rem]">
            <Garden className={CARD_PANEL} />
          </Card>
        )}
        {wide && right === "timer" && (
          <Card key="timer" from="bottom" className="right-8 bottom-[6.5rem] max-h-[calc(100dvh-12rem)] w-[21rem]">
            <FocusTimer className={CARD_PANEL} />
          </Card>
        )}
        {wide && right === "sound" && (
          <Card key="sound" from="bottom" className="right-8 bottom-[6.5rem] max-h-[calc(100dvh-12rem)] w-[22rem]">
            <Sound className={CARD_PANEL} />
          </Card>
        )}
        {wide && right === "arcade" && (
          <Card key="arcade" from="bottom" className="right-8 bottom-[6.5rem] max-h-[calc(100dvh-12rem)] w-[38rem] max-w-[calc(100vw-4rem)]">
            <Arcade className={CARD_PANEL} />
          </Card>
        )}
      </AnimatePresence>

      <TasksChip open={tasksOpen} onClick={() => toggle("tasks")} />
      <div className="absolute right-8 bottom-8 hidden items-center gap-2.5 md:flex">
        <button
          type="button"
          aria-label={LABEL.arcade}
          aria-expanded={right === "arcade"}
          onClick={() => toggle("arcade")}
          className={cn(chipButton, "grid size-13 place-items-center rounded-[1.1rem]", right === "arcade" && "border-glow/55")}
        >
          <Gamepad2 className="size-5" />
        </button>
        <SoundChip open={right === "sound"} onClick={() => toggle("sound")} />
        <TimerChip open={right === "timer"} onOpen={() => toggle("timer")} />
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
            className="bg-glass-strong/85 border-glass-edge fixed inset-x-2.5 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-30 max-h-[calc(100dvh-16.25rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-[1.75rem] border px-5 pt-1.5 pb-5 backdrop-blur-xl md:hidden"
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
