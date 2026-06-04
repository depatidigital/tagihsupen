import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendWhatsApp } from '@/lib/whatsapp'
import { msgDiteruskan, msgDiproses, msgSelesai } from '@/lib/messages'
import { logSend, isFirstTimeSend, JOB_KEYS } from '@/lib/wa-log'
import { KATEGORI_DINAS } from '@/lib/utils'
import { Status } from '@prisma/client'
import { z } from 'zod'

const schema = z.object({
  status: z.nativeEnum(Status).optional(),
  foto: z.array(z.string()).optional(),
  fotoAfter: z.array(z.string()).optional(),
  catatanAdmin: z.string().optional(),
})

async function sendStatusWa(laporan: Awaited<ReturnType<typeof getLaporan>>) {
  if (!laporan) return

  const { status, whatsapp, tiketId, kategori, lokasi, createdAt, selesaiAt } = laporan

  if (status === 'DITERUSKAN') {
    const first = await isFirstTimeSend(whatsapp, JOB_KEYS.DITERUSKAN)
    if (first) {
      await sendWhatsApp(whatsapp, msgDiteruskan({ tiketId, dinas: KATEGORI_DINAS[kategori] }))
      await logSend(whatsapp, JOB_KEYS.DITERUSKAN, laporan.id)
    }
  }

  if (status === 'DIPROSES') {
    const first = await isFirstTimeSend(whatsapp, JOB_KEYS.DIPROSES)
    if (first) {
      await sendWhatsApp(whatsapp, msgDiproses({ tiketId }))
      await logSend(whatsapp, JOB_KEYS.DIPROSES, laporan.id)
    }
  }

  if (status === 'SELESAI') {
    const first = await isFirstTimeSend(whatsapp, JOB_KEYS.SELESAI)
    if (first) {
      const jamDitangani = selesaiAt
        ? Math.round((selesaiAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
        : 0
      const warga = await prisma.warga.findUnique({ where: { whatsapp } })
      const totalSelesai = warga?.totalSelesai ?? 1

      await sendWhatsApp(
        whatsapp,
        msgSelesai({
          tiketId,
          jamDitangani,
          dinas: KATEGORI_DINAS[kategori],
          lokasi,
          totalSelesai,
        })
      )
      await logSend(whatsapp, JOB_KEYS.SELESAI, laporan.id)

      // Update warga badge
      await prisma.warga.update({
        where: { whatsapp },
        data: {
          totalSelesai: { increment: 1 },
          badge: { push: 'Warga Peduli' },
        },
      })
    }
  }
}

async function getLaporan(id: string) {
  return prisma.laporan.findFirst({
    where: { OR: [{ id }, { tiketId: id }] },
  })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const data = schema.parse(body)

    const existing = await getLaporan(id)
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.laporan.update({
      where: { id: existing.id },
      data: {
        ...(data.status && {
          status: data.status,
          selesaiAt: data.status === 'SELESAI' ? new Date() : undefined,
          riwayat: { create: { status: data.status, catatan: data.catatanAdmin } },
        }),
        ...(data.foto && { foto: data.foto }),
        ...(data.fotoAfter && { fotoAfter: data.fotoAfter }),
        ...(data.catatanAdmin !== undefined && { catatanAdmin: data.catatanAdmin }),
      },
    })

    revalidatePath(`/tiket/${updated.tiketId}`)
    revalidatePath('/')

    if (data.status) {
      sendStatusWa(updated).catch(console.error)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 })
    }
    console.error('[PATCH /api/laporan/[id]]', err)
    return NextResponse.json({ error: 'Gagal update' }, { status: 500 })
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const laporan = await getLaporan(id)
  if (!laporan) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(laporan)
}
