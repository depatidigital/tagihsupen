import { prisma } from '@/lib/prisma'
import { KATEGORI_LABEL, STATUS_LABEL, STATUS_COLOR, formatTanggal } from '@/lib/utils'
import { Status, Kategori } from '@prisma/client'
import Link from 'next/link'
import { cookies } from 'next/headers'

async function checkAuth() {
  const jar = await cookies()
  return jar.get('admin_auth')?.value === 'ok'
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kategori?: string; error?: string }>
}) {
  const authed = await checkAuth()
  const params = await searchParams
  if (!authed) return <LoginPage error={params.error === '1' ? 'Password salah' : undefined} />

  const where: Record<string, unknown> = {}

  if (params.status) where.status = params.status as Status
  if (params.kategori) where.kategori = params.kategori as Kategori

  const laporan = await prisma.laporan.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const stats = await prisma.laporan.groupBy({
    by: ['status'],
    _count: { status: true },
  })

  return (
    <div className="max-w-2xl mx-auto px-4 pb-16">
    <div className="py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-primary">Admin Panel</h1>
        <form action="/api/admin/logout" method="POST">
          <button className="text-xs text-gray-400 underline">Keluar</button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {stats.map((s) => (
          <div key={s.status} className="card text-center">
            <p className="text-xl font-extrabold" style={{ color: STATUS_COLOR[s.status] }}>
              {s._count.status}
            </p>
            <p className="text-xs text-gray-500">{STATUS_LABEL[s.status]}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['', 'DITERIMA', 'DITERUSKAN', 'DIPROSES', 'SELESAI', 'DITOLAK'] as const).map((s) => (
          <Link
            key={s}
            href={s ? `/admin?status=${s}` : '/admin'}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium ${
              params.status === s || (!params.status && !s)
                ? 'bg-primary text-white border-primary'
                : 'border-gray-200 text-gray-600'
            }`}
          >
            {s ? STATUS_LABEL[s] : 'Semua'}
          </Link>
        ))}
        <a
          href="/api/admin/export"
          className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 ml-auto"
        >
          Export CSV
        </a>
      </div>

      <div className="space-y-2">
        {laporan.map((l) => (
          <Link key={l.id} href={`/admin/${l.id}`}>
            <div className="card hover:border-primary transition-colors cursor-pointer">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-gray-400">{l.tiketId}</p>
                  <p className="font-semibold text-sm truncate mt-0.5">{l.nama}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {KATEGORI_LABEL[l.kategori]} · {l.lokasi}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full text-white"
                    style={{ backgroundColor: STATUS_COLOR[l.status] }}
                  >
                    {STATUS_LABEL[l.status]}
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{formatTanggal(l.createdAt)}</p>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {laporan.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">Tidak ada laporan</p>
        )}
      </div>
    </div>
    </div>
  )
}

function LoginPage({ error }: { error?: string }) {
  return (
    <div className="py-16 max-w-sm mx-auto">
      <h1 className="text-2xl font-extrabold text-primary mb-6 text-center">Admin</h1>
      <form action="/api/admin/login" method="POST" className="space-y-4">
        <input
          type="password"
          name="password"
          className="input"
          placeholder="Password admin"
          required
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button type="submit" className="btn-primary w-full">Masuk</button>
      </form>
    </div>
  )
}
