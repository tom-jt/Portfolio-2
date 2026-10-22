import gamesData from "@/data/home/games.json";

/**
 * Web games featured in the /home arcade, edited in games.json.
 *
 * To ship a game, give it a `url` that can be framed (an itch.io embed URL,
 * a Vercel deploy, a page under /public…), an optional `thumbnail` under
 * /public/images, and set `status` to "live". `aspect` is the iframe's
 * shape, as a CSS aspect-ratio such as "16/9" or "4/3".
 */
export type ArcadeGame = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  url: string;
  thumbnail: string;
  accent: string;
  aspect: string;
  status: "live" | "soon";
};

export const games: ArcadeGame[] = (gamesData.games || []).map((g) => ({
  id: g.id,
  title: g.title,
  tagline: g.tagline ?? "",
  description: g.description ?? "",
  url: g.url ?? "",
  thumbnail: (g.thumbnail || "").replace(/^public\//, "/"),
  accent: g.accent || "#7fc8dc",
  aspect: g.aspect || "16/9",
  // A game without a URL cannot be played, whatever its status says.
  status: g.status === "live" && g.url ? "live" : "soon",
}));

export const liveGames = games.filter((g) => g.status === "live");
