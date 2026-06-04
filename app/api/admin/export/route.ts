import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { KATEGORI_LABEL, KATEGORI_DINAS, STATUS_LABEL, formatTanggal, formatJam } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const jar = await cookies()
  if (jar.get('admin_auth')?.value !== 'ok') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const laporan = await prisma.laporan.findMany({
    where: {
      ...(from && { createdAt: { gte: new Date(from) } }),
      ...(to && { createdAt: { lte: new Date(to) } }),
    },
    orderBy: { createdAt: 'desc' },
  })

  const header = ['Tiket', 'Nama', 'WhatsApp', 'Kategori', 'Dinas', 'Lokasi', 'Status', 'Deskripsi', 'Tanggal', 'Jam', 'Selesai'].join(',')

  const rows = laporan.map((l) =>
    [
      l.tiketId,
      `"${l.nama}"`,
      l.whatsapp,
      KATEGORI_LABEL[l.kategori],
      KATEGORI_DINAS[l.kategori],
      `"${l.lokasi}"`,
      STATUS_LABEL[l.status],
      `"${l.deskripsi.replace(/"/g, '""')}"`,
      formatTanggal(l.createdAt),
      formatJam(l.createdAt),
      l.selesaiAt ? formatTanggal(l.selesaiAt) : '',
    ].join(',')
  )

  const csv = [header, ...rows].join('\n')
  const filename = `tagihsupen-${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
