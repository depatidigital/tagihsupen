import { prisma } from './prisma'

export function generateTiketId(sequence: number): string {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(3, '0')
  return `TGSP-${dd}${mm}-${seq}`
}

export async function nextTiketId(): Promise<string> {
  const today = new Date()
  const dd = String(today.getDate()).padStart(2, '0')
  const mm = String(today.getMonth() + 1).padStart(2, '0')
  const prefix = `TGSP-${dd}${mm}-`

  const last = await prisma.laporan.findFirst({
    where: { tiketId: { startsWith: prefix } },
    orderBy: { tiketId: 'desc' },
  })

  const seq = last ? parseInt(last.tiketId.split('-')[2]) + 1 : 1
  return generateTiketId(seq)
}
