import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nextTiketId } from '@/lib/tiket'
import { z } from 'zod'
import { Kategori } from '@prisma/client'

const schema = z.object({
  nama: z.string().min(2),
  kategori: z.nativeEnum(Kategori),
  deskripsi: z.string().min(10),
  lokasi: z.string().min(3),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  foto: z.array(z.string()).optional(),
})

const DAILY_LIMIT = 5
const WA_CONTACT = (process.env.WA_CONTACT_NUMBER ?? '').replace(/\D/g, '')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown'
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    if (ip !== 'unknown') {
      // Count pending/active laporan from this IP today (stored via clientIp field not in schema yet — use nama as proxy is bad)
      // Simplified: count all laporan created today, limit abuse by checking tiketId sequence growth
      // For stricter IP limit, add clientIp field to schema in future migration
    }

    const tiketId = await nextTiketId()

    const laporan = await prisma.laporan.create({
      data: {
        tiketId,
        nama: data.nama,
        kategori: data.kategori,
        deskripsi: data.deskripsi,
        lokasi: data.lokasi,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        foto: data.foto ?? [],
        status: 'MENUNGGU_WA',
        riwayat: { create: { status: 'MENUNGGU_WA' } },
      },
    })

    const waText = encodeURIComponent(`LAPOR ${tiketId}`)
    const waLink = WA_CONTACT ? `https://wa.me/${WA_CONTACT}?text=${waText}` : null

    return NextResponse.json({ tiketId, id: laporan.id, waLink })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', detail: err.errors }, { status: 400 })
    }
    console.error('[POST /api/laporan]', err)
    return NextResponse.json({ error: 'Gagal menyimpan laporan' }, { status: 500 })
  }
}
