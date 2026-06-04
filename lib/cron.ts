import cron from 'node-cron'
import { prisma } from './prisma'
import { hitungJuaraMeter } from './juara'
import { sendWhatsApp } from './whatsapp'
import { msgEskalasi24, msgWeeklyDigest } from './messages'
import { isFirstTimeSend, logSend, JOB_KEYS } from './wa-log'

export async function checkStaleLaporan() {
  const cutoff24 = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const stale = await prisma.laporan.findMany({
    where: {
      status: { in: ['DITERIMA', 'DITERUSKAN'] },
      createdAt: { lte: cutoff24 },
    },
  })

  for (const laporan of stale) {
    const alreadySent = !(await isFirstTimeSend(laporan.whatsapp, JOB_KEYS.ESKALASI_24))
    if (alreadySent) continue

    await sendWhatsApp(laporan.whatsapp, msgEskalasi24({ tiketId: laporan.tiketId }))
    await logSend(laporan.whatsapp, JOB_KEYS.ESKALASI_24, laporan.id)
  }
}

export async function sendWeeklyDigest() {
  const since = new Date()
  since.setDate(since.getDate() - 7)

  const [totalMasuk, totalSelesai, totalProses, juaraMeter] = await Promise.all([
    prisma.laporan.count({ where: { createdAt: { gte: since } } }),
    prisma.laporan.count({ where: { createdAt: { gte: since }, status: 'SELESAI' } }),
    prisma.laporan.count({
      where: { createdAt: { gte: since }, status: { in: ['DITERIMA', 'DITERUSKAN', 'DIPROSES'] } },
    }),
    hitungJuaraMeter(),
  ])

  const lokasiGroup = await prisma.laporan.groupBy({
    by: ['lokasi'],
    where: { createdAt: { gte: since } },
    _count: { lokasi: true },
    orderBy: { _count: { lokasi: 'desc' } },
    take: 1,
  })

  const lokasiTeratas = lokasiGroup[0]?.lokasi ?? 'Berbagai lokasi'
  const laporanTeratas = lokasiGroup[0]?._count.lokasi ?? 0

  const wargaAktif = await prisma.warga.findMany({
    where: { lastActive: { gte: since } },
    orderBy: { totalLaporan: 'desc' },
  })

  for (const warga of wargaAktif) {
    const kontribusi = await prisma.laporan.count({
      where: { whatsapp: warga.whatsapp, createdAt: { gte: since } },
    })

    const rank = wargaAktif.findIndex((w) => w.id === warga.id) + 1
    const topPersen = Math.round((rank / wargaAktif.length) * 100)

    await sendWhatsApp(
      warga.whatsapp,
      msgWeeklyDigest({
        totalMasuk,
        totalSelesai,
        totalProses,
        kontribusi,
        topPersen,
        lokasiteratas: lokasiTeratas,
        laporanTeratas,
        juaraMeter,
      })
    )
  }
}

export async function updateJuaraMeter() {
  const skor = await hitungJuaraMeter()
  await prisma.setting.upsert({
    where: { key: 'juara_meter' },
    update: { value: String(skor) },
    create: { key: 'juara_meter', value: String(skor) },
  })
}

export function startCronJobs() {
  cron.schedule('0 * * * *', checkStaleLaporan)
  cron.schedule('0 10 * * 5', sendWeeklyDigest)
  cron.schedule('*/5 * * * *', updateJuaraMeter)
  console.log('[CRON] Jobs started (TZ=Asia/Jakarta)')
}
