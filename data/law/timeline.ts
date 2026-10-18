import timelineData from "@/data/law/timeline.json";

export type LawMilestone = {
  id: string;
  period: string;
  role: string;
  org: string;
  body: string;
  tags: string[];
};

/**
 * Currently placeholder content — see the `_comment` field in timeline.json.
 * Nothing here is real experience.
 */
// The JSON's inferred type only has `tags` if some entry sets it.
const entries: (Omit<LawMilestone, "tags"> & { tags?: string[] })[] =
  timelineData.entries;

export const milestones: LawMilestone[] = entries.map((e) => ({
  id: e.id,
  period: e.period,
  role: e.role,
  org: e.org,
  body: e.body,
  tags: e.tags ?? [],
}));
