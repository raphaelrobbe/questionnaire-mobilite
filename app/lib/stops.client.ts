import { communePlace } from '~/common/frenchCommunes'

export type MapPoint = { latitude: number; longitude: number }

export type HomeCenter = MapPoint & { zoom: number; approximate: boolean }

export type TransitStop = MapPoint & { id: string; name: string }

const PONTARLIER: HomeCenter = { latitude: 46.9032, longitude: 6.3554, zoom: 13, approximate: true }
const HOME_ZOOM = 14

const geoCache = new Map<string, MapPoint | null>()

export async function locateHome(adresse: string, commune: string): Promise<HomeCenter> {
  const street = adresse.trim()
  const place = communePlace(commune)
  if (street && place) {
    const hit = await geocode(`${street}, ${place}`)
    if (hit) return { ...hit, zoom: HOME_ZOOM, approximate: false }
  }
  if (place) {
    const hit = await geocode(place)
    if (hit) return { ...hit, zoom: HOME_ZOOM, approximate: true }
  }
  return PONTARLIER
}

export async function loadStops(latitude: number, longitude: number): Promise<TransitStop[]> {
  const left = longitude - 0.05
  const right = longitude + 0.05
  const top = latitude + 0.04
  const bottom = latitude - 0.04
  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'jsonv2')
  url.searchParams.set('q', '[highway=bus_stop]')
  url.searchParams.set('viewbox', `${left},${top},${right},${bottom}`)
  url.searchParams.set('bounded', '1')
  url.searchParams.set('limit', '40')
  try {
    const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
    if (!response.ok) return []
    const rows = (await response.json()) as { osm_id?: number; lat?: string; lon?: string; name?: string }[]
    const stops: TransitStop[] = []
    for (const row of rows) {
      const stopLatitude = Number(row.lat)
      const stopLongitude = Number(row.lon)
      if (!Number.isFinite(stopLatitude) || !Number.isFinite(stopLongitude)) continue
      if (stops.some((stop) => distanceMeters(stop, stopLatitude, stopLongitude) < 25)) continue
      stops.push({
        id: String(row.osm_id ?? `${stopLatitude},${stopLongitude}`),
        name: row.name?.trim() || 'Arrêt',
        latitude: stopLatitude,
        longitude: stopLongitude,
      })
    }
    return stops.sort((left, right) => distanceMeters(left, latitude, longitude) - distanceMeters(right, latitude, longitude))
  } catch {
    return []
  }
}

function distanceMeters(point: MapPoint, latitude: number, longitude: number): number {
  const earth = 6371000
  const lat = ((latitude - point.latitude) * Math.PI) / 180
  const lon = ((longitude - point.longitude) * Math.PI) / 180
  const south = (point.latitude * Math.PI) / 180
  const north = (latitude * Math.PI) / 180
  const arc = Math.sin(lat / 2) ** 2 + Math.cos(south) * Math.cos(north) * Math.sin(lon / 2) ** 2
  return 2 * earth * Math.asin(Math.min(1, Math.sqrt(arc)))
}

async function geocode(query: string): Promise<MapPoint | null> {
  if (geoCache.has(query)) return geoCache.get(query) ?? null
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return null
    const rows = (await response.json()) as { lat?: string; lon?: string }[]
    const row = rows[0]
    const latitude = Number(row?.lat)
    const longitude = Number(row?.lon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
    const hit = { latitude, longitude }
    geoCache.set(query, hit)
    return hit
  } catch {
    return null
  }
}
