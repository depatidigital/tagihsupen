import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import {
  KATEGORI_LABEL, KATEGORI_EMOJI, KATEGORI_DINAS,
  STATUS_LABEL, STATUS_COLOR, formatTanggal, formatJam,
} from '@/lib/utils'
import { Status } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { sendWhatsApp } from '@/lib/whatsapp'
import { msgDiteruskan, msgDiproses, msgSelesai } from '@/lib/messages'
import { isFirstTimeSend, logSend, JOB_KEYS } from '@/lib/wa-log'

async function updateStatus(id: string, formData: FormData) {
  'use server'
  const status = formData.get('status') as Status
  const catatan = (formData.get('catatan') as string) || undefined

  const updated = await prisma.laporan.update({
    where: { id },
    data: {
      status,
      catatanAdmin: catatan,
      selesaiAt: status === 'SELESAI' ? new Date() : undefined,
      riwayat: { create: { status, catatan } },
    },
  })

  // Send WA notification
  const { whatsapp, tiketId, kategori, lokasi, createdAt, selesaiAt } = updated

  try {
    if (status === 'DITERUSKAN' && (await isFirstTimeSend(whatsapp, JOB_KEYS.DITERUSKAN))) {
      await sendWhatsApp(whatsapp, { message: msgDiteruskan({ tiketId, dinas: KATEGORI_DINAS[kategori] }) })
      await logSend(whatsapp, JOB_KEYS.DITERUSKAN, id)
    }
    if (status === 'DIPROSES' && (await isFirstTimeSend(whatsapp, JOB_KEYS.DIPROSES))) {
      await sendWhatsApp(whatsapp, { message: msgDiproses({ tiketId }) })
      await logSend(whatsapp, JOB_KEYS.DIPROSES, id)
    }
    if (status === 'SELESAI' && (await isFirstTimeSend(whatsapp, JOB_KEYS.SELESAI))) {
      const jamDitangani = selesaiAt
        ? Math.round((selesaiAt.getTime() - createdAt.getTime()) / (1000 * 60 * 60))
        : 0
      const warga = await prisma.warga.findUnique({ where: { whatsapp } })
      await sendWhatsApp(
        whatsapp,
        msgSelesai({
          tiketId,
          jamDitangani,
          dinas: KATEGORI_DINAS[kategori],
          lokasi,
          totalSelesai: (warga?.totalSelesai ?? 0) + 1,
        })
      )
      await logSend(whatsapp, JOB_KEYS.SELESAI, id)
      await prisma.warga.update({
        where: { whatsapp },
        data: { totalSelesai: { increment: 1 }, badge: { push: 'Warga Peduli' } },
      })
    }
  } catch (e) {
    console.error('[WA admin update]', e)
  }

  revalidatePath(`/admin/${id}`)
  revalidatePath(`/tiket/${tiketId}`)
  revalidatePath('/')
}

export default async function AdminDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const jar = await cookies()
  if (jar.get('admin_auth')?.value !== 'ok') redirect('/admin')

  const { id } = await params
  const laporan = await prisma.laporan.findUnique({
    where: { id },
    include: { riwayat: { orderBy: { createdAt: 'asc' } } },
  })

  if (!laporan) notFound()

  const updateThisStatus = updateStatus.bind(null, id)

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
    <div className="py-6 space-y-4">
      <Link href="/admin" className="text-sm text-primary font-medium">← Kembali</Link>

      <div className="card">
        <p className="text-xs font-mono text-gray-400">{laporan.tiketId}</p>
        <h1 className="text-xl font-extrabold text-primary mt-1">
          {KATEGORI_EMOJI[laporan.kategori]} {KATEGORI_LABEL[laporan.kategori]}
        </h1>
        <p className="text-sm text-gray-600">📍 {laporan.lokasi}</p>
        <p className="text-sm text-gray-600 mt-1">👤 {laporan.nama} · {laporan.whatsapp}</p>
        <p className="text-xs text-gray-400 mt-1">
          {formatTanggal(laporan.createdAt)} · {formatJam(laporan.createdAt)} WIB
        </p>
      </div>

      <div className="card">
        <h2 className="font-bold text-sm mb-2">Deskripsi</h2>
        <p className="text-sm text-gray-700">{laporan.deskripsi}</p>
      </div>

      {laporan.foto.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-sm mb-3">Foto Laporan</h2>
          <div className="grid grid-cols-3 gap-2">
            {laporan.foto.map((url, i) => (
              <div key={i} className="aspect-square relative rounded-xl overflow-hidden">
                <Image src={url} alt={`Foto ${i + 1}`} fill className="object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="font-bold text-sm mb-3">Update Status</h2>
        <form action={updateThisStatus} className="space-y-3">
          <select name="status" defaultValue={laporan.status} className="input">
            {(['DITERIMA', 'DITERUSKAN', 'DIPROSES', 'SELESAI', 'DITOLAK'] as Status[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <textarea
            name="catatan"
            className="input resize-none"
            placeholder="Catatan internal (opsional)"
            defaultValue={laporan.catatanAdmin ?? ''}
          />
          <button type="submit" className="btn-primary w-full">Simpan</button>
        </form>
      </div>

      <div className="card">
        <h2 className="font-bold text-sm mb-3">Riwayat</h2>
        <div className="space-y-3">
          {laporan.riwayat.map((r) => (
            <div key={r.id} className="flex gap-3 text-sm">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 h-fit"
                style={{ backgroundColor: STATUS_COLOR[r.status] }}
              >
                {STATUS_LABEL[r.status]}
              </span>
              <div>
                <p className="text-xs text-gray-400">
                  {formatTanggal(r.createdAt)} · {formatJam(r.createdAt)} WIB
                </p>
                {r.catatan && <p className="text-sm text-gray-600 mt-0.5">{r.catatan}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}
