/**
 * The season skill tree, bought with seeds.
 *
 * Three branches of five, one per way of playing: roots for the idle garden,
 * rain for catching, hearth for the real work (tasks, focus, time away).
 * Each branch opens on a fifteen-rank skill; two skills hang off it, one more
 * off the first of those, and a capstone needs both sides. Early ranks are
 * cheap so the first season's seeds buy something that shows straight away;
 * capstones are a few seasons out. The skills that stack run to many ranks,
 * the first few cheap and each after dearer than the last, so every harvest
 * buys something that shows, and filling the tree takes fifteen seasons or
 * so.
 *
 * A skill needs about half of its parent's ranks: the first child of a
 * parent half of them, rounded down, and a second child one more. A parent
 * with a single rank needs just that one. The needs only stand in the way of
 * a skill's first rank, so ranks a save already has, from before the needs
 * rose, stay learnt and can still be added to.
 *
 * Further down the three become two: the rainy side, opened by the rain and
 * roots capstones, and the sunny side, opened by the hearth and roots ones.
 * Each forks and joins again rather than running in a line, mixes plain
 * percentage upgrades with ones that change how the garden plays, and costs
 * far more, for the much bigger harvests of later seasons. A side stays out
 * of sight until its first skill can be bought.
 *
 * Kept free of garden state so garden.ts can read it without an import cycle.
 */

export type SkillId =
  | "roots"
  | "headstart"
  | "perennials"
  | "bonemeal"
  | "oldgrowth"
  | "hands"
  | "downpour"
  | "lucky"
  | "puddles"
  | "swipe"
  | "habits"
  | "nightowl"
  | "bookworm"
  | "toolshed"
  | "evergreen"
  // The rainy side.
  | "stormfront"
  | "wetseason"
  | "deeppuddles"
  | "monsoon"
  | "thunderclap"
  | "meteors"
  | "cloudburst"
  | "torrent"
  // The sunny side.
  | "morningsun"
  | "longdays"
  | "haymaking"
  | "goldenhour"
  | "warmsoil"
  | "secondbloom"
  | "rainbow"
  | "solstice";

export type BranchId = "roots" | "rain" | "hearth" | "rainy" | "sunny";

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
  /** Where it sits in its branch: column 0 or 1 (0.5 is centred), and row. */
  at: [col: number, row: number];
}

export const BRANCHES: { id: BranchId; name: string; side?: boolean }[] = [
  { id: "roots", name: "roots" },
  { id: "rain", name: "rain" },
  { id: "hearth", name: "hearth" },
  { id: "rainy", name: "the rainy side", side: true },
  { id: "sunny", name: "the sunny side", side: true },
];

/** Costs for `ranks` ranks: `first`, then each `growth` times the last. */
const ramp = (first: number, growth: number, ranks: number) =>
  Array.from({ length: ranks }, (_, i) =>
    Math.max(1, Math.round(first * growth ** i)),
  );

/** The three opening skills: fifteen ranks, the first ones a seed or two. */
const OPENER = ramp(1, 1.35, 15);

/** Kinds of plant in the garden, one Bone meal rank each. PLANTS lives in
 *  garden.ts, which imports this file, so it is counted here by hand. */
const PLANT_KINDS = 13;

