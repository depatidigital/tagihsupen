import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp'
import { msgKonfirmasi, msgReply1, msgReply2, msgReply3, msgReplyUnknown } from '@/lib/messages'
import { logSend, JOB_KEYS } from '@/lib/wa-log'
import { KATEGORI_LABEL, formatTanggal, formatJam } from '@/lib/utils'

// Pattern: "LAPOR TKT-2026-001" (case-insensitive)
const LAPOR_PATTERN = /^LAPOR\s+(TKT-[\w-]+)$/i

async function handleLapor(phone: string, jid: string | null, tiketId: string) {
  const laporan = await prisma.laporan.findFirst({
    where: { tiketId, status: 'MENUNGGU_WA' },
  })

  if (!laporan) {
    await sendWhatsApp(phone, { message: `Kode *${tiketId}* tidak ditemukan atau sudah dikonfirmasi sebelumnya.` })
    return
  }

  const normalized = phone.replace(/\D/g, '').replace(/^62/, '0')

  // Rate limit: max DAILY_LIMIT confirmed laporan per WA today
  const DAILY_LIMIT = 5
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const todayCount = await prisma.laporan.count({
    where: {
      whatsapp: { in: [normalized, phone] },
      status: { not: 'MENUNGGU_WA' },
      createdAt: { gte: startOfDay },
    },
  })
  if (todayCount >= DAILY_LIMIT) {
    await sendWhatsApp(phone, { message: `Batas laporan harian tercapai (maks. ${DAILY_LIMIT} per nomor). Coba lagi besok.` })
    return
  }

  // Confirm laporan
  const updated = await prisma.laporan.update({
    where: { id: laporan.id },
    data: {
      whatsapp: normalized,
      jid: jid ?? undefined,
      status: 'DITERIMA',
      riwayat: { create: { status: 'DITERIMA', catatan: 'Dikonfirmasi via WhatsApp' } },
    },
  })

  // Upsert warga
  await prisma.warga.upsert({
    where: { whatsapp: normalized },
    update: { totalLaporan: { increment: 1 }, lastActive: new Date(), nama: laporan.nama },
    create: { whatsapp: normalized, nama: laporan.nama, totalLaporan: 1 },
  })

  const wargaKe = await prisma.laporan.count({
    where: { status: { not: 'MENUNGGU_WA' }, createdAt: { gte: startOfDay } },
  })

  const msg = msgKonfirmasi({
    nama: laporan.nama.split(' ')[0],
    tiketId,
    lokasi: laporan.lokasi,
    kategori: KATEGORI_LABEL[laporan.kategori],
    tanggal: formatTanggal(updated.createdAt),
    jam: formatJam(updated.createdAt),
    wargaKe,
  })

  sendWhatsApp(phone, { message: msg })
    .then(() => logSend(phone, JOB_KEYS.KONFIRMASI, laporan.id))
    .catch(console.error)
}

export async function GET() {
  return NextResponse.json({ ok: true, webhook: 'wa', status: 'active' })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Support both event-based (incoming_message) and raw payload
    const isIncoming = !body.event || body.event === 'incoming_message'
    if (!isIncoming) return NextResponse.json({ ok: true })

    const phone: string = (body.fromPhone ?? body.phone ?? body.from ?? '').trim()
    const message: string = (body.message ?? body.text ?? '').trim()
    const jid: string | null = body.jid ?? body.fromJid ?? null

    if (!phone || !message) return NextResponse.json({ ok: true })

    console.log('[WA incoming]', { phone, message, jid })

    // Handle LAPOR TKT-xxx
    const laporMatch = message.match(LAPOR_PATTERN)
    if (laporMatch) {
      await handleLapor(phone, jid, laporMatch[1].toUpperCase())
      return NextResponse.json({ ok: true })
    }

    // Handle menu replies (1 / 2 / 3) — lookup by confirmed whatsapp
    const normalized = phone.replace(/\D/g, '').replace(/^62/, '0')
    const lastLaporan = await prisma.laporan.findFirst({
      where: {
        whatsapp: { in: [normalized, phone] },
        status: { not: 'MENUNGGU_WA' },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (!lastLaporan) {
      await sendWhatsApp(phone, { message: msgReplyUnknown() })
      return NextResponse.json({ ok: true })
    }

    const { tiketId } = lastLaporan
    let reply = ''
    if (message === '1') reply = msgReply1(tiketId)
    else if (message === '2') reply = msgReply2(tiketId)
    else if (message === '3') reply = msgReply3(tiketId)
    else reply = msgReplyUnknown()

    await sendWhatsApp(phone, { message: reply })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/webhook/wa]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
