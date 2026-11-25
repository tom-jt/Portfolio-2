/**
 * Cached reads for the public pages. Each hobby's data carries the tag
 * `hobby:<id>`; a save calls updateTag on it, so the next view reads fresh
 * data while every other view is served from cache. Server only.
 */

import { unstable_cache } from "next/cache";
import type { HobbyId } from "@/data/hobby/hobbies";
import { emptyDoc, publicDoc, type HobbyDoc } from "./model";
import { readStored } from "./storage";

export const hobbyTag = (hobby: HobbyId) => `hobby:${hobby}`;

export async function getHobbyDoc(hobby: HobbyId): Promise<HobbyDoc> {
  try {
    return await unstable_cache(
      async () => publicDoc((await readStored(hobby)).doc),
      ["hobby-doc", hobby],
      { tags: [hobbyTag(hobby)] },
    )();
  } catch (e) {
    // A storage outage shows an empty tab rather than an error page. The
    // failure is not cached, so the next view tries storage again.
    console.error(`[hobby] read failed for ${hobby}`, e);
    return emptyDoc(hobby);
  }
}
