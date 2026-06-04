'use client'

import { useRef } from 'react'
import { Download, Share2, MapPin, Clock } from 'lucide-react'
import { Status } from '@prisma/client'

interface Props {
  tiketId: string
  emoji: string
  kategori: string
  lokasi: string
  status: Status
  statusLabel: string
  statusColor: string
  stepIndex: number
  allStatuses: Status[]
  statusLabels: Record<Status, string>
  tanggal: string
}

export default function LaporanShareCard({
  tiketId, emoji, kategori, lokasi, status, statusLabel, statusColor,
  stepIndex, allStatuses, statusLabels, tanggal,
}: Props) {
  const cardRef = useRef<HTMLDivElement>(null)

  async function handleDownload() {
    if (!cardRef.current) return
    const { default: html2canvas } = await import('html2canvas')
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
    })
    const link = document.createElement('a')
    link.download = `laporan-${tiketId}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function handleShare() {
    const url = `${window.location.origin}/tiket/${tiketId}`
    if (navigator.share) {
      await navigator.share({ title: `Laporan ${kategori} — ${tiketId}`, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link disalin!')
    }
  }

  const pct = stepIndex < 0 ? 0 : Math.round(((stepIndex + 1) / allStatuses.length) * 100)
  const isDone = status === 'SELESAI'
  const isDitolak = status === 'DITOLAK'

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* Card */}
      <div ref={cardRef} className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="bg-[#1b4332] px-6 py-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white/40 text-[10px] uppercase tracking-widest font-semibold">Tagih Supen</span>
            <span className="text-white/40 text-[10px]">{tanggal}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{emoji}</span>
            <div>
              <p className="text-white font-extrabold text-lg leading-tight">{kategori}</p>
              <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {lokasi}
              </p>
            </div>
          </div>
        </div>

        {/* Tiket ID */}
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-xs text-gray-400 font-mono">{tiketId}</span>
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: isDitolak ? '#EF4444' : statusColor }}
          >
            {statusLabel}
          </span>
        </div>

        {/* Progress */}
        <div className="px-6 py-5">
          {isDitolak ? (
            <div className="text-center py-2">
              <p className="text-red-500 font-bold">❌ Laporan Ditolak</p>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] text-gray-400 mb-1.5">
                  <span>Progress penanganan</span>
                  <span className="font-bold" style={{ color: statusColor }}>{pct}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: statusColor }}
                  />
                </div>
              </div>

              {/* Status steps */}
              <div className="flex items-center gap-0">
                {allStatuses.map((s, i) => {
                  const done = i <= stepIndex
                  const active = i === stepIndex
                  return (
                    <div key={s} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold ${active ? 'ring-2 ring-offset-1' : ''}`}
                          style={{
                            backgroundColor: done ? statusColor : '#E5E7EB',
                            color: done ? 'white' : '#9CA3AF',
                            outline: active ? `2px solid ${statusColor}` : 'none',
                            outlineOffset: '2px',
                          }}
                        >
                          {done ? '✓' : i + 1}
                        </div>
                        <p className={`text-[8px] text-center w-12 leading-tight ${done ? 'text-gray-700 font-semibold' : 'text-gray-400'}`}>
                          {statusLabels[s]}
                        </p>
                      </div>
                      {i < allStatuses.length - 1 && (
                        <div
                          className="flex-1 h-0.5 mb-4"
                          style={{ backgroundColor: i < stepIndex ? statusColor : '#E5E7EB' }}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-100">
          <p className="text-[10px] text-gray-400">tagihsupen.id/tiket/{tiketId}</p>
          {isDone && (
            <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold">
              <Clock size={10} /> Selesai
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-2 bg-[#1b4332] text-white font-semibold py-3 rounded-xl hover:bg-opacity-90 transition-all active:scale-95 text-sm"
        >
          <Download size={16} /> Simpan PNG
        </button>
        <button
          onClick={handleShare}
          className="flex-1 flex items-center justify-center gap-2 bg-[#f5c842] text-[#1b4332] font-semibold py-3 rounded-xl hover:bg-yellow-300 transition-all active:scale-95 text-sm"
        >
          <Share2 size={16} /> Bagikan
        </button>
      </div>
    </div>
  )
}
