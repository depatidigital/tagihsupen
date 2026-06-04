import { NextRequest, NextResponse } from 'next/server'
import { Kategori } from '@prisma/client'

const VALID = new Set(Object.values(Kategori))

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI tidak dikonfigurasi' }, { status: 500 })
    }

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 150,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                  detail: 'low',
                },
              },
              {
                type: 'text',
                text: `Ini foto keluhan warga kota Indonesia. Klasifikasikan ke salah satu:
- SAMPAH: sampah, kebersihan, tumpukan limbah
- JALAN: jalan rusak, berlubang, aspal rusak
- DRAINASE: saluran air tersumbat, banjir, got mampet
- PENERANGAN: lampu jalan mati, area gelap
- PASAR: ketertiban pasar, PKL liar, area kumuh pasar
- LAINNYA: selain kategori di atas

Jawab HANYA JSON: {"kategori":"NAMA_KATEGORI","alasan":"1 kalimat singkat"}`,
              },
            ],
          },
        ],
      }),
    })

    if (!res.ok) throw new Error(`OpenAI ${res.status}`)

    const json = await res.json()
    const content = json.choices?.[0]?.message?.content?.trim() ?? ''
    const match = content.match(/\{[\s\S]*?\}/)
    if (!match) throw new Error('Format AI tidak valid')

    const parsed = JSON.parse(match[0])
    if (!VALID.has(parsed.kategori)) throw new Error(`Kategori tidak dikenal: ${parsed.kategori}`)

    return NextResponse.json({
      kategori: parsed.kategori as Kategori,
      alasan: String(parsed.alasan ?? ''),
    })
  } catch (err) {
    console.error('[POST /api/analyze-foto]', err)
    return NextResponse.json({ error: 'Gagal menganalisa foto' }, { status: 500 })
  }
}
