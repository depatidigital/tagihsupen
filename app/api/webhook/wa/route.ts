import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWhatsApp } from '@/lib/whatsapp'
import { msgReply1, msgReply2, msgReply3, msgReplyUnknown } from '@/lib/messages'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const phone: string = body.phone ?? body.from ?? ''
    const message: string = (body.message ?? body.text ?? '').trim()

    if (!phone || !message) return NextResponse.json({ ok: true })

    const normalized = phone.replace(/\D/g, '').replace(/^62/, '0')

    const lastLaporan = await prisma.laporan.findFirst({
      where: { whatsapp: { in: [normalized, phone] } },
      orderBy: { createdAt: 'desc' },
    })

    if (!lastLaporan) {
      await sendWhatsApp(phone, msgReplyUnknown())
      return NextResponse.json({ ok: true })
    }

    const { tiketId } = lastLaporan

    let reply = ''
    if (message === '1') reply = msgReply1(tiketId)
    else if (message === '2') reply = msgReply2(tiketId)
    else if (message === '3') reply = msgReply3(tiketId)
    else reply = msgReplyUnknown()

    await sendWhatsApp(phone, reply)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[POST /api/webhook/wa]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
