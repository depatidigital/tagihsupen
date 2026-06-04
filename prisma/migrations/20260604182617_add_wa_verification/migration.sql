-- AlterEnum: must commit before use in PostgreSQL
ALTER TYPE "Status" ADD VALUE 'MENUNGGU_WA';

-- End transaction so enum value is committed
COMMIT;

-- AlterTable (new transaction)
ALTER TABLE "Laporan" ADD COLUMN "jid" TEXT;
ALTER TABLE "Laporan" ALTER COLUMN "whatsapp" DROP NOT NULL;
ALTER TABLE "Laporan" ALTER COLUMN "status" SET DEFAULT 'MENUNGGU_WA';

BEGIN;
