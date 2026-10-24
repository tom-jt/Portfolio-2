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
  | "evergreen"
  // The rainy side.
  | "stormfront"
  | "wetseason"
  | "deeppuddles"
  | "rainbow"
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
  | "sunlitseeds"
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
    effect: () => "a caught golden drop brings a fleeting drizzle",
    at: [0.5, 3],
  },

  // Hearth: tasks, focus and time away.
  {
    id: "habits",
    branch: "hearth",
    name: "Good habits",
    costs: RAMP,
    needs: {},
    effect: (r) => `+${20 * r}% drops from tasks, focus, breaks, and games`,
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

// The rainy side: where rain and roots meet.
SKILLS.push(
  {
    id: "stormfront",
    branch: "rainy",
    name: "Storm front",
    costs: [10, 15, 20],
    needs: { monsoon: 1, oldgrowth: 1 },
    effect: (r) => `${Math.round((1 / 0.91 ** r - 1) * 100)}% more rain`,
    at: [0.5, 0],
  },
  {
    id: "wetseason",
    branch: "rainy",
    name: "Wet season",
    costs: [15, 20, 30, 40],
    needs: { stormfront: 1 },
    effect: (r) => `catches worth ${10 * r}% more`,
    at: [0, 1],
  },
  {
    id: "deeppuddles",
    branch: "rainy",
    name: "Deep puddles",
    costs: [20, 30, 40],
    needs: { stormfront: 2 },
    effect: (r) => `missed drops give ${5 * r}% more of a catch`,
    at: [1, 1],
  },
  {
    id: "rainbow",
    branch: "rainy",
    name: "Rainbow shower",
    costs: [60],
    needs: { wetseason: 2 },
    effect: () =>
      "now and then a rainbow drop falls: catch it and every catch is worth ×3 for 20s",
    at: [0, 2],
  },
  {
    id: "thunderclap",
    branch: "rainy",
    name: "Thunderclap",
    costs: [70],
    needs: { deeppuddles: 1 },
    effect: () =>
      "a quarter of golden catches strike lightning, catching every drop on the window",
    at: [1, 2],
  },
  {
    id: "meteors",
    branch: "rainy",
    name: "Meteor night",
    costs: [100],
    needs: { rainbow: 1, thunderclap: 1 },
    effect: () =>
      "meteor showers cross the window, more often at night; each meteor is worth three golden drops",
    at: [0, 3],
  },
  {
    id: "cloudburst",
    branch: "rainy",
    name: "Cloudburst",
    costs: [30, 45, 60],
    needs: { thunderclap: 1 },
    effect: (r) => `room for ${2 * r} more drops on the window at once`,
    at: [1, 3],
  },
  {
    id: "torrent",
    branch: "rainy",
    name: "Torrent",
    costs: [200],
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
    costs: [10, 15, 20],
    needs: { evergreen: 1, oldgrowth: 1 },
    effect: (r) => `+${15 * r}% plant output`,
    at: [0.5, 0],
  },
  {
    id: "longdays",
    branch: "sunny",
    name: "Long days",
    costs: [15, 20, 30],
    needs: { morningsun: 1 },
    effect: (r) => `ladybug luck lasts ${5 + 2.5 * r} minutes`,
    at: [0, 1],
  },
  {
    id: "haymaking",
    branch: "sunny",
    name: "Make hay",
    costs: [15, 20, 30, 40],
    needs: { morningsun: 2 },
    effect: (r) => `+${25 * r}% drops from tasks and focus`,
    at: [1, 1],
  },
  {
    id: "goldenhour",
    branch: "sunny",
    name: "Golden hour",
    costs: [60],
    needs: { longdays: 2 },
    effect: () =>
      "now and then the light turns gold, and for 45s every drop that falls is golden",
    at: [0, 2],
  },
  {
    id: "warmsoil",
    branch: "sunny",
    name: "Sun-warmed soil",
    costs: [20, 30, 40],
    needs: { haymaking: 1 },
    effect: (r) => `+${10 * r}% speed and +${6 * r}h while away`,
    at: [1, 2],
  },
  {
    id: "secondbloom",
    branch: "sunny",
    name: "Second bloom",
    costs: [70],
    needs: { goldenhour: 1, warmsoil: 1 },
    effect: () => "every plant milestone reached adds +1% to all plant output",
    at: [0, 3],
  },
  {
    id: "sunlitseeds",
    branch: "sunny",
    name: "Sunlit seeds",
    costs: [30, 45, 60],
    needs: { warmsoil: 2 },
    effect: (r) => `harvests give ${15 * r}% more seeds`,
    at: [1, 3],
  },
  {
    id: "solstice",
    branch: "sunny",
    name: "Solstice",
    costs: [200],
    needs: { secondbloom: 1, sunlitseeds: 3 },
    effect: () => "plant output ×1.5, and golden hour comes twice as often",
    at: [0.5, 4],
  },
);

export const getSkill = (id: SkillId) => SKILLS.find((s) => s.id === id)!;

/** Seeds to learn every skill, for the tab's progress line. */
export const TREE_COST = SKILLS.reduce(
  (sum, k) => sum + k.costs.reduce((a, b) => a + b, 0),
  0,
);
