/**
 * RootWork LOS Service Worker — offline-first caching (Phase 1)
 *
 * Strategy:
 *   - Static assets (JS, CSS, fonts, images): cache-first
 *   - API routes (/api/*): network-first, no cache
 *   - Clerk authentication endpoints: network-only, never cached
 *   - All other routes (Next.js pages): stale-while-revalidate
 */

const CACHE_VERSION = "rwfw-los-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const NEVER_CACHE = [
  "clerk.accounts.dev",
  "clerk.com",
  "/sign-in",
  "/sign-up",
  "/api/",
];

function shouldSkip(url) {
  return NEVER_CACHE.some((pattern) => url.includes(pattern));
}

function isStaticAsset(url) {
  return (
    url.includes("/_next/static/") ||
    url.includes("/fonts/") ||
    /\.(woff2?|ttf|otf|png|jpg|jpeg|gif|svg|ico|webp)$/.test(url)
  );
}

// Install: pre-cache the offline shell page if available
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      // Minimal pre-cache — just the root to support offline shell
      return cache.addAll(["/"]).catch(() => {
        // If pre-caching fails (dev mode, etc.), continue silently
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith("rwfw-los-") && key !== STATIC_CACHE && key !== PAGE_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: apply strategy based on request type
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== "GET") return;

  // Skip Clerk and API routes entirely
  if (shouldSkip(url)) return;

  if (isStaticAsset(url)) {
    // Cache-first for static assets
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // Stale-while-revalidate for page routes
  event.respondWith(
    caches.open(PAGE_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response.ok) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);

      return cached ?? networkFetch;
    })
  );
});
