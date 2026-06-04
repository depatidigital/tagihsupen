import { NextRequest, NextResponse } from 'next/server'
import { Kategori } from '@prisma/client'

const VALID = new Set(Object.values(Kategori))
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp'])
const MAX_BASE64_LEN = 250_000   // ~185KB image after decode — jauh lebih dari cukup untuk 512px JPEG
const BASE64_RE = /^[A-Za-z0-9+/]+=*$/

// In-memory rate limiter — resets on process restart, cukup untuk cegah abuse ringan
interface RateEntry { count: number; resetAt: number }
const perMinute = new Map<string, RateEntry>()
const perHour   = new Map<string, RateEntry>()

const MINUTE_LIMIT = 5
const HOUR_LIMIT   = 20

function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  )
}

function checkRate(map: Map<string, RateEntry>, ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = map.get(ip)
  if (!entry || now > entry.resetAt) {
    map.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count++
  return true
}

function isAllowedOrigin(req: NextRequest): boolean {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
  const origin = req.headers.get('origin') ?? ''
  const referer = req.headers.get('referer') ?? ''

  // Allow local dev
  if (origin.startsWith('http://localhost') || referer.startsWith('http://localhost')) return true
  if (!appUrl) return true  // tidak dikonfigurasi — jangan block

  return origin.startsWith(appUrl) || referer.startsWith(appUrl)
}

export async function POST(req: NextRequest) {
  // Origin check
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limit
  const ip = getIp(req)
  if (!checkRate(perMinute, ip, MINUTE_LIMIT, 60_000)) {
    return NextResponse.json({ error: 'Terlalu banyak permintaan, coba lagi sebentar' }, { status: 429 })
  }
  if (!checkRate(perHour, ip, HOUR_LIMIT, 3_600_000)) {
    return NextResponse.json({ error: 'Batas per jam tercapai, coba lagi nanti' }, { status: 429 })
  }

  try {
    const body = await req.json()
    const { imageBase64, mimeType } = body

    // Input validation
    if (typeof imageBase64 !== 'string' || typeof mimeType !== 'string') {
      return NextResponse.json({ error: 'Input tidak valid' }, { status: 400 })
    }
    if (!ALLOWED_MIME.has(mimeType)) {
      return NextResponse.json({ error: 'Tipe file tidak didukung' }, { status: 400 })
    }
    if (imageBase64.length > MAX_BASE64_LEN) {
      return NextResponse.json({ error: 'Ukuran gambar terlalu besar' }, { status: 400 })
    }
    if (!BASE64_RE.test(imageBase64)) {
      return NextResponse.json({ error: 'Format gambar tidak valid' }, { status: 400 })
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI tidak dikonfigurasi' }, { status: 500 })
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'low',
                },
              },
              {
                type: 'text',
                text: `Ini foto keluhan warga kota Indonesia. Klasifikasikan ke salah satu:
- SAMPAH: sampah, kebersihan, tumpukan limbah
- JALAN: jalan rusak, berlubang, aspal rusak
- DRAINASE: saluran air tersumbat, banjir, got mampet
- PENERANGAN: lampu jalan mati, area gelap
- PASAR: ketertiban pasar, PKL liar, area kumuh pasar
- LAINNYA: selain kategori di atas

Jawab HANYA JSON: {"kategori":"NAMA_KATEGORI","alasan":"1 kalimat singkat"}`,
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) throw new Error(`OpenAI ${res.status}`)

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content?.trim() ?? ''
    const match = content.match(/\{[\s\S]*?\}/)
    if (!match) throw new Error('Format AI tidak valid')

    const parsed = JSON.parse(match[0])
    if (!VALID.has(parsed.kategori)) throw new Error(`Kategori tidak dikenal: ${parsed.kategori}`)

    return NextResponse.json({
      kategori: parsed.kategori as Kategori,
      alasan: String(parsed.alasan ?? ''),
    })
  } catch (err) {
    console.error('[POST /api/analyze-foto]', err)
    return NextResponse.json({ error: 'Gagal menganalisa foto' }, { status: 500 })
  }
}
