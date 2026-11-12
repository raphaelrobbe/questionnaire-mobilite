import { useEffect, useRef, useState } from 'react'
import type { LeafletMouseEvent, Map as LeafletMap, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { loadStops, locateHome, type HomeCenter, type TransitStop } from '~/lib/stops.client'

type Mode = 'stops' | 'click'

export function StopMap({
  adresse,
  commune,
  mode,
  latitude,
  longitude,
  onPick,
}: {
  adresse: string
  commune: string
  mode: Mode
  latitude: number | null
  longitude: number | null
  onPick: (latitude: number, longitude: number) => void
}) {
  const holder = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const onPickRef = useRef(onPick)
  onPickRef.current = onPick
  const [home, setHome] = useState<HomeCenter | null>(null)
  const [stops, setStops] = useState<TransitStop[]>([])
  const [stopsSettled, setStopsSettled] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    const node = holder.current
    if (!node) return
    let cancelled = false
    setStatus('loading')
    setStops([])
    setStopsSettled(mode !== 'stops')
    setHome(null)
    void (async () => {
      const leaflet = await import('leaflet')
      if (cancelled || !holder.current) return
      const center = await locateHome(adresse, commune)
      if (cancelled || !holder.current) return
      const map = leaflet.map(holder.current, { scrollWheelZoom: false, zoomControl: true })
      mapRef.current = map
      leaflet
        .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        })
        .addTo(map)
      map.setView([center.latitude, center.longitude], center.zoom)
      map.invalidateSize()
      if (cancelled) {
        map.remove()
        mapRef.current = null
        return
      }
      setHome(center)
      setStatus('ready')
      if (mode === 'stops') {
        const found = await loadStops(center.latitude, center.longitude)
        if (cancelled) return
        setStops(found)
        setStopsSettled(true)
      }
    })()
    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [adresse, commune, mode])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !home || status !== 'ready') return
    let cancelled = false
    const markers: Marker[] = []
    void import('leaflet').then((leaflet) => {
      if (cancelled) return
      addDot(leaflet, map, markers, home, 'home', 'Domicile')
      if (mode === 'stops') {
        for (const stop of stops) {
          const selected = samePoint(latitude, longitude, stop.latitude, stop.longitude)
          const dot = addDot(leaflet, map, markers, stop, selected ? 'selected' : 'stop', stop.name, false)
          dot.on('click', (event) => {
            leaflet.DomEvent.stopPropagation(event)
            onPickRef.current(stop.latitude, stop.longitude)
          })
        }
      }
      if (latitude !== null && longitude !== null && !stops.some((stop) => samePoint(latitude, longitude, stop.latitude, stop.longitude))) {
        addDot(leaflet, map, markers, { latitude, longitude }, 'selected', 'Arrêt choisi')
      }
    })
    return () => {
      cancelled = true
      for (const marker of markers) marker.remove()
    }
  }, [home, latitude, longitude, mode, status, stops])

  useEffect(() => {
    const map = mapRef.current
    if (!map || status !== 'ready' || (mode === 'stops' && !stopsSettled)) return
    const handler = (event: LeafletMouseEvent) => onPickRef.current(event.latlng.lat, event.latlng.lng)
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [mode, status, stopsSettled])

  const hint =
    status === 'loading'
      ? 'Recherche du domicile…'
      : home?.zoom === 13
        ? 'Le domicile n’a pas été trouvé. La carte est centrée sur Pontarlier.'
        : home?.approximate
          ? 'L’adresse exacte n’a pas été trouvée. La carte est centrée sur la commune.'
          : mode === 'stops' && !stopsSettled
        ? 'Recherche des arrêts…'
        : mode === 'stops' && stops.length === 0
          ? 'Aucun arrêt trouvé à proximité. Touchez la carte pour indiquer l’emplacement.'
          : mode === 'stops'
            ? 'Touchez un arrêt pour le retenir, ou un autre endroit de la carte.'
            : 'Touchez la carte pour placer l’arrêt.'

  return (
    <div className="grid gap-2">
      <div ref={holder} className="h-72 w-full overflow-hidden rounded-2xl border border-line bg-mist" />
      <p className="text-sm text-muted">{hint}</p>
      {latitude !== null && longitude !== null ? (
        <p className="font-mono text-sm font-bold text-pine">
          {latitude.toFixed(5)}, {longitude.toFixed(5)}
        </p>
      ) : null}
    </div>
  )
}

function addDot(
  leaflet: typeof import('leaflet'),
  map: LeafletMap,
  markers: Marker[],
  point: { latitude: number; longitude: number },
  kind: 'home' | 'stop' | 'selected',
  title: string,
  bubble = true,
) {
  const size = kind === 'selected' ? 22 : kind === 'home' ? 14 : 16
  const icon = leaflet.divIcon({
    className: 'stop-marker',
    html: `<span class="stop-dot${kind === 'home' ? ' is-home' : ''}${kind === 'selected' ? ' is-selected' : ''}"></span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
  const dot = leaflet.marker([point.latitude, point.longitude], { icon, title, keyboard: true, bubblingMouseEvents: bubble }).addTo(map)
  markers.push(dot)
  return dot
}

function samePoint(latitude: number | null, longitude: number | null, otherLatitude: number, otherLongitude: number): boolean {
  if (latitude === null || longitude === null) return false
  return Math.abs(latitude - otherLatitude) < 0.00002 && Math.abs(longitude - otherLongitude) < 0.00002
}
