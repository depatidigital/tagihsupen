# Tagih Supen

> *"Warga Bersuara, Sungai Penuh Bergerak."*

Platform pelaporan masalah kota untuk warga Sungai Penuh — lapor, pantau, dan buktikan bahwa suaramu punya dampak nyata.

---

## Masalah yang Diselesaikan

Selama ini laporan warga terasa seperti melempar kertas ke dalam kotak gelap.

- Tidak tahu apakah laporan didengar
- Tidak ada update status yang bisa dipantau
- Tidak tahu siapa yang bertanggung jawab
- Tidak ada bukti bahwa kota benar-benar berubah

Tagih Supen mengubah itu. Setiap laporan punya nomor tiket, timeline, dan notifikasi WA langsung ke HP kamu.

---

## Cara Pakai

### 1. Lapor
Buka `/lapor`, isi nama, nomor WA, kategori masalah, lokasi, dan deskripsi. Foto opsional (maks 3). Submit — selesai.

### 2. Pantau
Kamu langsung dapat nomor tiket dan konfirmasi di WhatsApp. Buka `/tiket/[id]` kapan saja untuk lihat status terbaru.

### 3. Dapat Update Otomatis
Tagih Supen kirim notifikasi WA di setiap tahap:
- Saat laporan diterima
- Saat diteruskan ke dinas
- Jika 24 jam belum ditangani (eskalasi otomatis)
- Saat mulai diproses
- Saat selesai — lengkap dengan badge "Warga Peduli"

### 4. Share
Setiap laporan punya kartu yang bisa dibagikan ke teman atau media sosial. Makin banyak yang tahu, makin cepat ditangani.

---

## Juara Meter

Di homepage ada satu angka: **Juara Meter** — skor respons kota berdasarkan data nyata dari laporan warga.

```
80–100% → "Sungai Penuh Makin Juara 🏆"
60–79%  → "Terus Bergerak 💪"
0–59%   → "Butuh Tindakan Segera ⚠️"
```

Setiap laporan yang selesai ditangani, angkanya naik. Kontribusimu terlihat.

---

## Untuk Pemerintah Kota

Tagih Supen bukan platform yang menantang — ini alat yang membantu.

Visi **"Sungai Penuh Juara"** butuh bukti yang bisa dipegang. Tagih Supen menyediakan data nyata: berapa laporan masuk, berapa yang tuntas, berapa lama rata-rata penanganan. Semua transparan, semua terukur.

Juara Meter di homepage adalah cermin publik kinerja kota. Skor tinggi = pemerintah responsif. Warga yang melaporkan masalah adalah warga yang masih percaya pemerintahnya bisa bergerak — bukan yang diam dan mengeluh di media sosial.

Jika ada pertanyaan atau ingin berkolaborasi resmi: **depatidigital.com**

---

## Kategori Laporan

| Kategori | Ditangani oleh |
|----------|----------------|
| Sampah & Kebersihan | Dinas LH |
| Jalan Rusak | Dinas PU |
| Saluran Air | Dinas PU |
| Lampu Jalan | Dinas PU |
| Ketertiban Pasar | Dinas Perdagangan |
| Lainnya | Sekretariat |

---

## Untuk Developer

### Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 16 (App Router) |
| Database | PostgreSQL |
| ORM | Prisma |
| Storage | IDCloudHost S3 |
| WhatsApp | semata-api HTTP gateway |
| Cron | node-cron |
| Map | Leaflet.js + OpenStreetMap |
| OG Image | Satori |
| Deployment | VPS + PM2 |

### Setup

```bash
cp .env.example .env
# Isi variabel di .env

pnpm install
pnpm prisma migrate dev
pnpm dev
```

### Struktur Folder

```
app/          → halaman (lapor, tiket, peta, admin, api)
lib/          → logic: whatsapp, s3, prisma, juara meter, tiket, cron
components/   → UI: JuaraMeter, Timeline, PetaLaporan, dll
prisma/       → schema database
```

---

*Dibangun oleh [Depati Digital](https://depatidigital.com) · Sungai Penuh, Jambi*

**Tagih Supen — Karena Juara Dimulai dari Warganya.**
