/**
 * The season skill tree, bought with seeds.
 *
 * Three branches of five, one per way of playing: roots for the idle garden,
 * rain for catching, hearth for the real work (tasks, focus, time away).
 * Each branch opens on a five-rank skill; two skills hang off it, one more
 * off the first of those, and a capstone needs both sides. Early ranks are
 * cheap so the first season's seeds buy something that shows straight away;
 * capstones are a few seasons out.
 *
 * Kept free of garden state so garden.ts can read it without an import cycle.
 */

export type SkillId =
  | "roots"
  | "headstart"
  | "perennials"
  | "compost"
  | "oldgrowth"
  | "hands"
  | "downpour"
  | "lucky"
  | "puddles"
  | "monsoon"
  | "habits"
  | "nightowl"
  | "bookworm"
  | "toolshed"
  | "evergreen";

export type BranchId = "roots" | "rain" | "hearth";

export interface SkillDef {
  id: SkillId;
  branch: BranchId;
  name: string;
  /** Seeds for each rank, so its length is the number of ranks. */
  costs: number[];
  /** Skills (and the rank of each) needed before the first rank. */
  needs: Partial<Record<SkillId, number>>;
  /** What it does at a given rank, for the detail panel. */
  effect: (rank: number) => string;
  /** Where it sits in its branch: column 0 or 1 (0.5 is centred), row 0–3. */
  at: [col: number, row: number];
}

export const BRANCHES: { id: BranchId; name: string }[] = [
  { id: "roots", name: "roots" },
  { id: "rain", name: "rain" },
  { id: "hearth", name: "hearth" },
];

const RAMP = [1, 2, 3, 4, 5];

export const SKILLS: SkillDef[] = [
  // Roots: the idle garden.
  {
    id: "roots",
    branch: "roots",
    name: "Deep roots",
    costs: RAMP,
    needs: {},
    effect: (r) => `+${10 * r}% plant output`,
    at: [0.5, 0],
  },
  {
    id: "headstart",
    branch: "roots",
    name: "Seed tray",
    costs: [3],
    needs: { roots: 1 },
    effect: () => "each season starts with 10 moss and 5 ferns",
    at: [0, 1],
  },
  {
    id: "perennials",
    branch: "roots",
    name: "Perennials",
    costs: [5],
    needs: { roots: 3 },
    effect: () => "keep a tenth of every plant when a season ends",
    at: [1, 1],
  },
  {
    id: "compost",
    branch: "roots",
    name: "Compost",
    costs: [4, 4, 4],
    needs: { headstart: 1 },
    effect: (r) => `plants cost ${4 * r}% less`,
    at: [0, 2],
  },
  {
    id: "oldgrowth",
    branch: "roots",
    name: "Old growth",
    costs: [15],
    needs: { compost: 1, perennials: 1 },
    effect: () => "every 10 copies of a plant adds ×3, not ×2",
    at: [0.5, 3],
  },

  // Rain: catching.
  {
    id: "hands",
    branch: "rain",
    name: "Cupped hands",
    costs: RAMP,
    needs: {},
    effect: (r) => `catches worth ${15 * r}% more`,
    at: [0.5, 0],
  },
  {
    id: "downpour",
    branch: "rain",
    name: "Downpour",
    costs: [3, 3, 3],
    needs: { hands: 1 },
    effect: (r) => `${Math.round((1 / 0.93 ** r - 1) * 100)}% more rain`,
    at: [0, 1],
  },
  {
    id: "lucky",
    branch: "rain",
    name: "Magpie",
    costs: [4, 4, 4],
    needs: { hands: 3 },
    effect: (r) => `+${r}% golden chance, golden drops worth ${25 * r}% more`,
    at: [1, 1],
  },
  {
    id: "puddles",
    branch: "rain",
    name: "Puddles",
    costs: [6],
    needs: { downpour: 1 },
    effect: () => "missed drops give 10% more of a catch",
    at: [0, 2],
  },
  {
    id: "monsoon",
    branch: "rain",
    name: "Monsoon",
    costs: [15],
    needs: { puddles: 1, lucky: 1 },
    effect: () => "a caught golden drop brings a shower of five more",
    at: [0.5, 3],
  },

  // Hearth: tasks, focus and time away.
  {
    id: "habits",
    branch: "hearth",
    name: "Good habits",
    costs: RAMP,
    needs: {},
    effect: (r) => `+${20 * r}% drops from tasks, focus, breaks and games`,
    at: [0.5, 0],
  },
  {
    id: "nightowl",
    branch: "hearth",
    name: "Night owl",
    costs: [3, 3, 3],
    needs: { habits: 1 },
    effect: (r) => `+${5 * r}% speed and +${4 * r}h while away`,
    at: [0, 1],
  },
  {
    id: "bookworm",
    branch: "hearth",
    name: "Bookworm",
    costs: [5, 5],
    needs: { habits: 3 },
    effect: (r) => `+${15 * r}% xp from tasks and focus`,
    at: [1, 1],
  },
  {
    id: "toolshed",
    branch: "hearth",
    name: "Tool shed",
    costs: [6],
    needs: { nightowl: 1 },
    effect: () => "keep a third of every upgrade when a season ends",
    at: [0, 2],
  },
  {
    id: "evergreen",
    branch: "hearth",
    name: "Evergreen",
    costs: [15],
    needs: { toolshed: 1, bookworm: 1 },
    effect: () => "+1% to all drops per garden level, up to +100%",
    at: [0.5, 3],
  },
];

export const getSkill = (id: SkillId) => SKILLS.find((s) => s.id === id)!;
