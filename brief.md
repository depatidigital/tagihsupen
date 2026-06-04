# BRIEF — TAGIH SUPEN

## Nama Produk
**Tagih Supen**
Tagline: *"Warga Bersuara, Sungai Penuh Bergerak."*
Sub-tagline: *"Karena Juara Dimulai dari Warganya."*

---

## Visi Produk

Platform pelaporan masalah kota berbasis web + WhatsApp automation yang:
- Terasa **personal** — bukan form pengaduan biasa
- Terasa **milik warga Sungai Penuh** — bukan platform dari luar
- Menghasilkan **tekanan elegan** ke pemerintah — tanpa konfrontatif
- Terhubung dengan visi **"Sungai Penuh Juara"** Walikota Alfin

---

## Stack Teknologi

- **Frontend:** Next.js 16 (App Router)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Storage foto:** IDCloudHost S3 (presigned URL upload, endpoint: is3.cloudhost.id)
- **WhatsApp:** semata-api (HTTP gateway, no Baileys/PM2)
- **Cron:** node-cron (PM2 worker terpisah, `TZ=Asia/Jakarta`)
- **OG Image:** Satori
- **Map:** Leaflet.js + OpenStreetMap (dynamic import, ssr: false)
- **Deployment:** VPS + PM2

---

## Fitur MVP

### 1. Form Laporan — `/lapor`

- Input wajib: nama, nomor WhatsApp, kategori, deskripsi, lokasi (dropdown preset + "lokasi lain")
- Input opsional: foto (maks 3, upload ke S3 via presigned URL)
- Setelah submit: halaman konfirmasi dengan nomor tiket dan kalimat personal:
  *"Kamu warga Supen ke-[N] yang bersuara hari ini. Terima kasih."*
- Tiket tersimpan di DB dengan status: `DITERIMA`

### 2. Status Tracker — `/tiket/[id]`

- Timeline visual perjalanan laporan
- Countdown: "Sudah X jam sejak dilaporkan"
  - Normal: abu-abu
  - >24 jam belum diproses: kuning
  - >48 jam belum diproses: merah
- Tombol share (generate kartu OG)
- Foto before/after jika sudah selesai

### 3. Homepage Dashboard — `/`

Widget utama yang wajib ada:

**Juara Meter** — progress bar besar di bagian atas
```
Formula: (laporan_selesai_30_hari / total_laporan_30_hari) × 100
Tampilan:
- 80–100: hijau — "Sungai Penuh Makin Juara 🏆"
- 60–79: kuning — "Terus Bergerak 💪"
- 0–59:  merah — "Butuh Tindakan Segera ⚠️"
```

**Statistik hari ini:**
- Total laporan masuk bulan ini
- Total laporan selesai
- Rata-rata waktu penanganan
- Warga aktif bulan ini

**Feed laporan terbaru** — 5 laporan terakhir dengan status

### 4. Peta Publik — `/peta`

- Semua laporan aktif tampil sebagai pin
- Warna pin: abu (diterima) → kuning (diproses) → hijau (selesai)
- Klik pin: popup kategori + tanggal + link tiket
- Cluster pin untuk area padat

### 5. WhatsApp Automation

Semua template pesan ada di `lib/messages.ts`.

**T+0: Konfirmasi diterima**
```
👋 Halo [Nama]!

Laporan kamu sudah kami terima.

📋 Tiket [ID]
📍 [Lokasi]
🗂️ [Kategori]
🕐 [Tanggal] · [Jam] WIB

Kami akan update kamu di sini setiap ada perkembangan. Suaramu sedang dalam perjalanan. 🚀

Balas:
1 — Cek status
2 — Tambah detail/foto
3 — Share ke teman
```

**T+1 jam: Diteruskan ke dinas**
```
📬 Update [ID]

Laporan kamu sudah diteruskan ke [Dinas] Kota Sungai Penuh.

Mereka punya waktu 2×24 jam untuk merespons. Kami pantau terus. 👀
```

**T+24 jam: Eskalasi otomatis**
```
⏰ Sudah 24 jam...

Laporan [ID] belum ditangani.

Kami sudah kirim pengingat ke dinas terkait. Jika 24 jam ke depan belum ada update, laporan ini naik ke level Wako langsung.

Terima kasih sudah sabar. Suaramu penting. 💪
```

**Status → DIPROSES**
```
⚡ Kabar baik!

Dinas terkait mulai menangani laporan [ID].

Masih sabar ya — kamu udah bantu Supen selangkah lebih dekat ke Juara. 🏆
```

**Status → SELESAI**
```
✅ Beres!

📋 [ID] — SELESAI
⏱️ Ditangani dalam: [X jam]
👷 Oleh: [Dinas]

[Lokasi] sekarang lebih baik — karena kamu yang pertama bersuara.

🎖️ Badge kamu: "Warga Peduli" ([N] laporan selesai)

Share yuk 👉 [URL tiket]

Satu langkah lagi menuju Sungai Penuh Juara. 🏆
```

