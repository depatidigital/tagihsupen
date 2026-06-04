import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { KATEGORI_LABEL, KATEGORI_EMOJI, STATUS_LABEL, STATUS_COLOR, formatTanggal } from '@/lib/utils'
import { Status } from '@prisma/client'
import LaporanShareCard from '@/components/share/LaporanShareCard'

const ALL_STATUSES: Status[] = ['DITERIMA', 'DITERUSKAN', 'DIPROSES', 'SELESAI']

export default async function ShareLaporanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const laporan = await prisma.laporan.findFirst({
    where: { OR: [{ tiketId: id }, { id }] },
  })
  if (!laporan) notFound()

  const stepIndex = laporan.status === 'DITOLAK' ? -1 : ALL_STATUSES.indexOf(laporan.status)

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center py-10 px-4">
      <LaporanShareCard
        tiketId={laporan.tiketId}
        emoji={KATEGORI_EMOJI[laporan.kategori]}
        kategori={KATEGORI_LABEL[laporan.kategori]}
        lokasi={laporan.lokasi}
        status={laporan.status}
        statusLabel={STATUS_LABEL[laporan.status]}
        statusColor={STATUS_COLOR[laporan.status]}
        stepIndex={stepIndex}
        allStatuses={ALL_STATUSES}
        statusLabels={STATUS_LABEL}
        tanggal={formatTanggal(laporan.createdAt)}
      />
    </div>
  )
}
