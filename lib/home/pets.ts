/**
 * Pets: a small animal that lives on top of the chips in the bottom-right
 * corner, walking about between them. One opens every few levels.
 *
 * Sprites are Frakassets' "Free Pets Pack" (CC BY 4.0, credited in the
 * picker), cut down by hand to one sheet each in public/home/pets: 64px
 * frames played at 12 frames a second. It faces you to idle, be happy and
 * sleep, and turns side-on only to walk, so the sheet has five rows: idle,
 * walk right, walk left, happy, sleep.
 */

import type { Unlock } from "./cosmetics";

export type PetId =
  | "cat-orange"
  | "bunny-white"
  | "duckling-yellow"
  | "hamster-golden"
  | "puppy-shiba"
  | "hedgehog-brown"
  | "frog-green"
  | "piglet-pink"
  | "turtle-green"
  | "fox-red";

/** The sheet's rows, in order. */
export type PetAnim = "idle" | "walk" | "happy" | "sleep";
export type Facing = "right" | "left";

export const PET_ROWS = 5;

/** The row for an animation: only walking has a side to face. */
export const petRow = (anim: PetAnim, facing: Facing) =>
  anim === "walk"
    ? facing === "right"
      ? 1
      : 2
    : { idle: 0, happy: 3, sleep: 4 }[anim];

export const PET_FRAME = 64;
export const PET_FPS = 12;

export interface PetMeta {
  id: PetId;
  name: string;
  unlock: Unlock;
  /** Frames in each animation (both walking directions have the same). */
  frames: Record<PetAnim, number>;
  /** Its walk cycle is drawn last frame to first: the eight-frame walkers. */
  walkReversed?: boolean;
  /**
   * The idle, as a route through its eight frames, from the rest pose and
   * back to it. The sheet's own order jumps between poses (the front, a
   * glance one way, a glance the other), which at half speed reads as
   * snapping; each route steps only between frames that are close, chosen
   * by measuring how many pixels change between every pair, and leaves out
   * any frame it can only reach by a jump.
   */
  idle: number[];
}

const frames = (walk: number, happy: number): Record<PetAnim, number> => ({
  idle: 8,
  walk,
  happy,
  sleep: 12,
});

/** The furry three share a shape: a blink, a glance one way, the other. */
const GLANCES = [0, 1, 0, 2, 4, 3, 4, 2, 0, 6, 5, 6, 7, 6, 0];

export const PETS: PetMeta[] = [
  {
    id: "cat-orange",
    name: "cat",
    unlock: { level: 6 },
    frames: frames(6, 6),
    idle: GLANCES,
  },
  {
    id: "bunny-white",
    name: "bunny",
    unlock: { level: 12 },
    frames: frames(6, 8),
    idle: [0, 4, 3, 1, 2, 1, 3, 4, 0, 7, 5, 6, 5, 7, 0],
  },
  {
    id: "duckling-yellow",
    name: "duckling",
    unlock: { level: 18 },
    frames: frames(8, 8),
    walkReversed: true,
    idle: [0, 4, 2, 3, 2, 1, 2, 4, 0, 6, 5, 6, 7, 6, 0],
  },
  {
    id: "hamster-golden",
    name: "hamster",
    unlock: { level: 24 },
    frames: frames(6, 8),
    idle: [0, 2, 1, 2, 0, 6, 5, 6, 7, 3, 4, 3, 7, 6, 0],
  },
  {
    id: "puppy-shiba",
    name: "shiba",
    unlock: { level: 30 },
    frames: frames(6, 6),
    idle: GLANCES,
  },
  // Its quill twitches only jump, so it just shifts and settles.
  {
    id: "hedgehog-brown",
    name: "hedgehog",
    unlock: { level: 40 },
    frames: frames(6, 8),
    idle: [0, 4, 0, 6, 0, 2, 0],
  },
  {
    id: "frog-green",
    name: "frog",
    unlock: { level: 50 },
    frames: frames(8, 8),
    walkReversed: true,
    idle: [0, 4, 2, 3, 2, 4, 1, 4, 0, 6, 5, 6, 7, 6, 0],
  },
  {
    id: "piglet-pink",
    name: "piglet",
    unlock: { level: 60 },
    frames: frames(6, 8),
    idle: [0, 4, 3, 1, 2, 1, 3, 4, 7, 5, 7, 6, 7, 4, 0],
  },
  // Its look upward is a jump from every other frame, so it's left out.
  {
    id: "turtle-green",
    name: "turtle",
    unlock: { level: 70 },
    frames: frames(8, 8),
    walkReversed: true,
    idle: [0, 4, 1, 2, 3, 2, 1, 4, 0],
  },
  {
    id: "fox-red",
    name: "fox",
    unlock: { level: 80 },
    frames: frames(6, 6),
    idle: GLANCES,
  },
];

export const isPetId = (v: unknown): v is PetId => PETS.some((p) => p.id === v);
export const getPet = (id: PetId) => PETS.find((p) => p.id === id)!;
export const petSheet = (id: PetId) => `/home/pets/${id}.png`;

/** Away this long (tab hidden, window unfocused, or closed) and it sleeps. */
export const PET_SLEEP_AFTER_MS = 5 * 60_000;
/** Back this long before it wakes. */
export const PET_WAKE_AFTER_MS = 60_000;
