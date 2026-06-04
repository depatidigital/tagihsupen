'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number
}

const CX = 150
const CY = 148
const R = 108
const R_NEEDLE = 86
const STROKE_W = 24

const BANDS = [
  { s0: 0,  s1: 20,  color: '#EF4444' },
  { s0: 20, s1: 40,  color: '#F97316' },
  { s0: 40, s1: 60,  color: '#EAB308' },
  { s0: 60, s1: 80,  color: '#84CC16' },
  { s0: 80, s1: 100, color: '#22C55E' },
]

function gaugeColor(s: number) {
  if (s >= 80) return '#22C55E'
  if (s >= 60) return '#84CC16'
  if (s >= 40) return '#EAB308'
  if (s >= 20) return '#F97316'
  return '#EF4444'
}

function gaugeLabel(s: number) {
  if (s >= 80) return 'Sangat Responsif'
  if (s >= 60) return 'Responsif'
  if (s >= 40) return 'Cukup Responsif'
  if (s >= 20) return 'Kurang Responsif'
  return 'Tidak Responsif'
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

// score 0 → 180° (left), score 100 → 360° (right), through 270° (top)
function pt(score: number, r: number) {
  const rad = toRad(180 + (score / 100) * 180)
  return {
    x: (CX + r * Math.cos(rad)).toFixed(2),
    y: (CY + r * Math.sin(rad)).toFixed(2),
  }
}

function arcD(s0: number, s1: number, r: number) {
  const a = pt(s0, r)
  const b = pt(s1, r)
  return `M ${a.x} ${a.y} A ${r} ${r} 0 0 1 ${b.x} ${b.y}`
}

export default function JuaraMeterGauge({ score: rawScore }: Props) {
  const score = Math.max(0, Math.min(100, rawScore))
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setDisplay(score), 400)
    return () => clearTimeout(t)
  }, [score])

  // Needle defined pointing right (+x), rotated to position
  // score=0 → rotate -180° (left), score=100 → rotate 0° (right)
  const rotation = (display / 100) * 180 - 180
  const color = gaugeColor(display)
  const label = gaugeLabel(display)

  return (
    <div className="w-full select-none">
      {/* Arc + needle only — no text inside SVG */}
      <svg viewBox="0 0 300 162" className="w-full">
        {/* Track */}
        <path d={arcD(0, 50, R)}   stroke="#E5E7EB" strokeWidth={STROKE_W + 6} fill="none" strokeLinecap="round" />
        <path d={arcD(50, 100, R)} stroke="#E5E7EB" strokeWidth={STROKE_W + 6} fill="none" strokeLinecap="round" />

        {/* Colored bands */}
        {BANDS.map((b) => (
          <path
            key={b.s0}
            d={arcD(b.s0, b.s1, R)}
            stroke={b.color}
            strokeWidth={STROKE_W}
            fill="none"
            strokeLinecap={b.s0 === 0 || b.s1 === 100 ? 'round' : 'butt'}
          />
        ))}

        {/* Scale labels */}
        <text x="22"  y={CY + 20} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="Plus Jakarta Sans, sans-serif">0</text>
        <text x="278" y={CY + 20} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="Plus Jakarta Sans, sans-serif">100</text>

        {/* Animated needle group */}
        <g
          transform={`rotate(${rotation}, ${CX}, ${CY})`}
          style={{ transition: 'transform 1.6s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
        >
          <line x1={CX - 18} y1={CY} x2={CX + R_NEEDLE} y2={CY}
            stroke="rgba(0,0,0,0.08)" strokeWidth="5" strokeLinecap="round" />
          <line x1={CX - 18} y1={CY} x2={CX + R_NEEDLE} y2={CY}
            stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          <circle cx={CX + R_NEEDLE} cy={CY} r="7"   fill="#1F2937" />
          <circle cx={CX + R_NEEDLE} cy={CY} r="4"   fill="white" />
        </g>

        {/* Center hub */}
        <circle cx={CX} cy={CY} r="13" fill="#1F2937" />
        <circle cx={CX} cy={CY} r="7.5" fill="white" />
      </svg>

      {/* Score + label — separated, below SVG */}
      <div className="text-center -mt-1">
        <p
          className="text-4xl font-extrabold leading-none"
          style={{ color, transition: 'color 0.6s ease' }}
        >
          {display}
        </p>
        <p
          className="text-sm font-semibold mt-1"
          style={{ color, transition: 'color 0.6s ease' }}
        >
          {label}
        </p>
      </div>
    </div>
  )
}
