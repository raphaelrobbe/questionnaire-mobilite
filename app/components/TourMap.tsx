import { useEffect, useMemo, useRef, useState } from 'react'
import type { Map as LeafletMap, Marker } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Draft } from '~/common/draft'
import { draftTitle, mapsDestination } from '~/common/survey'
import { isPlacedHome, locateHome } from '~/lib/stops.client'

type Place = { latitude: number; longitude: number }

type TourPoint = Place & { code: string; index: number; title: string }

export function TourMap({
  drafts,
  selected,
  onSelect,
}: {
  drafts: Draft[]
  selected: string | null
  onSelect: (code: string) => void
}) {
  const targets = drafts.filter((item) => mapsDestination(item.answers))
  const placeKey = targets
    .map((item) => `${item.code}\t${item.answers.adresse.trim()}\t${item.answers.commune.trim()}`)
    .sort()
    .join('\n')
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const [located, setLocated] = useState<Record<string, Place | null>>({})

  useEffect(() => {
    let cancelled = false
    const pending = draftsRef.current.filter((item) => mapsDestination(item.answers))
    setLocated({})
    void (async () => {
      for (const item of pending) {
        if (cancelled) return
        const home = await locateHome(item.answers.adresse, item.answers.commune)
        if (cancelled) return
        const place = isPlacedHome(home) ? { latitude: home.latitude, longitude: home.longitude } : null
        setLocated((current) => ({ ...current, [item.code]: place }))
      }
    })()
    return () => {
      cancelled = true
    }
  }, [placeKey])

  const points = useMemo(
    () =>
      separate(
        drafts.flatMap((item, index) => {
          const place = located[item.code]
          if (!place) return []
          return [{ code: item.code, index, title: draftTitle(item.answers), latitude: place.latitude, longitude: place.longitude }]
        }),
      ),
    [drafts, located],
  )
  if (targets.length === 0) return null
  const pending = targets.some((item) => !(item.code in located))

  return (
    <section className="overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_12px_40px_rgba(28,25,21,0.06)]">
      <div className="px-5 pt-4">
        <h2 className="text-lg font-extrabold">Foyers à visiter</h2>
        <p className="text-sm leading-relaxed text-muted">Touchez un foyer pour le retrouver dans la liste.</p>
      </div>
      <div className="relative mt-3 h-56">
        {points.length > 0 ? <TourCanvas points={points} selected={selected} onSelect={onSelect} /> : null}
        {points.length === 0 ? (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-semibold text-muted">
            {pending ? 'Placement des foyers…' : 'Les adresses n’ont pas pu être placées sur la carte.'}
          </p>
        ) : null}
      </div>
    </section>
  )
}

function TourCanvas({
  points,
  selected,
  onSelect,
}: {
  points: TourPoint[]
  selected: string | null
  onSelect: (code: string) => void
}) {
  const holder = useRef<HTMLDivElement>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const markers = useRef<Marker[]>([])
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect
  const fitted = useRef('')
  const panned = useRef<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const node = holder.current
    if (!node) return
    let cancelled = false
    let map: LeafletMap | null = null
    void import('leaflet').then((leaflet) => {
      if (cancelled || !holder.current) return
      map = leaflet.map(holder.current, { scrollWheelZoom: false, zoomControl: true })
      mapRef.current = map
      leaflet
        .tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 18,
        })
        .addTo(map)
      map.setView([46.9, 6.35], 9)
      map.invalidateSize()
      if (cancelled) {
        map.remove()
        mapRef.current = null
        return
      }
      setReady(true)
    })
    return () => {
      cancelled = true
      markers.current = []
      map?.remove()
      mapRef.current = null
      setReady(false)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!ready || !map) return
    let cancelled = false
    void import('leaflet').then((leaflet) => {
      if (cancelled || mapRef.current !== map) return
      for (const marker of markers.current) marker.remove()
      markers.current = []
      for (const point of points) {
        const active = point.code === selected
        const size = active ? 34 : 28
        const icon = leaflet.divIcon({
          className: 'tour-marker',
          html: `<span class="tour-pin${active ? ' is-selected' : ''}" data-tour-pin="${point.code}">${point.index + 1}</span>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        })
        const marker = leaflet
          .marker([point.latitude, point.longitude], { icon, title: point.title, keyboard: true, zIndexOffset: active ? 500 : 0 })
          .addTo(map)
        marker.on('click', () => onSelectRef.current(point.code))
        markers.current.push(marker)
      }
      const signature = points.map((point) => `${point.code}:${point.latitude.toFixed(5)}:${point.longitude.toFixed(5)}`).join('|')
      if (fitted.current !== signature) {
        fitted.current = signature
        if (points.length === 1) map.setView([points[0]!.latitude, points[0]!.longitude], 15)
        else map.fitBounds(
          leaflet.latLngBounds(points.map((point) => [point.latitude, point.longitude])),
          { padding: [32, 32], maxZoom: 14 },
        )
      } else if (selected && selected !== panned.current) {
        const point = points.find((item) => item.code === selected)
        if (point) map.panTo([point.latitude, point.longitude])
      }
      if (selected) panned.current = selected
      map.invalidateSize()
    })
    return () => {
      cancelled = true
    }
  }, [points, ready, selected])

  return <div ref={holder} className="h-full" />
}

/** Écarte les foyers tombés au même endroit pour que chaque point reste touchable. */
function separate(points: TourPoint[]): TourPoint[] {
  const used: Place[] = []
  return points.map((point) => {
    let latitude = point.latitude
    let longitude = point.longitude
    let turn = 0
    while (used.some((other) => Math.abs(other.latitude - latitude) < 0.00012 && Math.abs(other.longitude - longitude) < 0.00012)) {
      turn += 1
      const angle = (turn * Math.PI) / 3
      latitude = point.latitude + Math.sin(angle) * 0.00018 * turn
      longitude = point.longitude + Math.cos(angle) * 0.00025 * turn
    }
    used.push({ latitude, longitude })
    return { ...point, latitude, longitude }
  })
}