export const SKILLS: SkillDef[] = [
  // Roots: the idle garden.
  {
    id: "roots",
    branch: "roots",
    name: "Deep roots",
    costs: OPENER,
    needs: {},
    effect: (r) => `+${10 * r}% plant output`,
    at: [0.5, 0],
  },
  {
    id: "headstart",
    branch: "roots",
    name: "Seed tray",
    costs: [2],
    needs: { roots: 7 },
    effect: () => "each season starts with 10 moss and 5 ferns",
    at: [0, 1],
  },
  {
    id: "perennials",
    branch: "roots",
    name: "Perennials",
    costs: [4],
    needs: { roots: 8 },
    effect: () => "keep a tenth of every plant when a season ends",
    at: [1, 1],
  },
  {
    id: "bonemeal",
    branch: "roots",
    name: "Bone meal",
    costs: ramp(3, 1.6, PLANT_KINDS),
    needs: { headstart: 1 },
    effect: (r) =>
      `${r === 1 ? "the first plant" : `the first ${r} plants`} on the list grow +100× for every 100 copies`,
    at: [0, 2],
  },
  {
    id: "oldgrowth",
    branch: "roots",
    name: "Old growth",
    costs: [12],
    needs: { bonemeal: 6, perennials: 1 },
    effect: () => "every plant milestone leaps a tenth higher: ×2.2, not ×2",
    at: [0.5, 3],
  },

  // Rain: catching.
  {
    id: "hands",
    branch: "rain",
    name: "Cupped hands",
    costs: OPENER,
    needs: {},
    effect: (r) => `catches worth ${15 * r}% more`,
    at: [0.5, 0],
  },
  {
    id: "downpour",
    branch: "rain",
    name: "Downpour",
    costs: ramp(2, 1.5, 6),
    needs: { hands: 7 },
    effect: (r) => `${Math.round((1 / 0.93 ** r - 1) * 100)}% more rain`,
    at: [0, 1],
  },
  {
    id: "lucky",
    branch: "rain",
    name: "Magpie",
    costs: ramp(3, 1.45, 8),
    needs: { hands: 8 },
    effect: (r) => `+${r}% golden chance, golden drops worth ${25 * r}% more`,
    at: [1, 1],
  },
  {
    id: "puddles",
    branch: "rain",
    name: "Puddles",
    costs: [5],
    needs: { downpour: 3 },
    effect: () => "missed drops give 10% more of a catch",
    at: [0, 2],
  },
  {
    id: "swipe",
    branch: "rain",
    name: "Sweeping hands",
    costs: [12],
    needs: { puddles: 1, lucky: 4 },
    effect: () => "drag across the window to catch every drop you pass through",
    at: [0.5, 3],
  },

  // Hearth: tasks, focus and time away.
  {
    id: "habits",
    branch: "hearth",
    name: "Good habits",
    costs: OPENER,
    needs: {},
    effect: (r) => `+${20 * r}% drops from tasks, focus, breaks, and games`,
    at: [0.5, 0],
  },
  {
    id: "nightowl",
    branch: "hearth",
    name: "Night owl",
    costs: ramp(2, 1.5, 6),
    needs: { habits: 7 },
    effect: (r) => `+${5 * r}% speed and +${4 * r}h while away`,
    at: [0, 1],
  },
  {
    id: "bookworm",
    branch: "hearth",
    name: "Bookworm",
    costs: ramp(3, 1.5, 6),
    needs: { habits: 8 },
    effect: (r) => `+${15 * r}% xp from tasks and focus`,
    at: [1, 1],
  },
  {
    id: "toolshed",
    branch: "hearth",
    name: "Tool shed",
    costs: [5],
    needs: { nightowl: 3 },
    effect: () => "keep a third of every upgrade when a season ends",
    at: [0, 2],
  },
  {
    id: "evergreen",
    branch: "hearth",
    name: "Evergreen",
    costs: [12],
    needs: { toolshed: 1, bookworm: 3 },
    effect: () => "+1% to all drops per garden level, up to +100%",
    at: [0.5, 3],
  },
];

