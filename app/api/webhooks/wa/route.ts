import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp'
import { msgReply1, msgReply3, msgReplyUnknown } from '@/lib/messages'
import { msgKonfirmasiAI } from '@/lib/messages-ai'
import { logSend, JOB_KEYS } from '@/lib/wa-log'
import { KATEGORI_LABEL, formatTanggal, formatJam } from '@/lib/utils'
import fs from 'fs'
import path from 'path'

// Pattern: "LAPOR TGSP-0506-001" (case-insensitive, any prefix)
const LAPOR_PATTERN = /^LAPOR\s+([\w]+-[\w-]+)$/i

// In-memory dedup: messageId → timestamp, TTL 10 min
const seen = new Map<string, number>()
const SEEN_TTL = 10 * 60 * 1000

function isDuplicate(id: string): boolean {
  const now = Date.now()
  // Evict expired
  for (const [k, t] of seen) if (now - t > SEEN_TTL) seen.delete(k)
  if (seen.has(id)) return true
  seen.set(id, now)
  return false
}

const LOG_FILE = path.join(process.cwd(), 'logs', 'wa-incoming.log')

function logToFile(entry: object) {
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true })
    fs.appendFileSync(LOG_FILE, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + '\n')
  } catch {
    // non-fatal
  }
}

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

  const msg = await msgKonfirmasiAI({
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
    const msgId: string = body.messageId ?? body.id ?? `${phone}:${message}`

    if (!phone || !message) return NextResponse.json({ ok: true })

    if (isDuplicate(msgId)) {
      console.log('[WA] duplicate skipped:', msgId)
      return NextResponse.json({ ok: true })
    }

    const logEntry = { phone, message, jid, msgId }
    console.log('[WA incoming]', logEntry)
    logToFile(logEntry)

    // Handle LAPOR TKT-xxx
    const laporMatch = message.match(LAPOR_PATTERN)
    console.log('[WA] LAPOR pattern match:', laporMatch)
    if (laporMatch) {
      console.log('[WA] Detected LAPOR command for tiketId:', laporMatch[1])
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
    console.log('[WA] Last laporan for', phone, lastLaporan?.tiketId ?? 'none')
    if (!lastLaporan) {
      await sendWhatsApp(phone, { message: msgReplyUnknown() })
      return NextResponse.json({ ok: true })
    }

    const { tiketId } = lastLaporan
    let reply = ''
    if (message === '1') reply = msgReply1(tiketId)
    else if (message === '2') reply = msgReply3(tiketId)
    else reply = msgReplyUnknown()

    await sendWhatsApp(phone, { message: reply })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/webhooks/wa]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
