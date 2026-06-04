export interface WaSendOptions {
  message: string
  priority?: 'low' | 'medium' | 'high'
  callbackUrl?: string
  name?: string
}

export interface WaSendResult {
  ok: boolean
  messageUuid?: string
  id?: string
  error?: string
}

export interface WaConfig {
  baseUrl: string
  appId: string
  secretKey: string
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return '62' + digits.slice(1)
  if (digits.startsWith('62')) return digits
  return digits
}

function getWaConfig(): WaConfig | null {
  const baseUrl   = (process.env.WA_API_URL    || '').replace(/\/+$/, '')
  const appId     = process.env.WA_APP_ID     || ''
  const secretKey = process.env.WA_SECRET_KEY || ''
  if (!baseUrl || !appId || !secretKey) return null
  return { baseUrl, appId, secretKey }
}

export async function sendWhatsApp(
  phone: string,
  options: WaSendOptions
): Promise<WaSendResult> {
  const config = getWaConfig()
  if (!config) {
    console.error('sendWhatsApp: WA config missing (check Pengaturan Aplikasi)')
    return { ok: false, error: 'WA config missing' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  try {
    const body: Record<string, string> = {
      phone: normalizePhone(phone),
      message: options.message,
      priority: options.priority ?? 'medium',
    }
    if (options.callbackUrl) body.callbackUrl = options.callbackUrl

    const res = await fetch(`${config.baseUrl}/public/wa/v1/applications/${config.appId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': config.secretKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const json = await res.json()

    if (!res.ok || !json.ok) {
      console.error('sendWhatsApp error:', json)
      return { ok: false, error: json.error ?? `HTTP ${res.status}` }
    }

    return { ok: true, messageUuid: json.messageUuid, id: json.id }
  } catch (e: any) {
    clearTimeout(timeoutId)
    const msg = e.name === 'AbortError' ? 'timeout' : (e.message ?? 'unknown')
    console.error('sendWhatsApp failed:', msg)
    return { ok: false, error: msg }
  }
}

export async function sendWhatsAppJid(
  jid: string,
  options: WaSendOptions
): Promise<WaSendResult> {
  const config = getWaConfig()
  if (!config) {
    console.error('sendWhatsAppJid: WA config missing')
    return { ok: false, error: 'WA config missing' }
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15_000)

  try {
    const body: Record<string, string> = {
      jid,
      message: options.message,
      priority: options.priority ?? 'medium',
    }
    if (options.callbackUrl) body.callbackUrl = options.callbackUrl

    const res = await fetch(`${config.baseUrl}/public/wa/v1/applications/${config.appId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-secret-key': config.secretKey,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)
    const json = await res.json()

    if (!res.ok || !json.ok) {
      console.error('sendWhatsAppJid error:', json)
      return { ok: false, error: json.error ?? `HTTP ${res.status}` }
    }

    return { ok: true, messageUuid: json.messageUuid, id: json.id }
  } catch (e: any) {
    clearTimeout(timeoutId)
    const msg = e.name === 'AbortError' ? 'timeout' : (e.message ?? 'unknown')
    console.error('sendWhatsAppJid failed:', msg)
    return { ok: false, error: msg }
  }
}


export interface DryRunEntry {
  phone: string
  originalPhone: string
  message: string
  name?: string
}

export function createSender(testPhone?: string, dryRunCollector?: DryRunEntry[]) {
  return async (phone: string, options: WaSendOptions): Promise<WaSendResult> => {
    if (dryRunCollector !== undefined) {
      dryRunCollector.push({ phone: testPhone ?? phone, originalPhone: phone, message: options.message, name: options.name })
      return { ok: true }
    }

    if (testPhone) {
      const prefixed = `[TEST → ${phone}]\n\n${options.message}`
      return sendWhatsApp(testPhone, { ...options, message: prefixed })
    }
    return sendWhatsApp(phone, options)
  }
}
