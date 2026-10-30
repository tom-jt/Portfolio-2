"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentType,
  type ReactNode,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import {
  Eye,
  Gamepad2,
  Headphones,
  ListTodo,
  Maximize2,
  Minimize2,
  Music2,
  Pause,
  Play,
  Sprout,
  Timer as TimerIcon,
} from "lucide-react";
import EyeBreak from "@/components/home/EyeBreak";
import HudChip from "@/components/home/HudChip";
import Pet from "@/components/home/Pet";
import { LinkKeys, QuickLinksBar, QuickLinksMenu, QuickLinksPanel } from "@/components/home/QuickLinks";
import SceneSwitcher from "@/components/home/SceneSwitcher";
import TimerEngine from "@/components/home/TimerEngine";
import { chipButton, chipGlass } from "@/components/home/ui";
import SiteSwitcher from "@/components/shared/SiteSwitcher";
import { primeAudio, useAmbiencePlaying } from "@/lib/home/ambience";
import { isUnlocked } from "@/lib/home/cosmetics";
import { formatClock } from "@/lib/home/format";
import { useGardenValue } from "@/lib/home/garden";
import { getPet } from "@/lib/home/pets";
import {
  activeAmbience,
  closePanels,
  setPrefs,
  togglePanel,
  usePrefs,
  type PanelId,
} from "@/lib/home/prefs";
import { getAmbience } from "@/lib/home/scenes";
import {
  spotifyHeld,
  toggleSpotify,
  useSpotifyPlaying,
  useSpotifyReady,
} from "@/lib/home/spotify";
import { useHydrated, useNow } from "@/lib/home/store";
import { MODE_LABEL, pause, start, timeLeft, useTimer } from "@/lib/home/timer";
import { sortTodos, useTodos } from "@/lib/home/todos";
import { cn } from "@/lib/utils";
import Arcade from "./Arcade";
import Eyes, { useEyeStatus } from "./Eyes";
import FocusTimer from "./FocusTimer";
import Garden from "./Garden";
import Greeting from "./Greeting";
import Sound, { Equaliser, toggleAmbience } from "./Sound";
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
 *
 * In immersive mode the controls and the greeting fade away, leaving the
 * scene, and the pet drops to the bottom of the screen. The controls are
 * still there, and still work: each fades back in while what it opened is
 * open.
 */

const LABEL: Record<PanelId, string> = {
  timer: "focus timer",
  tasks: "tasks",
  garden: "rain garden",
  eyes: "eye breaks",
  sound: "sound",
  arcade: "arcade",
  links: "quick links",
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
  useSyncExternalStore(
    subscribeWide,
    () => window.matchMedia(WIDE).matches,
    () => false,
  );

function useClock() {
  const timer = useTimer();
  const running = timer.status === "running";
  const now = useNow(250, running);
  return {
    timer,
    running,
    clock: formatClock(running && now ? timeLeft(timer, now) : timeLeft(timer)),
  };
}

const startOrPause = (running: boolean) => {
  if (running) return pause();
  // Unlock audio inside the click, so the end chime can play later.
  primeAudio();
  start();
};

const CARD_GONE = {
  opacity: 0,
  y: 10,
  scale: 0.98,
  transition: { duration: 0.15 },
};

/**
 * A card. `layout` lets the others glide into place when one opens or
 * closes; min-h-0 lets it shrink and scroll inside when space runs short.
 * `hidden` closes it without unmounting, for a card playing music.
 */
const Card = ({
  className,
  hidden,
  children,
}: {
  className?: string;
  hidden?: boolean;
  children: ReactNode;
}) => (
  <motion.div
    layout="position"
    initial={{ opacity: 0, y: 10, scale: 0.98 }}
    animate={
      hidden
        ? { ...CARD_GONE, transitionEnd: { display: "none" } }
        : { opacity: 1, y: 0, scale: 1, display: "flex" }
    }
    exit={CARD_GONE}
    transition={{ type: "spring", stiffness: 420, damping: 34 }}
    aria-hidden={hidden || undefined}
    className={cn(
      "pointer-events-auto flex min-h-0 flex-col",
      hidden && "pointer-events-none",
      className,
    )}
  >
    {children}
  </motion.div>
);

/**
 * A control that fades away in immersive mode, staying where it was and
 * still working: it shows again while what it opened is open (anything in
 * it marked aria-expanded), or while it has the keyboard's focus.
 */
const Fade = ({
  hide,
  className,
  children,
}: {
  hide: boolean;
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "transition-opacity duration-500",
      hide &&
        "opacity-0 has-[:focus-visible]:opacity-100 has-[[aria-expanded=true]]:opacity-100",
      className,
    )}
  >
    {children}
  </div>
);

// Inside a card the panel shrinks to fit and scrolls.
const CARD_PANEL = "min-h-0 w-full overflow-y-auto";

