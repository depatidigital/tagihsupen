import { prisma } from '@/lib/prisma'
import { getCachedJuaraMeter } from '@/lib/juara'
import { labelJuaraMeter, colorJuaraMeter } from '@/lib/utils'
import MeterShareCard from '@/components/share/MeterShareCard'

export const revalidate = 60

export default async function ShareMeterPage() {
  const since = new Date()
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [juaraMeter, totalBulanIni, totalSelesai, wargaAktif] = await Promise.all([
    getCachedJuaraMeter(),
    prisma.laporan.count({ where: { createdAt: { gte: since } } }),
    prisma.laporan.count({ where: { createdAt: { gte: since }, status: 'SELESAI' } }),
    prisma.warga.count({ where: { lastActive: { gte: since } } }),
  ])

  const now = new Date().toLocaleDateString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta',
  })

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <MeterShareCard
        score={juaraMeter}
        label={labelJuaraMeter(juaraMeter)}
        color={colorJuaraMeter(juaraMeter)}
        totalBulanIni={totalBulanIni}
        totalSelesai={totalSelesai}
        wargaAktif={wargaAktif}
        tanggal={now}
      />
    </div>
  )
}
