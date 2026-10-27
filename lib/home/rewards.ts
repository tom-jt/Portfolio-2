/**
 * What each garden level opens, from the same lists the game unlocks by:
 * scenes, colours, titles, pots, frames, window decor, plants, upgrades, and
 * pets. One list for the level timeline, the level-up toast, and the "next"
 * line under the xp bar, so they never disagree.
 *
 * Built on first use rather than when loaded: garden.ts imports this for its
 * toast, and this imports the garden's plants and upgrades back.
 */

import { DECOR, FRAMES, GOLD_LEAF, POTS } from "./cosmetics";
import { PLANTS, titleFor, UPGRADES } from "./garden";
import { PETS } from "./pets";
import { SCENES } from "./scenes";
import { THEMES } from "./themes";

/** The headings, in the order each level lists them. */
export const REWARD_KINDS = [
  "cosmetics",
  "garden decor",
  "plants",
  "upgrades",
  "pets",
] as const;
export type RewardKind = (typeof REWARD_KINDS)[number];

export interface LevelRewards {
  level: number;
  groups: (readonly [RewardKind, string[]])[];
}

let cache: LevelRewards[] | null = null;

/** Every level that opens something, in order, its rewards grouped. */
export function levelRewards(): LevelRewards[] {
  if (cache) return cache;
  const byLevel = new Map<number, Map<RewardKind, string[]>>();
  const add = (level: number | undefined, kind: RewardKind, item: string) => {
    if (!level || level < 2) return;
    const kinds = byLevel.get(level) ?? new Map<RewardKind, string[]>();
    kinds.set(kind, [...(kinds.get(kind) ?? []), item]);
    byLevel.set(level, kinds);
  };
  for (const s of SCENES) add(s.unlockLevel, "cosmetics", `${s.name} scene`);
  for (const t of THEMES)
    add(t.unlock?.level, "cosmetics", `${t.name} colours`);
  for (let l = 10; l <= 100; l += 10)
    add(l, "cosmetics", `the title "${titleFor(l)}"`);
  for (const d of DECOR)
    add(d.unlock?.level, "garden decor", `${d.name} window`);
  for (const f of FRAMES)
    add(f.unlock?.level, "garden decor", `${f.name} frame`);
  for (const p of POTS) add(p.unlock?.level, "garden decor", `${p.name} pot`);
  add(GOLD_LEAF.level, "garden decor", "gilded plants");
  for (const p of PLANTS) add(p.unlockLevel, "plants", p.name);
  for (const u of UPGRADES) add(u.unlockLevel, "upgrades", u.name);
  for (const p of PETS) add(p.unlock.level, "pets", `a ${p.name}`);
  cache = [...byLevel.entries()]
    .sort(([a], [b]) => a - b)
    .map(([level, kinds]) => ({
      level,
      groups: REWARD_KINDS.filter((k) => kinds.has(k)).map(
        (k) => [k, kinds.get(k)!] as const,
      ),
    }));
  return cache;
}

/** Everything a level opens, as one list. */
export const rewardsAt = (level: number) =>
  (levelRewards().find((r) => r.level === level)?.groups ?? []).flatMap(
    ([, items]) => items,
  );

/** The next level after `level` that opens anything, and what it opens. */
export function nextRewards(level: number) {
  const next = levelRewards().find((r) => r.level > level);
  return next ? { level: next.level, items: rewardsAt(next.level) } : null;
}
