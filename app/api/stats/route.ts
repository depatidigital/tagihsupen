import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCachedJuaraMeter } from '@/lib/juara'

export async function GET() {
  const since = new Date()
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [total, selesai, wargaAktif, juaraMeter] = await Promise.all([
    prisma.laporan.count({ where: { createdAt: { gte: since } } }),
    prisma.laporan.count({ where: { createdAt: { gte: since }, status: 'SELESAI' } }),
    prisma.warga.count({ where: { lastActive: { gte: since } } }),
    getCachedJuaraMeter(),
  ])

  return NextResponse.json({ total, selesai, wargaAktif, juaraMeter })
}
