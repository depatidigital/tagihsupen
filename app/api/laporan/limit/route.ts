import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const DAILY_LIMIT = 5

export async function GET(req: NextRequest) {
  const wa = req.nextUrl.searchParams.get('wa')
  if (!wa || wa.length < 8) {
    return NextResponse.json({ error: 'Nomor tidak valid' }, { status: 400 })
  }
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const used = await prisma.laporan.count({
    where: { whatsapp: wa, createdAt: { gte: startOfDay } },
  })
  return NextResponse.json({ used, limit: DAILY_LIMIT, remaining: Math.max(0, DAILY_LIMIT - used) })
}