**Weekly digest (Jumat 17.00 WIB)**
```
📊 Supen minggu ini:

[N] laporan masuk
[N] selesai ✅
[N] masih proses ⏳

Kontribusimu: [N] laporan minggu ini 🎯
Kamu di top [X]% warga paling aktif bulan ini.

Titik paling banyak dilaporkan: [Lokasi] ([N] laporan)

Juara Meter minggu ini: [X]% 🏆
```

**Interactive reply:**
- "1" → kirim link status tiket terakhir
- "2" → kirim link form tambah detail
- "3" → kirim teks siap-share + link tiket
- Lainnya → *"Halo! Balas 1, 2, atau 3. Info lengkap: tagihsupen.id"*

### 6. Admin Panel — `/admin`

Dilindungi middleware (cek `ADMIN_PASSWORD` dari env).

- Tabel laporan dengan filter: status, kategori, tanggal, lokasi
- Update status laporan (dropdown)
- Catatan internal per laporan
- Upload foto after (bukti penanganan)
- Statistik ringkas
- Export CSV laporan per periode

### 7. Kartu Shareable — `/api/og/[id]`

Generate Open Graph image dinamis via Satori:
- Logo Tagih Supen pojok kiri atas
- Nomor tiket + kategori + lokasi
- Status dengan warna
- Jika SELESAI: foto before/after side by side
- Footer: *"tagihsupen.id · Sungai Penuh Juara"*

---

## Database Schema (Prisma)

```prisma
model Laporan {
  id           String    @id @default(cuid())
  tiketId      String    @unique
  nama         String
  whatsapp     String
  kategori     Kategori
  deskripsi    String
  lokasi       String
  lat          Float?
  lng          Float?
  foto         String[]
  fotoAfter    String[]
  status       Status    @default(DITERIMA)
  catatanAdmin String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  selesaiAt    DateTime?
  riwayat      Riwayat[]
}

model Riwayat {
  id        String   @id @default(cuid())
  laporanId String
  laporan   Laporan  @relation(fields: [laporanId], references: [id])
  status    Status
  catatan   String?
  createdAt DateTime @default(now())
}

model Warga {
  id           String   @id @default(cuid())
  whatsapp     String   @unique
  nama         String
  totalLaporan Int      @default(0)
  totalSelesai Int      @default(0)
  badge        String[]
  lastActive   DateTime @default(now())
}

model WaConfig {
  id         String   @id @default(cuid())
  waApiUrl   String
  waAppId    String
  waSecretKey String
  waEnabled  Boolean  @default(true)
  updatedAt  DateTime @updatedAt
}

model Setting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt
}

enum Status {
  DITERIMA
  DITERUSKAN
  DIPROSES
  SELESAI
  DITOLAK
}

enum Kategori {
  SAMPAH
  JALAN
  DRAINASE
  PENERANGAN
  PASAR
  LAINNYA
}
```

---

## Kategori & Dinas

| Kategori | Label | Emoji | Dinas |
|----------|-------|-------|-------|
| SAMPAH | Sampah & Kebersihan | 🗑️ | Dinas LH |
| JALAN | Jalan Rusak | 🚧 | Dinas PU |
| DRAINASE | Saluran Air | 💧 | Dinas PU |
| PENERANGAN | Lampu Jalan | 💡 | Dinas PU |
| PASAR | Ketertiban Pasar | 🏪 | Dinas Perdagangan |
| LAINNYA | Lainnya | 📋 | Sekretariat |

---

## Lokasi Preset

```typescript
export const LOKASI_PRESET = [
  "Pasar Baru Sungai Penuh",
  "Pasar Tradisional",
  "Terminal Sungai Penuh",
  "Alun-alun Kota",
  "Jalan Depati Parbo",
  "Jalan Ahmad Yani",
  "Kawasan Danau Kerinci",
  "Jalan Prof. M. Yamin",
  "Simpang Tiga Gedang",
  "Lokasi Lain (isi manual)",
]
```

---

## Format Nomor Tiket

```typescript
// Format: TGSP-[DDMM]-[sequence 3 digit]
// Contoh: TGSP-0406-001
function generateTiketId(sequence: number): string {
  const now = new Date()
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const seq = String(sequence).padStart(3, '0')
  return `TGSP-${dd}${mm}-${seq}`
}
```

---

## Formula Juara Meter

```typescript
function hitungJuaraMeter(): number {
  const selesai = laporan_selesai_30_hari
  const total = total_laporan_30_hari

  if (total === 0) return 100

  let skor = (selesai / total) * 100

  // Bonus: rata-rata penanganan < 24 jam
  if (rataRataJam < 24) skor += 5

  // Penalti: setiap laporan > 72 jam belum diproses
  skor -= laporanTerlambat * 3

  return Math.max(0, Math.min(100, Math.round(skor)))
}
```

---

## Struktur Folder

