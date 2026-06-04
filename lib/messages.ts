import { renderTemplate } from './wa-template'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tagihsupen.id'

export function msgKonfirmasi(vars: {
  nama: string
  tiketId: string
  lokasi: string
  kategori: string
  tanggal: string
  jam: string
  wargaKe: number
}): string {
  return `${vars.nama}, suaramu nomor *${vars.wargaKe}* hari ini. ✊

Laporan resmi masuk:
📍 ${vars.lokasi}
🗂️ ${vars.kategori}
🎫 ${vars.tiketId} · ${vars.tanggal} ${vars.jam}

Kalau 48 jam tidak ada respons dari dinas, kita tagih bareng.

Balas:
1 — Cek status
2 — Share ke teman`
}

export function msgDiteruskan(vars: {
  tiketId: string
  dinas: string
}): string {
  return `📬 *${vars.tiketId}* masuk meja *${vars.dinas}* Kota Sungai Penuh.

Mereka punya 48 jam. Jam mulai sekarang. ⏱

Makin banyak yang tahu, makin cepat ditangani — share ke teman atau grup RT kamu.`
}

export function msgEskalasi24(vars: { tiketId: string }): string {
  return `⏰ Sudah 24 jam...

Laporan ${vars.tiketId} belum ditangani.

Kami sudah kirim pengingat ke dinas terkait. Jika 24 jam ke depan belum ada update, laporan ini naik ke level Wako langsung.

Terima kasih sudah sabar. Suaramu penting. 💪`
}

export function msgDiproses(vars: { tiketId: string }): string {
  return `⚡ Kabar baik!

Dinas terkait mulai menangani laporan ${vars.tiketId}.

Masih sabar ya — kamu udah bantu Supen selangkah lebih dekat ke Juara. 🏆`
}

export function msgSelesai(vars: {
  tiketId: string
  jamDitangani: number
  dinas: string
  lokasi: string
  totalSelesai: number
}): string {
  return `✅ Beres!

📋 ${vars.tiketId} — SELESAI
⏱️ Ditangani dalam: ${vars.jamDitangani} jam
👷 Oleh: ${vars.dinas}

${vars.lokasi} sekarang lebih baik — karena kamu yang pertama bersuara.

🎖️ Badge kamu: "Warga Peduli" (${vars.totalSelesai} laporan selesai)

Share yuk 👉 ${APP_URL}/tiket/${vars.tiketId}

Satu langkah lagi menuju Sungai Penuh Juara. 🏆`
}

export function msgWeeklyDigest(vars: {
  totalMasuk: number
  totalSelesai: number
  totalProses: number
  kontribusi: number
  topPersen: number
  lokasiteratas: string
  laporanTeratas: number
  juaraMeter: number
}): string {
  return `📊 Supen minggu ini:

${vars.totalMasuk} laporan masuk
${vars.totalSelesai} selesai ✅
${vars.totalProses} masih proses ⏳

Kontribusimu: ${vars.kontribusi} laporan minggu ini 🎯
Kamu di top ${vars.topPersen}% warga paling aktif bulan ini.

Titik paling banyak dilaporkan: ${vars.lokasiteratas} (${vars.laporanTeratas} laporan)

Juara Meter minggu ini: ${vars.juaraMeter}% 🏆`
}

export function msgReplyUnknown(): string {
  return `Halo! Balas 1, 2, atau 3. Info lengkap: tagihsupen.id`
}

export function msgReply1(tiketId: string): string {
  return `Status terbaru laporan kamu:\n${APP_URL}/tiket/${tiketId}`
}

export function msgReply2(tiketId: string): string {
  return `Tambah detail atau foto di sini:\n${APP_URL}/tiket/${tiketId}?tambah=1`
}

export function msgReply3(tiketId: string): string {
  return `Bagikan laporan kamu:\n${APP_URL}/tiket/${tiketId}\n\nSupen butuh lebih banyak warga yang bersuara! 💪`
}
