const SPOTIFY_LINK =
  /^(?:https?:\/\/open\.spotify\.com\/(?:intl-[a-z-]+\/)?(?:embed\/)?|spotify:)(playlist|album|track|artist|show|episode)[/:]([A-Za-z0-9]{22})/;

/**
 * Turns any open.spotify.com link (or spotify: URI) into its embed URL, or
 * null if it isn't one. Only Spotify's own embed host is ever framed, so a
 * pasted link can't point the iframe anywhere else.
 */
export function spotifyEmbedUrl(link: string) {
  const match = link.trim().match(SPOTIFY_LINK);
  if (!match) return null;
  const [, type, id] = match;
  return `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;
}
