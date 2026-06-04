import { prisma } from './prisma'

export async function hitungJuaraMeter(): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const [total, selesai, rataRataRaw, terlambat] = await Promise.all([
    prisma.laporan.count({ where: { createdAt: { gte: since } } }),
    prisma.laporan.count({ where: { createdAt: { gte: since }, status: 'SELESAI' } }),
    prisma.laporan.aggregate({
      where: { createdAt: { gte: since }, status: 'SELESAI', selesaiAt: { not: null } },
      _avg: { updatedAt: false } as never,
    }),
    prisma.laporan.count({
      where: {
        status: { in: ['DITERIMA', 'DITERUSKAN'] },
        createdAt: { lte: new Date(Date.now() - 72 * 60 * 60 * 1000) },
      },
    }),
  ])

  if (total === 0) return 100

  const selesaiDenganWaktu = await prisma.laporan.findMany({
    where: { createdAt: { gte: since }, status: 'SELESAI', selesaiAt: { not: null } },
    select: { createdAt: true, selesaiAt: true },
  })

  let rataRataJam = 999
  if (selesaiDenganWaktu.length > 0) {
    const totalMs = selesaiDenganWaktu.reduce(
      (acc, l) => acc + (l.selesaiAt!.getTime() - l.createdAt.getTime()),
      0
    )
    rataRataJam = totalMs / selesaiDenganWaktu.length / (1000 * 60 * 60)
  }

  let skor = (selesai / total) * 100
  if (rataRataJam < 24) skor += 5
  skor -= terlambat * 3

  return Math.max(0, Math.min(100, Math.round(skor)))
}

export function labelJuaraMeter(skor: number): string {
  if (skor >= 80) return 'Sungai Penuh Makin Juara 🏆'
  if (skor >= 60) return 'Terus Bergerak 💪'
  return 'Butuh Tindakan Segera ⚠️'
}

export function colorJuaraMeter(skor: number): string {
  if (skor >= 80) return '#1B4332'
  if (skor >= 60) return '#F5C842'
  return '#EF4444'
}

export async function getCachedJuaraMeter(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: 'juara_meter' } })
  if (setting) return parseInt(setting.value)
  return hitungJuaraMeter()
}
