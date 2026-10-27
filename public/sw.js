/*
 * The service worker for /home as an installed app: what makes it open
 * offline. It sits at the root only so it may claim /home (a worker's scope
 * can't be wider than its folder); it's registered for /home alone and
 * leaves the rest of the site be.
 *
 * Pages: network first, falling back to the last copy seen, so it's always
 * current when online. Next's build files are named by their contents, so
 * once fetched they're kept. The scenes, sounds and sprites are kept too,
 * and refreshed in the background. Anything else goes to the network as
 * normal.
 *
 * Bump VERSION to throw away everything cached.
 */

const VERSION = "v1";
const PAGES = `home-pages-${VERSION}`;
const ASSETS = `home-assets-${VERSION}`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) => cache.add("/home"))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("home-") && ![PAGES, ASSETS].includes(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

/** The network's copy, kept for next time; else the last one kept. */
async function networkFirst(request, fallback) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put(fallback ?? request, response.clone());
    return response;
  } catch (error) {
    const kept = (await cache.match(request)) ?? (fallback && (await cache.match(fallback)));
    if (kept) return kept;
    throw error;
  }
}

/** The kept copy if there is one, fetching and keeping it if not. With
 *  `refresh`, the kept copy is also updated in the background. */
async function cacheFirst(event, refresh) {
  const cache = await caches.open(ASSETS);
  const kept = await cache.match(event.request);
  const fresh = fetch(event.request).then((response) => {
    // Whole files only: a partial (ranged) response can't be kept.
    if (response.ok && response.status === 200) cache.put(event.request, response.clone());
    return response;
  });
  if (kept) {
    if (refresh) event.waitUntil(fresh.catch(() => {}));
    return kept;
  }
  return fresh;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    if (url.pathname === "/home" || url.pathname.startsWith("/home/")) {
      event.respondWith(networkFirst(request, "/home"));
    }
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event, false));
    return;
  }
  // Audio is fetched with ranges by some browsers; leave those to the network.
  if (request.headers.has("range")) return;
  if (/^\/home\/(scenes|sounds|pets|icons)\//.test(url.pathname)) {
    event.respondWith(cacheFirst(event, true));
  }
});
