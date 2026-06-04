export const WA_KEYS = {
  KONFIRMASI: 'konfirmasi',
  DITERUSKAN: 'diteruskan',
  ESKALASI_24: 'eskalasi_24',
  DIPROSES: 'diproses',
  SELESAI: 'selesai',
  WEEKLY_DIGEST: 'weekly_digest',
  REPLY_UNKNOWN: 'reply_unknown',
} as const

export function firstName(nama: string): string {
  return nama.trim().split(' ')[0]
}

export function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\[(\w+)\]/g, (_, key) => vars[key] ?? `[${key}]`)
}