```
tagih-supen/
├── app/
│   ├── page.tsx                    # Homepage + Juara Meter
│   ├── lapor/page.tsx              # Form laporan
│   ├── tiket/[id]/page.tsx         # Status tracker
│   ├── peta/page.tsx               # Peta publik
│   ├── admin/
│   │   ├── page.tsx                # Dashboard admin
│   │   └── [id]/page.tsx           # Detail laporan
│   └── api/
│       ├── laporan/route.ts        # POST submit laporan
│       ├── laporan/[id]/route.ts   # PATCH update status
│       ├── og/[id]/route.ts        # OG image generator
│       ├── stats/route.ts          # Statistik publik
│       └── webhook/wa/route.ts     # Handle incoming WA
├── lib/
│   ├── prisma.ts                   # Prisma client
│   ├── whatsapp.ts                 # semata-api send helper (sendWhatsApp, createSender)
│   ├── wa-template.ts              # Template renderer + WA_KEYS constants
│   ├── wa-log.ts                   # Send log + isFirstTimeSend + JOB_KEYS
│   ├── messages.ts                 # Semua template pesan WA
│   ├── cron.ts                     # node-cron jobs (checkStale, weeklyDigest, updateJuara)
│   ├── tiket.ts                    # Generate nomor tiket
│   ├── juara.ts                    # Hitung Juara Meter
│   └── s3.ts                       # S3 upload helper
├── components/
│   ├── JuaraMeter.tsx              # Progress bar animasi
│   ├── StatusBadge.tsx
│   ├── LaporanCard.tsx
│   ├── Timeline.tsx
│   └── PetaLaporan.tsx             # Leaflet (dynamic import)
└── prisma/schema.prisma
```

---

## Environment Variables

```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tagihsupen.id
TZ=Asia/Jakarta

DATABASE_URL=postgresql://...

# IDCloudHost S3
S3_ENDPOINT=https://is3.cloudhost.id
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=depatidigital
S3_ROOT_DIR=tagihsupen
S3_PUBLIC_URL=https://is3.cloudhost.id/depatidigital/tagihsupen

# WhatsApp — semata-api (priority: DB tabel waConfig → env fallback)
WA_API_URL=...
WA_APP_ID=...
WA_SECRET_KEY=...
# Opsional: direct gateway
WA_GATEWAY_URL=...
WA_CLIENT_ID=...

ADMIN_PASSWORD=...
CRON_SECRET=...
```

---

## Cron Jobs

Dijalankan dengan **node-cron** di `lib/cron.ts`, via PM2 worker terpisah. `TZ=Asia/Jakarta` wajib di env.

```typescript
// lib/cron.ts
import cron from 'node-cron'

cron.schedule('0 * * * *',      checkStaleLaporan)   // setiap jam
cron.schedule('0 10 * * 5',     sendWeeklyDigest)    // Jumat 17.00 WIB (UTC+7 → 10.00 UTC)
cron.schedule('*/5 * * * *',    updateJuaraMeter)    // setiap 5 menit
```

| Job | Jadwal (cron) | Fungsi |
|-----|---------------|--------|
| `checkStaleLaporan` | `0 * * * *` | Cek laporan >24 jam, kirim WA eskalasi |
| `sendWeeklyDigest` | `0 10 * * 5` | Kirim ringkasan ke semua warga aktif |
| `updateJuaraMeter` | `*/5 * * * *` | Recalculate Juara Meter, cache di tabel `Setting` |

---

## Design Direction

- **Palet:** Hijau tua `#1B4332` sebagai primary + kuning `#F5C842` sebagai aksen + putih background
- **Font:** Plus Jakarta Sans (Google Fonts)
- **Mood:** Bersih, berani, milik warga — bukan govtech kaku
- **Mobile-first:** 90% user akses dari HP
- **Elemen khas:** Juara Meter selalu visible di homepage, warna berubah dinamis sesuai skor
- Setiap halaman ada **CTA "Lapor Sekarang"** yang prominent

---

## Catatan Penting untuk Claude Code

1. Semua komponen Leaflet harus `dynamic import` dengan `{ ssr: false }`
2. WA via semata-api HTTP — tidak perlu PM2/Baileys. Config di tabel `WaConfig` (priority) atau env fallback. Cache 5 menit.
3. Upload foto: client → S3 presigned URL langsung (tidak lewat server)
4. Admin auth: middleware sederhana cek env `ADMIN_PASSWORD`
5. Semua template WA di `lib/messages.ts` — jangan hardcode di route handler
6. Juara Meter di-cache di tabel `Setting` DB (key: `juara_meter`), di-update setiap 5 menit via cron
7. Gunakan `revalidatePath` setelah setiap update status laporan
8. `TZ=Asia/Jakarta` wajib ada di env agar jadwal node-cron tepat WIB

---

## Urutan Build (7 Hari)

| Hari | Target |
|------|--------|
| 1 | Setup Next.js 16 + Prisma + PostgreSQL + schema + migrations |
| 2 | Form laporan + upload foto S3 + halaman konfirmasi |
| 3 | Halaman tiket + timeline + admin panel |
| 4 | semata-api WA setup + semua template + trigger otomatis |
| 5 | Homepage + Juara Meter + statistik |
| 6 | Peta Leaflet + OG image generator + node-cron jobs |
| 7 | Polish UI + testing end-to-end + deploy VPS + PM2 |

---

*Tagih Supen — Warga Bersuara, Sungai Penuh Bergerak.*
*Dibangun oleh Depati Digital · Sungai Penuh, Jambi*
*Brief v3.0 · Juni 2026*
