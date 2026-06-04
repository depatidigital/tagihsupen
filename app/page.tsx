import { prisma } from '@/lib/prisma'
import { getCachedJuaraMeter } from '@/lib/juara'
import { KATEGORI_LABEL, KATEGORI_EMOJI, STATUS_LABEL, STATUS_COLOR, formatTanggal, labelJuaraMeter, colorJuaraMeter } from '@/lib/utils'
import Link from 'next/link'

export const revalidate = 60

async function getStats() {
  const since = new Date()
  since.setDate(1)
  since.setHours(0, 0, 0, 0)

  const [totalBulanIni, totalSelesai, wargaAktif, laporanTerbaru, juaraMeter] = await Promise.all([
    prisma.laporan.count({ where: { createdAt: { gte: since } } }),
    prisma.laporan.count({ where: { createdAt: { gte: since }, status: 'SELESAI' } }),
    prisma.warga.count({ where: { lastActive: { gte: since } } }),
    prisma.laporan.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    getCachedJuaraMeter(),
  ])

  const selesaiDenganWaktu = await prisma.laporan.findMany({
    where: { createdAt: { gte: since }, status: 'SELESAI', selesaiAt: { not: null } },
    select: { createdAt: true, selesaiAt: true },
  })

  let rataJam = 0
  if (selesaiDenganWaktu.length > 0) {
    const totalMs = selesaiDenganWaktu.reduce(
      (acc, l) => acc + (l.selesaiAt!.getTime() - l.createdAt.getTime()),
      0
    )
    rataJam = Math.round(totalMs / selesaiDenganWaktu.length / (1000 * 60 * 60))
  }

  return { totalBulanIni, totalSelesai, wargaAktif, laporanTerbaru, juaraMeter, rataJam }
}

export default async function HomePage() {
  const { totalBulanIni, totalSelesai, wargaAktif, laporanTerbaru, juaraMeter, rataJam } =
    await getStats()

  const label = labelJuaraMeter(juaraMeter)
  const color = colorJuaraMeter(juaraMeter)

  return (
    <div className="py-6 space-y-6">
      {/* Juara Meter */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Juara Meter</p>
        <div className="flex items-end gap-3 mb-3">
          <span className="text-5xl font-extrabold" style={{ color }}>{juaraMeter}%</span>
          <span className="text-sm font-semibold text-gray-600 mb-1.5">{label}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div
            className="h-4 rounded-full transition-all duration-700"
            style={{ width: `${juaraMeter}%`, backgroundColor: color }}
          />
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Skor respons kota berdasarkan laporan warga 30 hari terakhir
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-primary">{totalBulanIni}</p>
          <p className="text-xs text-gray-500 mt-1">Laporan masuk bulan ini</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-green-700">{totalSelesai}</p>
          <p className="text-xs text-gray-500 mt-1">Laporan selesai</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-blue-600">{rataJam}j</p>
          <p className="text-xs text-gray-500 mt-1">Rata-rata penanganan</p>
        </div>
        <div className="card text-center">
          <p className="text-3xl font-extrabold text-accent">{wargaAktif}</p>
          <p className="text-xs text-gray-500 mt-1">Warga aktif bulan ini</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-primary rounded-2xl p-5 text-white text-center">
        <h2 className="text-lg font-extrabold mb-1">Ada yang perlu dilaporkan?</h2>
        <p className="text-sm text-green-200 mb-4">Suaramu bisa mengubah Sungai Penuh.</p>
        <Link href="/lapor" className="btn-accent inline-block">
          Lapor Sekarang
        </Link>
      </div>

      {/* Feed terbaru */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800">Laporan Terbaru</h2>
          <Link href="/peta" className="text-xs text-primary font-medium">
            Lihat peta →
          </Link>
        </div>
        <div className="space-y-2">
          {laporanTerbaru.map((l) => (
            <Link key={l.id} href={`/tiket/${l.tiketId}`}>
              <div className="card flex items-center gap-3 hover:border-primary transition-colors cursor-pointer">
                <span className="text-2xl">{KATEGORI_EMOJI[l.kategori]}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{KATEGORI_LABEL[l.kategori]}</p>
                  <p className="text-xs text-gray-500 truncate">{l.lokasi}</p>
                </div>
                <div className="text-right shrink-0">
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: STATUS_COLOR[l.status] }}
                  >
                    {STATUS_LABEL[l.status]}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatTanggal(l.createdAt)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
