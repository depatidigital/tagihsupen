import { prisma } from './prisma'

export const JOB_KEYS = {
  KONFIRMASI: 'konfirmasi',
  DITERUSKAN: 'diteruskan',
  ESKALASI_24: 'eskalasi_24',
  DIPROSES: 'diproses',
  SELESAI: 'selesai',
  WEEKLY_DIGEST: 'weekly_digest',
} as const

export type JobKey = (typeof JOB_KEYS)[keyof typeof JOB_KEYS]

export async function isFirstTimeSend(
  whatsapp: string,
  jobKey: JobKey
): Promise<boolean> {
  const existing = await prisma.waLog.findFirst({
    where: { whatsapp, jobKey },
  })
  return !existing
}

export async function logSend(
  whatsapp: string,
  jobKey: JobKey,
  laporanId?: string
): Promise<void> {
  await prisma.waLog.create({
    data: { whatsapp, jobKey, laporanId },
  })
}
