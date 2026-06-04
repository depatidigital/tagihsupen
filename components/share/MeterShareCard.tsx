'use client'

import { useRef } from 'react'
import { Download, Share2, TrendingUp } from 'lucide-react'
import JuaraMeterGauge from '@/components/JuaraMeterGauge'

interface Props {
  score: number
  label: string
  color: string
  totalBulanIni: number
  totalSelesai: number
  wargaAktif: number
  tanggal: string
}

export default function MeterShareCard({ score, label, color, totalBulanIni, totalSelesai, wargaAktif, tanggal }: Props) {
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
    link.download = `juara-meter-${score}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }

  async function handleShare() {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: `Juara Meter Sungai Penuh: ${score}%`, url })
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link disalin!')
    }
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      {/* The card itself */}
      <div ref={cardRef} className="bg-white rounded-3xl overflow-hidden shadow-2xl border border-gray-100">
        {/* Header */}
        <div className="bg-[#1b4332] px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#f5c842]" />
              <span className="text-white/60 text-xs font-semibold uppercase tracking-widest">Tagih Supen</span>
            </div>
            <span className="text-white/40 text-[10px]">{tanggal}</span>
          </div>
          <p className="text-white text-lg font-extrabold leading-tight">
            Indeks Responsivitas<br />Kota Sungai Penuh
          </p>
        </div>

        {/* Gauge */}
        <div className="px-6 py-4 bg-white">
          <JuaraMeterGauge score={score} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
          {[
            { val: totalBulanIni, lbl: 'Laporan masuk' },
            { val: totalSelesai,  lbl: 'Diselesaikan' },
            { val: wargaAktif,    lbl: 'Warga aktif' },
          ].map((s) => (
            <div key={s.lbl} className="py-4 text-center">
              <p className="text-2xl font-extrabold text-gray-900">{s.val}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{s.lbl}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-3 flex items-center justify-between">
          <p className="text-[10px] text-gray-400">tagihsupen.id/share/meter</p>
          <div
            className="text-xs font-bold px-2.5 py-1 rounded-full text-white"
            style={{ backgroundColor: color }}
          >
            {label}
          </div>
        </div>
      </div>

      {/* Action buttons */}
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

      <p className="text-center text-xs text-gray-400">
        Bagikan ke media sosial untuk tunjukkan responsivitas kotamu
      </p>
    </div>
  )
}
