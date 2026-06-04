-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DITERIMA', 'DITERUSKAN', 'DIPROSES', 'SELESAI', 'DITOLAK');

-- CreateEnum
CREATE TYPE "Kategori" AS ENUM ('SAMPAH', 'JALAN', 'DRAINASE', 'PENERANGAN', 'PASAR', 'LAINNYA');

-- CreateTable
CREATE TABLE "Laporan" (
    "id" TEXT NOT NULL,
    "tiketId" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "kategori" "Kategori" NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "lokasi" TEXT NOT NULL,
    "lat" DOUBLE PRECISION,
    "lng" DOUBLE PRECISION,
    "foto" TEXT[],
    "fotoAfter" TEXT[],
    "status" "Status" NOT NULL DEFAULT 'DITERIMA',
    "catatanAdmin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "selesaiAt" TIMESTAMP(3),

    CONSTRAINT "Laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Riwayat" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "catatan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Riwayat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warga" (
    "id" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "totalLaporan" INTEGER NOT NULL DEFAULT 0,
    "totalSelesai" INTEGER NOT NULL DEFAULT 0,
    "badge" TEXT[],
    "lastActive" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Warga_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaConfig" (
    "id" TEXT NOT NULL,
    "waApiUrl" TEXT NOT NULL,
    "waAppId" TEXT NOT NULL,
    "waSecretKey" TEXT NOT NULL,
    "waEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WaLog" (
    "id" TEXT NOT NULL,
    "laporanId" TEXT,
    "whatsapp" TEXT NOT NULL,
    "jobKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Laporan_tiketId_key" ON "Laporan"("tiketId");

-- CreateIndex
CREATE UNIQUE INDEX "Warga_whatsapp_key" ON "Warga"("whatsapp");

-- AddForeignKey
ALTER TABLE "Riwayat" ADD CONSTRAINT "Riwayat_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaLog" ADD CONSTRAINT "WaLog_laporanId_fkey" FOREIGN KEY ("laporanId") REFERENCES "Laporan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
