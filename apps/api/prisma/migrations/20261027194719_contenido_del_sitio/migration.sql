-- AlterTable
ALTER TABLE "configuracion" ADD COLUMN     "textos" JSONB NOT NULL DEFAULT '{}';

-- AlterTable
ALTER TABLE "eventos" ADD COLUMN     "resumen" TEXT,
ALTER COLUMN "descripcion" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "ministerios" ADD COLUMN     "resumen" TEXT;
