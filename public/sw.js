// Service Worker for ช่วยที.com PWA
const CACHE_NAME = 'chuaytee-pwa-v1'
const OFFLINE_URL = '/offline'

const ASSETS_TO_CACHE = [
  '/',
  '/offline',
  '/manifest.json',
  '/favicon.ico',
  '/icon.png',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    })
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name)
          }
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  // Only handle GET requests for same origin
  if (event.request.method !== 'GET') return
  if (!event.request.url.startsWith(self.location.origin)) return

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(OFFLINE_URL) || caches.match('/')
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          if (event.request.destination === 'image') {
            return caches.match('/icon.png')
          }
          return new Response('', { status: 408, statusText: 'Request Timed Out' })
        })
      )
    })
  )
})
