import { prisma } from './prisma'

interface WaConfig {
  waApiUrl: string
  waAppId: string
  waSecretKey: string
  waEnabled: boolean
}

let configCache: WaConfig | null = null
let configCachedAt = 0
const CONFIG_TTL = 5 * 60 * 1000

async function getWaConfig(): Promise<WaConfig | null> {
  if (configCache && Date.now() - configCachedAt < CONFIG_TTL) return configCache

  const dbConfig = await prisma.waConfig.findFirst({ orderBy: { updatedAt: 'desc' } })
  if (dbConfig && dbConfig.waEnabled) {
    configCache = {
      waApiUrl: dbConfig.waApiUrl,
      waAppId: dbConfig.waAppId,
      waSecretKey: dbConfig.waSecretKey,
      waEnabled: dbConfig.waEnabled,
    }
    configCachedAt = Date.now()
    return configCache
  }

  if (process.env.WA_API_URL && process.env.WA_APP_ID && process.env.WA_SECRET_KEY) {
    configCache = {
      waApiUrl: process.env.WA_API_URL,
      waAppId: process.env.WA_APP_ID,
      waSecretKey: process.env.WA_SECRET_KEY,
      waEnabled: true,
    }
    configCachedAt = Date.now()
    return configCache
  }

  return null
}

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const config = await getWaConfig()
  if (!config) {
    console.warn('[WA] No config available, skipping send to', to)
    return false
  }

  const phone = to.replace(/\D/g, '').replace(/^0/, '62')

  try {
    const res = await fetch(`${config.waApiUrl}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-App-Id': config.waAppId,
        'X-Secret-Key': config.waSecretKey,
      },
      body: JSON.stringify({ phone, message }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[WA] Send failed:', res.status, err)
      return false
    }

    return true
  } catch (e) {
    console.error('[WA] Send error:', e)
    return false
  }
}

interface SenderOptions {
  dryRun?: boolean
  testPhone?: string
}

export function createSender(opts: SenderOptions = {}) {
  return async function send(
    to: string,
    message: string,
    greeting?: string
  ): Promise<boolean> {
    const target = opts.testPhone ?? to
    const fullMessage = greeting ? `${greeting}\n\n${message}` : message

    if (opts.dryRun) {
      console.log('[WA DRY-RUN] to:', target)
      console.log(fullMessage)
      return true
    }

    return sendWhatsApp(target, fullMessage)
  }
}
