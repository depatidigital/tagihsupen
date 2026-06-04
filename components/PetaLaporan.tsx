'use client'

import { useEffect, useRef } from 'react'
import { STATUS_COLOR, STATUS_LABEL, KATEGORI_LABEL, KATEGORI_EMOJI } from '@/lib/utils'
import { Status, Kategori } from '@prisma/client'

interface Pin {
  id: string
  tiketId: string
  kategori: Kategori
  lokasi: string
  status: Status
  lat: number
  lng: number
  tanggal: string
}

interface Props {
  pins: Pin[]
}

const SUNGAI_PENUH = [-2.0598, 101.3975] as [number, number]

export default function PetaLaporan({ pins }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css')

      const map = L.map(mapRef.current!, {
        center: SUNGAI_PENUH,
        zoom: 14,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map)

      pins.forEach((pin) => {
        const color = STATUS_COLOR[pin.status]
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;background:${color};border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;box-shadow:0 2px 8px rgba(0,0,0,.3)">${KATEGORI_EMOJI[pin.kategori]}</div>`,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })

        const marker = L.marker([pin.lat, pin.lng], { icon })
        marker.bindPopup(`
          <div style="font-family:sans-serif;min-width:180px">
            <p style="font-weight:700;margin:0 0 4px">${KATEGORI_LABEL[pin.kategori]}</p>
            <p style="margin:0 0 4px;font-size:13px;color:#555">📍 ${pin.lokasi}</p>
            <p style="margin:0 0 8px;font-size:12px;color:#888">${new Date(pin.tanggal).toLocaleDateString('id-ID')}</p>
            <span style="background:${color};color:white;font-size:11px;font-weight:700;padding:3px 8px;border-radius:100px">${STATUS_LABEL[pin.status]}</span>
            <a href="/tiket/${pin.tiketId}" style="display:block;margin-top:8px;font-size:12px;color:#1B4332;font-weight:600">Lihat detail →</a>
          </div>
        `)
        marker.addTo(map)
      })

      mapInstance.current = map
    })

    return () => {
      if (mapInstance.current) {
        ;(mapInstance.current as { remove: () => void }).remove()
        mapInstance.current = null
      }
    }
  }, [pins])

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />
}
