'use client'

import { useEffect, useState } from 'react'
import { labelJuaraMeter, colorJuaraMeter } from '@/lib/utils'

interface Props {
  initialSkor: number
}

export default function JuaraMeter({ initialSkor }: Props) {
  const [skor, setSkor] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setSkor(initialSkor), 100)
    return () => clearTimeout(timer)
  }, [initialSkor])

  const label = labelJuaraMeter(skor)
  const color = colorJuaraMeter(skor)

  return (
    <div className="card">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Juara Meter</p>
      <div className="flex items-end gap-3 mb-3">
        <span className="text-5xl font-extrabold transition-colors duration-500" style={{ color }}>
          {skor}%
        </span>
        <span className="text-sm font-semibold text-gray-600 mb-1.5">{label}</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
        <div
          className="h-4 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${skor}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Skor respons kota berdasarkan laporan warga 30 hari terakhir
      </p>
    </div>
  )
}
