/* Après une visite en ligne, toute l'application se rouvre sans réseau.
 * Le build remplace __CACHE_VERSION__ pour forcer une nouvelle mise en cache. */
const CACHE = 'questionnaire-mobilite-__CACHE_VERSION__'

self.addEventListener('install', (event) => {
  event.waitUntil(
    precache().then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'cache-urls' || !Array.isArray(event.data.urls)) return
  event.waitUntil(cacheUrls(event.data.urls))
})

async function precache() {
  const cache = await caches.open(CACHE)
  const listed = await readList()
  const paths = listed.length ? listed : ['', 'index.html', 'site.webmanifest']
  await Promise.all(paths.map((path) => addOne(cache, path)))
}

async function readList() {
  try {
    const response = await fetch(new URL('precache.json', self.location).href, { cache: 'no-store' })
    if (!response.ok) return []
    const body = await response.json()
    return Array.isArray(body) ? body.filter((item) => typeof item === 'string') : []
  } catch {
    return []
  }
}

async function addOne(cache, path) {
  try {
    await cache.add(new URL(path, self.location).href)
  } catch {
    /* Un fichier manquant ne doit pas empêcher d'ouvrir l'enquête. */
  }
}

async function cacheUrls(urls) {
  const cache = await caches.open(CACHE)
  await Promise.all(
    urls.map(async (raw) => {
      let url
      try {
        url = new URL(raw)
      } catch {
        return
      }
      if (url.origin !== self.location.origin || url.pathname.endsWith('.map') || url.pathname.endsWith('/sw.js')) return
      try {
        const response = await fetch(url.href)
        if (response.ok) await cache.put(url.href, response)
      } catch {
        /* Un fichier manquant ne doit pas bloquer la coque. */
      }
    }),
  )
}

function isAsset(url) {
  if (url.pathname.endsWith('/sw.js') || url.pathname.endsWith('/precache.json')) return false
  return url.pathname.includes('/assets/') || /\.(?:js|css|woff2?|png|svg|ico|webmanifest)$/i.test(url.pathname)
}

async function shellResponse() {
  const cache = await caches.open(CACHE)
  return (
    (await cache.match(new URL('./', self.location).href)) ||
    (await cache.match(new URL('index.html', self.location).href))
  )
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  let url
  try {
    url = new URL(request.url)
  } catch {
    return
  }
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          if (response.ok) {
            const copy = response.clone()
            const cache = await caches.open(CACHE)
            await cache.put(new URL('./', self.location).href, copy)
            return response
          }
          return (await shellResponse()) || response
        })
        .catch(async () => (await shellResponse()) || new Response('Hors ligne', { status: 503 })),
    )
    return
  }

  if (!isAsset(url)) return

  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached) return cached
      try {
        const response = await fetch(request)
        if (response.ok) await cache.put(request, response.clone())
        return response
      } catch {
        return cached || new Response('', { status: 504 })
      }
    }),
  )
})
