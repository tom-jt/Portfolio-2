/**
 * Fetches a Google font as an ArrayBuffer for Satori (next/og).
 *
 * Two things matter here. The `text` parameter subsets the file to just the
 * glyphs used, keeping the download small. And the User-Agent must be one
 * that predates woff2 — with a modern UA Google returns woff2, which Satori
 * cannot parse.
 *
 * Returns null on any failure so OG generation degrades to Satori's default
 * font rather than failing the build.
 */
export async function loadGoogleFont(
  family: string,
  weight: number,
  text: string,
): Promise<ArrayBuffer | null> {
  try {
    const api = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
      family,
    )}:wght@${weight}&text=${encodeURIComponent(text)}`;

    const css = await fetch(api, {
      headers: { "User-Agent": "Mozilla/5.0" },
    }).then((r) => (r.ok ? r.text() : ""));

    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1];
    if (!url) return null;

    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}
