import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { KATEGORI_LABEL, KATEGORI_EMOJI, STATUS_LABEL, STATUS_COLOR, formatTanggal, formatJam } from '@/lib/utils'
import { Status } from '@prisma/client'
import Image from 'next/image'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

async function updateStatus(id: string, formData: FormData) {
  'use server'
  const status = formData.get('status') as Status
  const catatan = formData.get('catatan') as string

  const laporan = await prisma.laporan.update({
    where: { id },
    data: {
      status,
      catatanAdmin: catatan || undefined,
      selesaiAt: status === 'SELESAI' ? new Date() : undefined,
      riwayat: {
        create: { status, catatan: catatan || undefined },
      },
    },
  })

  // Trigger WA notification
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    await fetch(`${appUrl}/api/laporan/${laporan.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': process.env.CRON_SECRET ?? '',
      },
      body: JSON.stringify({ status }),
    })
  } catch {}

  revalidatePath(`/admin/${id}`)
  revalidatePath(`/tiket/${laporan.tiketId}`)
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
    <div className="py-6 space-y-4">
      <Link href="/admin" className="text-sm text-primary">← Kembali</Link>

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

      {/* Update status */}
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
          <button type="submit" className="btn-primary w-full">Simpan Update</button>
        </form>
      </div>

      {/* Riwayat */}
      <div className="card">
        <h2 className="font-bold text-sm mb-3">Riwayat</h2>
        <div className="space-y-2">
          {laporan.riwayat.map((r) => (
            <div key={r.id} className="flex gap-3 text-sm">
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full text-white shrink-0 h-fit"
                style={{ backgroundColor: STATUS_COLOR[r.status] }}
              >
                {STATUS_LABEL[r.status]}
              </span>
              <div>
                <p className="text-xs text-gray-400">{formatTanggal(r.createdAt)} · {formatJam(r.createdAt)} WIB</p>
                {r.catatan && <p className="text-sm text-gray-600">{r.catatan}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
