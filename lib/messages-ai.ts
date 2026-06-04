import OpenAI from 'openai'
import { msgKonfirmasi } from './messages'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Kamu asisten pemerintah kota Sungai Penuh untuk sistem laporan warga "TagihSupen".
Tulis pesan WhatsApp konfirmasi laporan. Gaya: hangat, informal, singkat, seperti teman bicara — bukan surat resmi.
Gunakan bahasa Indonesia sehari-hari. Maksimal 2 emoji. Jangan lebay. Jangan pakai kata "kami" berulang.`

export async function msgKonfirmasiAI(vars: {
  nama: string
  tiketId: string
  lokasi: string
  kategori: string
  tanggal: string
  jam: string
  wargaKe: number
}): Promise<string> {
  try {
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 280,
      temperature: 0.85,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: `Buat pesan WhatsApp konfirmasi laporan warga. Gaya: teman bicara, bukan surat resmi. Singkat.

Data:
- Nama panggilan: ${vars.nama}
- Warga ke-${vars.wargaKe} lapor hari ini (ini penting, tunjukkan di awal)
- Lokasi: ${vars.lokasi}
- Masalah: ${vars.kategori}
- Tiket: ${vars.tiketId}
- Waktu: ${vars.tanggal} ${vars.jam}

Framing: suara mereka penting, ada banyak warga lain yang peduli, dinas akan dituntut bertanggung jawab.

Akhiri SELALU dengan baris ini persis (jangan ubah):
Balas:
1 — Cek status
2 — Share ke teman`,
        },
      ],
    })

    return res.choices[0]?.message?.content?.trim() ?? msgKonfirmasi(vars)
  } catch (err) {
    console.error('[msgKonfirmasiAI] fallback to static:', err)
    return msgKonfirmasi(vars)
  }
}
