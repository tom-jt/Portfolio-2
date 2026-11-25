import { redirect } from "next/navigation";
import { DEFAULT_HOBBY } from "@/data/hobby/hobbies";

/** /hobby opens on the first hobby's tab. */
export default function HobbyIndex() {
  redirect(`/hobby/${DEFAULT_HOBBY}`);
}