// The rainy side: where rain and roots meet.
SKILLS.push(
  {
    id: "stormfront",
    branch: "rainy",
    name: "Storm front",
    costs: ramp(8, 1.5, 6),
    needs: { swipe: 1, oldgrowth: 1 },
    effect: (r) => `${Math.round((1 / 0.91 ** r - 1) * 100)}% more rain`,
    at: [0.5, 0],
  },
  {
    id: "wetseason",
    branch: "rainy",
    name: "Wet season",
    costs: ramp(8, 1.35, 10),
    needs: { stormfront: 3 },
    effect: (r) => `catches worth ${10 * r}% more`,
    at: [0, 1],
  },
  {
    id: "deeppuddles",
    branch: "rainy",
    name: "Deep puddles",
    costs: ramp(15, 1.5, 5),
    needs: { stormfront: 4 },
    effect: (r) => `missed drops give ${5 * r}% more of a catch`,
    at: [1, 1],
  },
  {
    id: "monsoon",
    branch: "rainy",
    name: "Monsoon",
    costs: [50],
    needs: { wetseason: 5 },
    effect: () => "a caught golden drop brings a fleeting drizzle",
    at: [0, 2],
  },
  {
    id: "thunderclap",
    branch: "rainy",
    name: "Thunderclap",
    costs: [60],
    needs: { deeppuddles: 2 },
    effect: () =>
      "a quarter of golden catches strike lightning, catching every drop on the window",
    at: [1, 2],
  },
  {
    id: "meteors",
    branch: "rainy",
    name: "Meteor night",
    costs: [90],
    needs: { monsoon: 1, thunderclap: 1 },
    effect: () =>
      "meteor showers cross the window, more often at night; each meteor is worth three golden drops",
    at: [0, 3],
  },
  {
    id: "cloudburst",
    branch: "rainy",
    name: "Cloudburst",
    costs: ramp(20, 1.5, 6),
    needs: { thunderclap: 1 },
    effect: (r) => `room for ${2 * r} more drops on the window at once`,
    at: [1, 3],
  },
  {
    id: "torrent",
    branch: "rainy",
    name: "Torrent",
    costs: [180],
    needs: { meteors: 1, cloudburst: 3 },
    effect: () => "every catch also catches the drop nearest to it",
    at: [0.5, 4],
  },
);

// The sunny side: where hearth and roots meet.
SKILLS.push(
  {
    id: "morningsun",
    branch: "sunny",
    name: "Morning sun",
    costs: ramp(8, 1.35, 10),
    needs: { evergreen: 1, oldgrowth: 1 },
    effect: (r) => `+${15 * r}% plant output`,
    at: [0.5, 0],
  },
  {
    id: "longdays",
    branch: "sunny",
    name: "Long days",
    costs: ramp(10, 1.5, 6),
    needs: { morningsun: 5 },
    effect: (r) => `ladybug luck lasts ${5 + 2.5 * r} minutes`,
    at: [0, 1],
  },
  {
    id: "haymaking",
    branch: "sunny",
    name: "Make hay",
    costs: ramp(8, 1.35, 10),
    needs: { morningsun: 6 },
    effect: (r) => `+${25 * r}% drops from tasks and focus`,
    at: [1, 1],
  },
  {
    id: "goldenhour",
    branch: "sunny",
    name: "Golden hour",
    costs: [50],
    needs: { longdays: 3 },
    effect: () =>
      "now and then the light turns gold, and for 45s every drop that falls is golden",
    at: [0, 2],
  },
  {
    id: "warmsoil",
    branch: "sunny",
    name: "Sun-warmed soil",
    costs: ramp(15, 1.5, 6),
    needs: { haymaking: 5 },
    effect: (r) => `+${10 * r}% speed and +${6 * r}h while away`,
    at: [1, 2],
  },
  {
    id: "secondbloom",
    branch: "sunny",
    name: "Second bloom",
    costs: [60],
    needs: { goldenhour: 1, warmsoil: 3 },
    effect: () => "every plant milestone reached adds +1% to all plant output",
    at: [0, 3],
  },
  // Sun and rain together make the rainbow.
  {
    id: "rainbow",
    branch: "sunny",
    name: "Rainbow shower",
    costs: [80],
    needs: { warmsoil: 4 },
    effect: () =>
      "now and then a rainbow drop falls: catch it and every catch is worth ×3 for 20s",
    at: [1, 3],
  },
  {
    id: "solstice",
    branch: "sunny",
    name: "Solstice",
    costs: [180],
    needs: { secondbloom: 1, rainbow: 1 },
    effect: () => "plant output ×1.5, and golden hour comes twice as often",
    at: [0.5, 4],
  },
);

export const getSkill = (id: SkillId) => SKILLS.find((s) => s.id === id)!;

/** Skills that have left the tree, and what their ranks cost, so old saves
 *  get their seeds back. */
export const RETIRED_SKILLS: Record<string, number[]> = {
  sunlitseeds: [30, 45, 60],
  compost: [3, 5, 7, 10, 15],
};

/** Seeds to learn every skill, for the tab's progress line. */
export const TREE_COST = SKILLS.reduce(
  (sum, k) => sum + k.costs.reduce((a, b) => a + b, 0),
  0,
);
