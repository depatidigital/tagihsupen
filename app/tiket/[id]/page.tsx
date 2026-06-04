import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { KATEGORI_LABEL, STATUS_LABEL, STATUS_COLOR, formatTanggal, formatJam, jamSejak } from '@/lib/utils'
import { KATEGORI_ICON } from '@/lib/icons'
import { Status } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle2, MapPin, Clock, XCircle, Share2,
} from 'lucide-react'

const ALL_STATUSES: Status[] = ['DITERIMA', 'DITERUSKAN', 'DIPROSES', 'SELESAI']

function statusStep(status: Status): number {
  if (status === 'DITOLAK') return -1
  return ALL_STATUSES.indexOf(status)
}

export default async function TiketPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ baru?: string }>
}) {
  const { id } = await params
  const { baru } = await searchParams

  const laporan = await prisma.laporan.findFirst({
    where: { OR: [{ tiketId: id }, { id }] },
    include: { riwayat: { orderBy: { createdAt: 'asc' } } },
  })

  if (!laporan) notFound()

  const jam = jamSejak(laporan.createdAt)
  const urgencyColor =
    jam > 48 ? 'text-red-500' : jam > 24 ? 'text-yellow-500' : 'text-gray-400'

  const step = statusStep(laporan.status)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tagihsupen.id'
  const shareUrl = `${appUrl}/tiket/${laporan.tiketId}`

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
    <div className="py-6 space-y-4">
      {baru === '1' && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <CheckCircle2 size={32} className="text-green-500 mx-auto mb-1" />
          <p className="font-bold text-green-800">Laporan terkirim!</p>
          <p className="text-sm text-green-600 mt-1">Kamu akan dapat update via WhatsApp.</p>
        </div>
      )}

      {/* Header tiket */}
      <div className="card">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-xs text-gray-400 font-mono">{laporan.tiketId}</p>
            <h1 className="text-xl font-extrabold text-primary mt-1 flex items-center gap-2">
              {(() => { const Icon = KATEGORI_ICON[laporan.kategori]; return <Icon size={20} className="text-primary shrink-0" /> })()}
              {KATEGORI_LABEL[laporan.kategori]}
            </h1>
            <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
              <MapPin size={13} className="shrink-0" /> {laporan.lokasi}
            </p>
          </div>
          <span
            className="text-xs font-bold px-3 py-1.5 rounded-full text-white shrink-0"
            style={{ backgroundColor: STATUS_COLOR[laporan.status] }}
          >
            {STATUS_LABEL[laporan.status]}
          </span>
        </div>
        <p className={`text-xs mt-3 flex items-center gap-1 ${urgencyColor}`}>
          <Clock size={11} /> Sudah {jam} jam sejak dilaporkan
        </p>
      </div>

      {/* Timeline */}
      <div className="card">
        <h2 className="font-bold text-sm text-gray-700 mb-4">Perjalanan Laporan</h2>
        {laporan.status !== 'DITOLAK' ? (
          <div className="relative">
            {ALL_STATUSES.map((s, i) => {
              const done = i <= step
              const active = i === step
              const riwayatEntry = laporan.riwayat.find((r) => r.status === s)
              return (
                <div key={s} className="flex gap-3 pb-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-3 h-3 rounded-full mt-0.5 ${
                        active
                          ? 'ring-4 ring-primary ring-opacity-20'
                          : ''
                      }`}
                      style={{ backgroundColor: done ? STATUS_COLOR[s] : '#E5E7EB' }}
                    />
                    {i < ALL_STATUSES.length - 1 && (
                      <div className={`w-0.5 flex-1 mt-1 ${done && i < step ? 'bg-primary' : 'bg-gray-200'}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <p className={`text-sm font-semibold ${done ? 'text-gray-800' : 'text-gray-400'}`}>
                      {STATUS_LABEL[s]}
                    </p>
                    {riwayatEntry && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatTanggal(riwayatEntry.createdAt)} · {formatJam(riwayatEntry.createdAt)} WIB
                      </p>
                    )}
                    {riwayatEntry?.catatan && (
                      <p className="text-xs text-gray-600 mt-1">{riwayatEntry.catatan}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-sm text-red-500 flex items-start gap-2">
            <XCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              Laporan ditolak
              {laporan.catatanAdmin && <p className="text-gray-600 mt-1">{laporan.catatanAdmin}</p>}
            </div>
          </div>
        )}
      </div>

      {/* Deskripsi */}
      <div className="card">
        <h2 className="font-bold text-sm text-gray-700 mb-2">Deskripsi</h2>
        <p className="text-sm text-gray-700">{laporan.deskripsi}</p>
        <p className="text-xs text-gray-400 mt-2">
          Dilaporkan {formatTanggal(laporan.createdAt)} · {formatJam(laporan.createdAt)} WIB
        </p>
      </div>

      {/* Foto before */}
      {laporan.foto.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-sm text-gray-700 mb-3">Foto Laporan</h2>
          <div className="grid grid-cols-3 gap-2">
            {laporan.foto.map((url, i) => (
              <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-gray-100">
                <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Foto after — jika selesai */}
      {laporan.fotoAfter.length > 0 && (
        <div className="card border-green-200">
          <h2 className="font-bold text-sm text-green-700 mb-3 flex items-center gap-1.5"><CheckCircle2 size={14} /> Foto Sesudah Ditangani</h2>
          <div className="grid grid-cols-3 gap-2">
            {laporan.fotoAfter.map((url, i) => (
              <div key={i} className="aspect-square relative rounded-xl overflow-hidden bg-gray-100">
                <Image src={url} alt={`After ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Share */}
      <div className="card bg-primary text-white">
        <p className="font-bold mb-1">Bagikan laporan ini</p>
        <p className="text-sm text-green-200 mb-3">Makin banyak yang tahu, makin cepat ditangani.</p>
        <div className="flex gap-2">
          <input
            readOnly
            value={shareUrl}
            className="flex-1 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg px-3 py-2 text-sm text-white"
          />
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Laporan warga Sungai Penuh: ${shareUrl}`)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-accent shrink-0 text-sm py-2 px-3"
          >
            Share WA
          </a>
        </div>
      </div>

      <Link
        href={`/share/laporan/${laporan.tiketId}`}
        className="flex items-center justify-center gap-2 border-2 border-primary text-primary font-semibold py-3 rounded-2xl hover:bg-primary hover:text-white transition-all text-sm"
      >
        <Share2 size={15} /> Bagikan sebagai Kartu
      </Link>

      <Link href="/" className="block text-center text-sm text-primary font-medium py-2">
        ← Kembali ke beranda
      </Link>
    </div>
    </div>
  )
}
