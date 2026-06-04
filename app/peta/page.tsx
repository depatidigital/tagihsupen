import { prisma } from '@/lib/prisma'
import PetaLaporan from '@/components/PetaLaporan'

export const revalidate = 60

export default async function PetaPage() {
  const laporan = await prisma.laporan.findMany({
    where: {
      status: { not: 'DITOLAK' },
      lat: { not: null },
      lng: { not: null },
    },
    select: {
      id: true,
      tiketId: true,
      kategori: true,
      lokasi: true,
      status: true,
      lat: true,
      lng: true,
      createdAt: true,
    },
  })

  const pins = laporan.map((l) => ({
    id: l.id,
    tiketId: l.tiketId,
    kategori: l.kategori,
    lokasi: l.lokasi,
    status: l.status,
    lat: l.lat!,
    lng: l.lng!,
    tanggal: l.createdAt.toISOString(),
  }))

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
    <div className="py-6">
      <h1 className="text-2xl font-extrabold text-primary mb-1">Peta Laporan</h1>
      <p className="text-sm text-gray-500 mb-4">
        {pins.length} laporan aktif di Sungai Penuh
      </p>
      <div className="rounded-2xl overflow-hidden border border-gray-100" style={{ height: '70vh' }}>
        <PetaLaporan pins={pins} />
      </div>
    </div>
    </div>
  )
}
