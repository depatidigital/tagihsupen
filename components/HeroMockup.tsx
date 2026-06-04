'use client'

import { ArrowRight } from 'lucide-react'

const MESSAGES = [
  {
    type: 'user',
    text: 'Jalan rusak di Jl. Depati Parbo sudah 2 minggu 🚧',
    time: '09:14',
    delay: 0.3,
  },
  {
    type: 'bot',
    text: '✅ Laporan diterima!',
    sub: 'Tiket: TSP-2024-089',
    highlight: true,
    time: '09:14',
    delay: 0.9,
  },
  {
    type: 'bot',
    text: '🔄 Status diperbarui',
    sub: 'Diteruskan ke Dinas PU',
    subColor: '#93C5FD',
    time: '10:32',
    delay: 1.5,
  },
  {
    type: 'bot',
    text: '⚙️ Sedang diproses',
    sub: 'Tim PU sudah turun lapangan',
    subColor: '#FDE047',
    time: 'Kmrn 08:15',
    delay: 2.1,
  },
  {
    type: 'bot',
    text: '🎉 Laporan Selesai!',
    sub: 'Ditangani dalam 48 jam',
    time: 'Hari ini 14:20',
    delay: 2.7,
  },
]

export default function HeroMockup({ score }: { score: number }) {
  return (
    <div className="w-60">
      <div className="bg-[#111b21] border border-white/10 rounded-[2.5rem] p-2.5 shadow-2xl">
        <div className="rounded-[2rem] overflow-hidden">

          {/* WA header */}
          <div className="bg-[#202c33] px-3 py-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#f5c842] rounded-full flex items-center justify-center shrink-0">
              <span className="text-[#1b4332] text-xs font-extrabold">T</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-[10px] font-bold">Tagih Supen Bot</p>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                <p className="text-white/50 text-[8px]">aktif sekarang</p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[8px] text-[#f5c842] font-bold">{score}%</p>
              <p className="text-[7px] text-white/40">Juara Meter</p>
            </div>
          </div>

          {/* Chat body */}
          <div className="bg-[#0b141a] px-2 py-3 space-y-2" style={{ minHeight: 295 }}>
            {MESSAGES.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'} hero-bubble`}
                style={{ animationDelay: `${m.delay}s` }}
              >
                <div
                  className={`rounded-xl px-2.5 py-1.5 max-w-[82%] ${
                    m.type === 'user'
                      ? 'rounded-tr-none bg-[#005c4b]'
                      : 'rounded-tl-none bg-[#202c33]'
                  }`}
                >
                  {m.type === 'bot' && (
                    <p className="text-[#f5c842] font-bold text-[7px] mb-0.5">Tagih Supen</p>
                  )}
                  <p className="text-white text-[9px] leading-relaxed">{m.text}</p>
                  {m.sub && (
                    <p
                      className="text-[8px] font-semibold"
                      style={{
                        color: m.subColor ?? (m.highlight ? '#f5c842' : 'rgba(255,255,255,0.6)'),
                      }}
                    >
                      {m.sub}
                    </p>
                  )}
                  <p className="text-white/30 text-[7px] mt-0.5 text-right">{m.time}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div className="bg-[#202c33] px-2 py-2 flex items-center gap-1.5">
            <div className="flex-1 bg-[#2a3942] rounded-full px-2.5 py-1">
              <p className="text-white/30 text-[8px]">Ketik laporan...</p>
            </div>
            <div className="w-6 h-6 bg-[#f5c842] rounded-full flex items-center justify-center shrink-0">
              <ArrowRight size={10} className="text-[#1b4332]" />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
