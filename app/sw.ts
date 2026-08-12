import type { PrecacheEntry, SerwistGlobalConfig } from "serwist"
import { CacheFirst, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist"

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

// @ts-expect-error — SW global scope
const sw = self as unknown as WorkerGlobalScope

const serwist = new Serwist({
  precacheEntries: sw.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.origin === "https://fonts.googleapis.com",
      handler: new StaleWhileRevalidate({
        cacheName: "google-fonts-stylesheets",
      }),
    },
    {
      matcher: ({ url }) => url.origin === "https://fonts.gstatic.com",
      handler: new CacheFirst({
        cacheName: "google-fonts-webfonts",
        plugins: [],
      }),
    },
    {
      matcher: ({ url }) =>
        url.origin === "https://ccqhglbmdqtnacgobidw.supabase.co" &&
        url.pathname.startsWith("/storage"),
      handler: new CacheFirst({
        cacheName: "supabase-storage",
        plugins: [],
      }),
    },
    {
      matcher: ({ request }) => request.destination === "document",
      handler: new NetworkFirst({
        cacheName: "pages",
        plugins: [],
      }),
    },
  ],
  fallbacks: {
    entries: [
      { url: "/offline", matcher: ({ request }) => request.destination === "document" },
    ],
  },
})

serwist.addEventListeners()
