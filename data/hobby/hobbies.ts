/**
 * The hobbies, one tab each. Their identity lives here in code; their cards,
 * tags, and extra fields live in storage and are edited on the site.
 *
 * Accent colours are not here: they are CSS variables under
 * [data-hobby="…"] in globals.css, so each theme can carry its own shade.
 */

export type HobbyId = "magic" | "ice" | "balisong" | "piano";

export interface Hobby {
  id: HobbyId;
  name: string;
  /** One or two sentences under the title. */
  blurb: string;
  /** Handwritten aside beside the doodle. */
  quip: string;
  /** Path data for the large outline mark: the background watermark and
   *  the placeholder on cards without a thumbnail. 24×24 viewBox. */
  mark: string;
  /** Extra fields a new tab starts with. Editable on the site afterwards. */
  startingFields: string[];
}

export const HOBBIES: Hobby[] = [
  {
    id: "magic",
    name: "Magic",
    blurb: "Learnèd master at 52-card pickup.",
    quip: "pick a card!",
    mark: "M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z",
    startingFields: ["Difficulty", "Source", "Notes"],
  },
  {
    id: "ice",
    name: "Ice skating",
    blurb: "Sequences, spins, and jumps I am falling at.",
    quip: "don't look down…",
    mark: "M12 2v20M3.4 7l17.2 10M20.6 7L3.4 17M9 4l3 2 3-2M9 20l3-2 3 2",
    startingFields: ["Level", "Rink", "Notes"],
  },
  {
    id: "balisong",
    name: "Balisong",
    blurb: "Openings, rollovers, and aerials that land on the floor.",
    quip: "even blunt ones hurt",
    mark: "M12 6v13M12 9C9.5 4.5 4 4.2 4 8.2c0 3.6 4.2 4.6 8 2.6M12 9c2.5-4.5 8-4.8 8-.8 0 3.6-4.2 4.6-8 2.6M12 13c-3-.4-6.6 1.6-5.6 4.6.8 2.2 4.2.6 5.6-2M12 13c3-.4 6.6 1.6 5.6 4.6-.8 2.2-4.2.6-5.6-2",
    startingFields: ["Difficulty", "Trainer", "Notes"],
  },
  {
    id: "piano",
    name: "Piano",
    blurb: "Just playing what I love.",
    quip: "one more time slowly",
    mark: "M9 18V5l11-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zM20 16a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
    startingFields: ["Composer", "Level", "Notes"],
  },
];

export const DEFAULT_HOBBY = HOBBIES[0].id;

export const hobbyById = (id: string): Hobby | undefined =>
  HOBBIES.find((h) => h.id === id);