const TasksChip = ({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) => {
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
        {!hydrated ? (
          " "
        ) : next ? (
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
    <div
      className={cn(
        chipGlass,
        "flex h-13 items-center gap-1 rounded-[1.1rem] p-1.5",
        open && "border-glow/55",
      )}
    >
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
        {running ? (
          <Pause className="size-4" />
        ) : (
          <Play className="ml-0.5 size-4" />
        )}
      </button>
    </div>
  );
};

/** A small round play/pause inside a chip. */
const ChipPlay = ({
  playing,
  label,
  onClick,
  children,
  ...rest
}: {
  playing: boolean;
  label: string;
  onClick: () => void;
  children?: ReactNode;
  "data-ambience-toggle"?: boolean;
}) => (
  <button
    type="button"
    aria-pressed={playing}
    aria-label={`${playing ? "Pause" : "Play"} ${label}`}
    title={`${playing ? "Pause" : "Play"} ${label}`}
    onClick={onClick}
    className="focus-visible:ring-ring relative grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl transition hover:bg-white/8 focus-visible:ring-2 focus-visible:outline-none"
    {...rest}
  >
    {playing ? (
      <Pause className="size-4" />
    ) : (
      <Play className="ml-0.5 size-4" />
    )}
    {children}
  </button>
);

/**
 * The sound card's chip: opens the card, and plays or pauses the ambience
 * without opening it. Once Spotify's player is loaded (the card has been
 * open, or it's playing with the card shut), Spotify gets a button too.
 */
const SoundChip = ({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) => {
  const prefs = usePrefs();
  const playing = useAmbiencePlaying();
  const spotifyReady = useSpotifyReady();
  const spotifyPlaying = useSpotifyPlaying();
  return (
    <div
      className={cn(
        chipGlass,
        "flex h-13 items-center gap-0.5 rounded-[1.1rem] p-1.5",
        open && "border-glow/55",
      )}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-label={LABEL.sound}
        onClick={onClick}
        className="focus-visible:ring-ring flex h-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 transition hover:bg-white/8 focus-visible:ring-2 focus-visible:outline-none"
      >
        <Equaliser on={playing} />
        <span className="text-sm">
          {getAmbience(activeAmbience(prefs)).short}
        </span>
      </button>
      {/* Marked so the resume-on-first-click listener leaves it be. */}
      <ChipPlay
        data-ambience-toggle
        playing={playing}
        label="ambience"
        onClick={() => toggleAmbience(playing)}
      />
      {spotifyReady && (
        <ChipPlay
          playing={spotifyPlaying}
          label="Spotify"
          onClick={toggleSpotify}
        >
          <Music2 className="text-glow absolute top-1 right-1 size-2.5" />
        </ChipPlay>
      )}
    </div>
  );
};

const EyesChip = ({
  open,
  onClick,
}: {
  open: boolean;
  onClick: () => void;
}) => {
  const status = useEyeStatus();
  return (
    <button
      type="button"
      aria-expanded={open}
      aria-label={`${LABEL.eyes}, ${status === "off" ? "off" : status === "now" ? "break due" : `next in ${status}`}`}
      onClick={onClick}
      className={cn(
        chipButton,
        "flex h-13 items-center gap-2 rounded-[1.1rem] px-4",
        open && "border-glow/55",
      )}
    >
      <Eye
        className={cn(
          "size-4",
          status === "now"
            ? "text-glow-2"
            : status === "off"
              ? "text-muted-foreground"
              : "text-glow",
        )}
      />
      <span
        className={cn(
          "font-pixel text-sm",
          status === "off" && "text-muted-foreground",
        )}
      >
        {status}
      </span>
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

const TabBar = ({
  active,
  onPick,
  immersive,
  children,
}: {
  active: PanelId | null;
  onPick: (id: PanelId) => void;
  /** Glass and tabs faded out, but for the open one. */
  immersive: boolean;
  /** The pet, which walks along the top. */
  children?: ReactNode;
}) => {
  const { clock } = useClock();
  const eyes = useEyeStatus();
  const open = useTodos().filter((t) => !t.done).length;
  const hydrated = useHydrated();
  const caption = (id: PanelId) =>
    id === "timer" ? clock : id === "eyes" ? eyes : id;

  return (
    // Above the quick links button, so the pet walks in front of it.
    <nav
      aria-label="tools"
      className="text-foreground fixed inset-x-3 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[41] grid h-16 grid-cols-6 items-center rounded-[1.6rem] px-1 md:hidden"
    >
      {/* The bar's glass, on its own, so it can fade while a tab stays. */}
      <span
        aria-hidden="true"
        className={cn(
          chipGlass,
          "pointer-events-none absolute inset-0 rounded-[1.6rem] transition-opacity duration-500",
          immersive && "opacity-0",
        )}
      />
      {children}
      {TABS.map(({ id, icon: Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={LABEL[id]}
          aria-pressed={active === id}
          onClick={() => onPick(id)}
          className={cn(
            "focus-visible:ring-ring relative mx-0.5 flex h-13 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[1.1rem] transition duration-500 focus-visible:ring-2 focus-visible:outline-none",
            active === id ? "bg-white/14" : "hover:bg-white/6",
            immersive && active !== id && "opacity-0 focus-visible:opacity-100",
          )}
        >
          <Icon className="text-glow size-5" />
          <span
            className={cn(
              "text-[0.62rem]",
              id === "timer" || id === "eyes"
                ? "font-pixel"
                : "text-muted-foreground",
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
  links: QuickLinksPanel,
};

const Room = () => {
  const wide = useWide();
  const { openPanels, pet, immersive } = usePrefs();
  // Only whether the pet is unlocked: the room holds every card, so it
  // mustn't re-render each time the garden ticks.
  const showPet = useGardenValue((s) =>
    pet && isUnlocked(getPet(pet).unlock, s) ? pet : null,
  );
  const [sheet, setSheet] = useState<PanelId | null>(null);

  const isOpen = (id: PanelId) => wide && openPanels.includes(id);
  const toggle = (id: PanelId) => {
    if (wide) return togglePanel(id);
    setSheet((s) => (s === id ? null : id));
  };
  const chipOpen = (id: PanelId) =>
    wide ? openPanels.includes(id) : sheet === id;

  const rightColumn = isOpen("garden") || isOpen("timer") || isOpen("eyes");
  const SheetPanel = sheet ? PANELS[sheet] : null;
  // Closing the sound card would stop Spotify mid-song, so while it plays,
  // and for a while after a pause (to resume from the chip), the card only
  // hides. Otherwise it unmounts as usual, which frees the heavy embed.
  const spotifyPlaying = useSpotifyPlaying();
  const now = useNow(30_000, !spotifyPlaying);
  const keepSound = spotifyHeld(now);

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
        if (wide && pressedScene.current && e.target === e.currentTarget)
          closePanels();
      }}
    >
      <TimerEngine />
      <EyeBreak />

      <Greeting
        className={cn(
          "pointer-events-none absolute top-[4.25rem] left-6 transition-opacity duration-500 md:top-8 md:left-10",
          immersive && "opacity-0",
        )}
      />

      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 md:top-7 md:right-8 md:gap-2.5">
        <Fade hide={immersive}>
          <HudChip open={chipOpen("garden")} onClick={() => toggle("garden")} />
        </Fade>
        <Fade hide={immersive}>
          <SceneSwitcher />
        </Fade>
        <button
          type="button"
          aria-pressed={immersive}
          aria-label="immersive mode"
          title={immersive ? "show the controls" : "immersive mode: hide the controls"}
          onClick={() => setPrefs({ immersive: !immersive })}
          className="text-nav-fg hover:text-nav-fg-hover focus-visible:ring-ring grid size-10 cursor-pointer place-items-center rounded-full transition focus-visible:ring-2 focus-visible:outline-none"
        >
          {immersive ? <Minimize2 className="size-5" /> : <Maximize2 className="size-5" />}
        </button>
        <Fade hide={immersive} className="flex items-center gap-1.5 md:gap-2.5">
          {/* Phones: one mark for both portfolios, opening the CS one. */}
          <SiteSwitcher
            to="cs"
            className="size-10 justify-center md:hidden"
            icon={
              <Image
                src="/images/logos/LogoSimpleDarkTrans.png"
                alt=""
                width={24}
                height={24}
              />
            }
          />
          <SiteSwitcher
            to="cs"
            className="text-nav-fg hover:text-nav-fg-hover hidden size-10 justify-center md:flex"
          />
          <SiteSwitcher
            to="law"
            className="text-nav-fg hover:text-nav-fg-hover hidden size-10 justify-center md:flex"
          />
        </Fade>
      </div>

      {/* The tasks card, and the links card beside it, at the bottom left. */}
      <div className="pointer-events-none absolute bottom-[7.25rem] left-10 z-10 hidden max-h-[calc(100dvh-17rem)] items-end gap-4 md:flex">
        <AnimatePresence>
          {isOpen("tasks") && (
            <Card key="tasks" className="max-h-[calc(100dvh-17rem)] w-[22rem]">
              <Tasks className={CARD_PANEL} />
            </Card>
          )}
          {isOpen("links") && (
            <Card key="links" className="max-h-[calc(100dvh-17rem)] w-[22rem]">
              <QuickLinksPanel className={CARD_PANEL} />
            </Card>
          )}
        </AnimatePresence>
      </div>

      {/* The reverse L. Its left edge stays clear of the cards at the left. */}
      <div
        className={cn(
          "pointer-events-none absolute top-20 right-8 bottom-[6.5rem] z-10 hidden flex-row-reverse items-end gap-4 md:flex",
          // Clear of the cards at the bottom left, however many are open.
          ["left-10", "left-[27rem]", "left-[50.5rem]"][
            Number(isOpen("tasks")) + Number(isOpen("links"))
          ],
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
                  <Card
                    key="garden"
                    className="max-h-fit min-h-48 flex-1 basis-0"
                  >
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
          {wide && (isOpen("sound") || keepSound) && (
            <Card
              key="sound"
              hidden={!isOpen("sound")}
              className="max-h-full w-[22rem] min-w-[19rem] shrink"
            >
              <Sound className={CARD_PANEL} />
            </Card>
          )}
          {isOpen("arcade") && (
            // Shrinks before sound does: its cartridges reflow to fit.
            <Card
              key="arcade"
              className="@container max-h-full w-[34rem] min-w-[16rem] shrink-[3]"
            >
              <Arcade className={CARD_PANEL} />
            </Card>
          )}
        </AnimatePresence>
      </div>

      <Fade hide={immersive}>
        <TasksChip open={chipOpen("tasks")} onClick={() => toggle("tasks")} />
      </Fade>
      {/* Beside the tasks, stopping short of the chips on the right. */}
      <Fade hide={immersive}>
        <QuickLinksBar className="absolute bottom-8 left-[22.25rem] z-20 hidden max-w-[max(5rem,calc(100vw-51rem))] md:flex" />
      </Fade>
      <LinkKeys />
      <div className="absolute right-8 bottom-8 hidden items-center gap-2.5 md:flex">
        {/* The pet lives on top of these chips. */}
        {wide && showPet && <Pet id={showPet} grounded={immersive} />}
        <Fade hide={immersive}>
          <button
            type="button"
            aria-label={LABEL.arcade}
            aria-expanded={chipOpen("arcade")}
            onClick={() => toggle("arcade")}
            className={cn(
              chipButton,
              "grid size-13 place-items-center rounded-[1.1rem]",
              chipOpen("arcade") && "border-glow/55",
            )}
          >
            <Gamepad2 className="text-glow size-5" />
          </button>
        </Fade>
        <Fade hide={immersive}>
          <SoundChip open={chipOpen("sound")} onClick={() => toggle("sound")} />
        </Fade>
        <Fade hide={immersive}>
          <EyesChip open={chipOpen("eyes")} onClick={() => toggle("eyes")} />
        </Fade>
        <Fade hide={immersive}>
          <TimerChip open={chipOpen("timer")} onOpen={() => toggle("timer")} />
        </Fade>
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
        {!wide && (sheet || keepSound) && (
          <motion.div
            key="sheet"
            role={sheet ? "dialog" : undefined}
            aria-label={sheet ? LABEL[sheet] : undefined}
            aria-hidden={!sheet || undefined}
            initial={{ opacity: 0, y: 40 }}
            // Kept for Spotify with nothing open: hidden, still mounted.
            animate={
              sheet
                ? { opacity: 1, y: 0, display: "block" }
                : {
                    opacity: 0,
                    y: 40,
                    transition: { duration: 0.15 },
                    transitionEnd: { display: "none" },
                  }
            }
            exit={{ opacity: 0, y: 40, transition: { duration: 0.15 } }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            // Anchored above the tab bar and only as tall as its contents,
            // up to just under the greeting.
            className="bg-glass-strong/85 border-glass-edge @container fixed inset-x-2.5 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-30 max-h-[calc(100dvh-16.25rem-env(safe-area-inset-bottom))] overflow-y-auto rounded-[1.75rem] border px-5 pt-1.5 pb-5 md:hidden"
          >
            <button
              type="button"
              aria-label="close"
              onClick={() => setSheet(null)}
              className="mb-1 block h-6 w-full cursor-pointer"
            >
              <span
                aria-hidden="true"
                className="mx-auto block h-1 w-10 rounded-full bg-white/25"
              />
            </button>
            {SheetPanel && sheet !== "sound" && <SheetPanel chrome="bare" />}
            {/* Its own slot, so switching tabs doesn't remount it and stop the music. */}
            {(sheet === "sound" || keepSound) && (
              <div className={sheet === "sound" ? undefined : "hidden"}>
                <Sound chrome="bare" />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phones: just above the tab bar, at the right, in thumb's reach. */}
      <Fade hide={immersive}>
        <QuickLinksMenu className={cn("fixed right-4 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 md:hidden", sheet && "hidden")} />
      </Fade>
      <TabBar active={sheet} onPick={toggle} immersive={immersive}>
        {/* Phones: the pet walks along the top of the tab bar. */}
        {!wide && showPet && <Pet id={showPet} grounded={immersive} />}
      </TabBar>
    </div>
  );
};

export default Room;
