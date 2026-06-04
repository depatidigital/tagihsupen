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
    <div className="relative w-full" style={{ height: 'calc(100svh - 57px)' }}>
      <div className="absolute top-4 left-4 z-[500] bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-lg pointer-events-none">
        <h1 className="text-base font-extrabold text-primary leading-tight">Peta Laporan</h1>
        <p className="text-xs text-gray-500 mt-0.5">{pins.length} laporan aktif · Sungai Penuh</p>
      </div>
      <PetaLaporan pins={pins} />
    </div>
  )
}
