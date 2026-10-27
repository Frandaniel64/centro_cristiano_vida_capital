-- AlterTable
ALTER TABLE "usuarios" ADD COLUMN     "debe_cambiar_clave" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "vouchers" ADD COLUMN     "reactivado_en" TIMESTAMP(3);
