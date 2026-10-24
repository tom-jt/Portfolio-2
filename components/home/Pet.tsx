"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import {
  getPet,
  PET_FPS,
  PET_FRAME,
  PET_ROWS,
  PET_SLEEP_AFTER_MS,
  PET_WAKE_AFTER_MS,
  petRow,
  petSheet,
  type Facing,
  type PetAnim,
  type PetId,
} from "@/lib/home/pets";

/** Drawn at the sprite's own size, in crisp pixels. */
const SIZE = PET_FRAME;
/** The sprites' feet sit this far above the bottom of each frame. */
const FEET = 10;
/** Pixels a second when walking. */
const SPEED = 30;

const between = (a: number, b: number) => a + (b - a) * Math.random();

/**
 * The pet, walking along the top of the chips its parent lays out. It idles,
 * then wanders to somewhere else along them; clicking it makes it happy; and
 * it sleeps once the page has been hidden, unfocused or closed for five
 * minutes, waking a minute after the visitor is back.
 *
 * Animated by stepping the sprite sheet behind a fixed frame, and moved with
 * a transform, both written straight to the element twelve times a second,
 * so it never re-renders React.
 */
const Pet = ({ id }: { id: PetId }) => {
  const lane = useRef<HTMLDivElement>(null);
  const sprite = useRef<HTMLButtonElement>(null);
  const reduced = useReducedMotion();
  /** Set by a click, read by the loop. */
  const petted = useRef(false);

  useEffect(() => {
    const el = sprite.current;
    const track = lane.current;
    if (!el || !track) return;
    const def = getPet(id);

    let anim: PetAnim = "idle";
    let facing: Facing = Math.random() < 0.5 ? "left" : "right";
    let frame = 0;
    /** Idling rests on its first frame until then, between loops. */
    let restUntil = 0;
    let tick = 0;
    let x = Math.max(0, track.clientWidth - SIZE) * Math.random();
    let target = x;
    /** When the current idle or happy spell ends. */
    let until = performance.now() + between(2000, 6000);

    // Sleep: away since when (null while here), and when to wake once back.
    let awaySince: number | null = document.hidden || !document.hasFocus() ? Date.now() : null;
    let asleep = false;
    let wakeAt: number | null = null;

    const goAway = () => (awaySince ??= Date.now());
    const comeBack = () => {
      awaySince = null;
      if (asleep) wakeAt = Date.now() + PET_WAKE_AFTER_MS;
    };
    const onVisibility = () => (document.hidden ? goAway() : document.hasFocus() && comeBack());
    // Back from a long absence (the page was closed or its timers frozen):
    // asleep now, awake a minute from now.
    const onBackFromAway = () => {
      asleep = true;
      wakeAt = Date.now() + PET_WAKE_AFTER_MS;
    };
    window.addEventListener("blur", goAway);
    window.addEventListener("focus", comeBack);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("home:back-from-away", onBackFromAway);

    const set = (next: PetAnim) => {
      if (next === anim) return;
      frame = 0;
      // Settling into an idle starts with a rest, not straight into a glance.
      if (next === "idle") restUntil = performance.now() + between(400, 1200);
      anim = next;
    };

    /** The column to show: some pets' walk cycles run last frame to first. */
    const column = () =>
      anim === "idle"
        ? def.idle[frame]
        : anim === "walk" && def.walkReversed
          ? def.frames.walk - 1 - frame
          : frame;

    const draw = () => {
      el.style.transform = `translate3d(${x}px, 0, 0)`;
      el.style.backgroundPosition = `${-column() * SIZE}px ${-petRow(anim, facing) * SIZE}px`;
    };

    const step = () => {
      const now = Date.now();
      const t = performance.now();
      const maxX = Math.max(0, track.clientWidth - SIZE);
      x = Math.min(x, maxX);

      if (awaySince !== null && now - awaySince >= PET_SLEEP_AFTER_MS) {
        asleep = true;
        wakeAt = null;
      }
      if (asleep && wakeAt !== null && now >= wakeAt && awaySince === null) {
        asleep = false;
        wakeAt = null;
        set("idle");
        until = t + between(1500, 4000);
      }

      if (petted.current) {
        petted.current = false;
        asleep = false;
        wakeAt = null;
        set("happy");
        // Two turns of the happy loop.
        until = t + (2 * def.frames.happy * 1000) / PET_FPS;
      }

      if (asleep) set("sleep");
      else if (anim === "sleep") set("idle");
      else if (anim === "happy" || anim === "idle") {
        // An idle sets off only from its rest pose, never mid-glance.
        if (t >= until && (anim === "happy" || frame === 0)) {
          // Off somewhere else along the chips, at least a little way.
          target = between(0, maxX);
          if (Math.abs(target - x) < 40 || reduced) {
            until = t + between(2000, 6000);
            set("idle");
          } else {
            facing = target > x ? "right" : "left";
            set("walk");
          }
        }
      } else if (anim === "walk") {
        const move = SPEED / PET_FPS;
        if (Math.abs(target - x) <= move) {
          x = target;
          set("idle");
          until = t + between(2500, 8000);
        } else x += Math.sign(target - x) * move;
      }

      // The idle follows its route at half speed, then rests on the rest
      // pose for a moment before going round again.
      if (anim === "idle") {
        tick += 1;
        if (t >= restUntil && tick % 2 === 0) {
          // The route ends where it starts, so its last step is the rest.
          frame = (frame + 1) % (def.idle.length - 1);
          if (frame === 0) restUntil = t + between(400, 1200);
        }
      } else frame = (frame + 1) % def.frames[anim];
      draw();
    };

    draw();
    const timer = setInterval(() => {
      if (!document.hidden) step();
    }, 1000 / PET_FPS);

    return () => {
      clearInterval(timer);
      window.removeEventListener("blur", goAway);
      window.removeEventListener("focus", comeBack);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("home:back-from-away", onBackFromAway);
    };
  }, [id, reduced]);

  return (
    // The lane spans the chips; the pet's feet rest on their top edge.
    <div ref={lane} className="pointer-events-none absolute inset-x-0 bottom-full" style={{ height: SIZE, marginBottom: -FEET }}>
      <button
        ref={sprite}
        type="button"
        aria-label={`your ${getPet(id).name}: pet it`}
        title={getPet(id).name}
        onClick={() => (petted.current = true)}
        className="focus-visible:ring-ring pointer-events-auto absolute bottom-0 left-0 cursor-pointer rounded-md focus-visible:ring-2 focus-visible:outline-none"
        style={{
          width: SIZE,
          height: SIZE,
          backgroundImage: `url(${petSheet(id)})`,
          backgroundSize: `${12 * SIZE}px ${PET_ROWS * SIZE}px`,
          backgroundRepeat: "no-repeat",
          imageRendering: "pixelated",
        }}
      />
    </div>
  );
};

export default Pet;
