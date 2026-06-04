'use client'

import { useEffect, useState } from 'react'

interface Props {
  score: number
}

const CX = 150
const CY = 155
const R = 110
const R_NEEDLE = 88
const STROKE_W = 26

const BANDS = [
  { s0: 0,  s1: 20,  color: '#EF4444' },
  { s0: 20, s1: 40,  color: '#F97316' },
  { s0: 40, s1: 60,  color: '#EAB308' },
  { s0: 60, s1: 80,  color: '#84CC16' },
  { s0: 80, s1: 100, color: '#22C55E' },
]

function gaugeColor(score: number): string {
  if (score >= 80) return '#22C55E'
  if (score >= 60) return '#84CC16'
  if (score >= 40) return '#EAB308'
  if (score >= 20) return '#F97316'
  return '#EF4444'
}

function gaugeLabel(score: number): string {
  if (score >= 80) return 'Sangat Responsif'
  if (score >= 60) return 'Responsif'
  if (score >= 40) return 'Cukup Responsif'
  if (score >= 20) return 'Kurang Responsif'
  return 'Tidak Responsif'
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

// score 0 → 180°, score 100 → 360° (through 270° = top)
function pt(score: number, r: number) {
  const rad = toRad(180 + (score / 100) * 180)
  return {
    x: (CX + r * Math.cos(rad)).toFixed(2),
    y: (CY + r * Math.sin(rad)).toFixed(2),
  }
}

function arcD(s0: number, s1: number, r: number): string {
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

  // Needle: defined pointing RIGHT along +x axis, then rotated
  // rotation = (display/100)*180 - 180
  // score=0 → -180° (points left), score=50 → -90° (points up), score=100 → 0° (points right)
  const rotation = (display / 100) * 180 - 180
  const color = gaugeColor(display)
  const label = gaugeLabel(display)

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      <svg viewBox="0 0 300 185" className="w-full overflow-visible">
        {/* Track */}
        <path d={arcD(0, 50, R)} stroke="#E5E7EB" strokeWidth={STROKE_W + 6} fill="none" strokeLinecap="round" />
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
        <text x="26" y={CY + 24} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="Plus Jakarta Sans, sans-serif">0</text>
        <text x="274" y={CY + 24} textAnchor="middle" fontSize="11" fill="#9CA3AF" fontFamily="Plus Jakarta Sans, sans-serif">100</text>

        {/* Animated needle group — rotates around (CX, CY) */}
        <g
          transform={`rotate(${rotation}, ${CX}, ${CY})`}
          style={{ transition: 'transform 1.6s cubic-bezier(0.34, 1.2, 0.64, 1)' }}
        >
          {/* Needle back stub */}
          <line x1={CX - 20} y1={CY} x2={CX + R_NEEDLE} y2={CY} stroke="rgba(0,0,0,0.1)" strokeWidth="5" strokeLinecap="round" />
          <line x1={CX - 20} y1={CY} x2={CX + R_NEEDLE} y2={CY} stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          {/* Needle tip */}
          <circle cx={CX + R_NEEDLE} cy={CY} r="8" fill="#1F2937" />
          <circle cx={CX + R_NEEDLE} cy={CY} r="4.5" fill="white" />
        </g>

        {/* Center hub (on top of needle) */}
        <circle cx={CX} cy={CY} r="13" fill="#1F2937" />
        <circle cx={CX} cy={CY} r="8" fill="white" />

        {/* Score & label */}
        <text
          x={CX}
          y={CY + 35}
          textAnchor="middle"
          fontSize="34"
          fontWeight="800"
          fill={color}
          fontFamily="Plus Jakarta Sans, sans-serif"
          style={{ transition: 'fill 0.6s ease' }}
        >
          {display}
        </text>
      </svg>

      <p
        className="text-center text-base font-bold -mt-2"
        style={{ color, transition: 'color 0.6s ease' }}
      >
        {label}
      </p>
    </div>
  )
}
