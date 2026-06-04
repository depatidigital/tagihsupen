import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { nextTiketId } from '@/lib/tiket'
import { sendWhatsApp } from '@/lib/whatsapp'
import { msgKonfirmasi } from '@/lib/messages'
import { logSend, JOB_KEYS } from '@/lib/wa-log'
import { KATEGORI_LABEL, formatTanggal, formatJam } from '@/lib/utils'
import { z } from 'zod'
import { Kategori } from '@prisma/client'

const schema = z.object({
  nama: z.string().min(2),
  whatsapp: z.string().min(8),
  kategori: z.nativeEnum(Kategori),
  deskripsi: z.string().min(10),
  lokasi: z.string().min(3),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  foto: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const data = schema.parse(body)

    const DAILY_LIMIT = 5
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const todayCount = await prisma.laporan.count({
      where: { whatsapp: data.whatsapp, createdAt: { gte: startOfDay } },
    })
    if (todayCount >= DAILY_LIMIT) {
      return NextResponse.json(
        { error: `Batas laporan harian tercapai (maks. ${DAILY_LIMIT} laporan per nomor). Coba lagi besok.` },
        { status: 429 }
      )
    }

    const tiketId = await nextTiketId()

    const laporan = await prisma.laporan.create({
      data: {
        tiketId,
        nama: data.nama,
        whatsapp: data.whatsapp,
        kategori: data.kategori,
        deskripsi: data.deskripsi,
        lokasi: data.lokasi,
        lat: data.lat ?? null,
        lng: data.lng ?? null,
        foto: data.foto ?? [],
        riwayat: { create: { status: 'DITERIMA' } },
      },
    })

    // Upsert warga
    await prisma.warga.upsert({
      where: { whatsapp: data.whatsapp },
      update: { totalLaporan: { increment: 1 }, lastActive: new Date(), nama: data.nama },
      create: { whatsapp: data.whatsapp, nama: data.nama, totalLaporan: 1 },
    })

    const wargaKe = await prisma.laporan.count({
      where: { createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
    })

    // Send WA konfirmasi (non-blocking)
    const msg = msgKonfirmasi({
      nama: data.nama.split(' ')[0],
      tiketId,
      lokasi: data.lokasi,
      kategori: KATEGORI_LABEL[data.kategori],
      tanggal: formatTanggal(laporan.createdAt),
      jam: formatJam(laporan.createdAt),
      wargaKe,
    })

    sendWhatsApp(data.whatsapp, msg)
      .then(() => logSend(data.whatsapp, JOB_KEYS.KONFIRMASI, laporan.id))
      .catch(console.error)

    return NextResponse.json({ tiketId, id: laporan.id })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid', detail: err.errors }, { status: 400 })
    }
    console.error('[POST /api/laporan]', err)
    return NextResponse.json({ error: 'Gagal menyimpan laporan' }, { status: 500 })
  }
}
