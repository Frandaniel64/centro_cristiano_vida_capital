-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('administrador', 'editor', 'tesoreria', 'recepcion');

-- CreateEnum
CREATE TYPE "EstadoContenido" AS ENUM ('borrador', 'publicado');

-- CreateEnum
CREATE TYPE "Repeticion" AS ENUM ('ninguna', 'semanal', 'mensual');

-- CreateEnum
CREATE TYPE "MostrarComo" AS ENUM ('nombre', 'apodo', 'anonimo');

-- CreateEnum
CREATE TYPE "ContactoTipo" AS ENUM ('whatsapp', 'email');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('efectivo', 'transferencia', 'mercadopago');

-- CreateEnum
CREATE TYPE "EstadoVoucher" AS ENUM ('pendiente', 'confirmado', 'anulado', 'vencido');

-- CreateEnum
CREATE TYPE "Moneda" AS ENUM ('USD', 'ARS');

-- CreateEnum
CREATE TYPE "EstadoVisita" AS ENUM ('nueva', 'contactada', 'vino');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "rol" "Rol" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "totp_secreto" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "medios" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "texto_alternativo" TEXT NOT NULL,
    "credito" TEXT,
    "mime" TEXT NOT NULL,
    "ancho" INTEGER,
    "alto" INTEGER,
    "tamanos" JSONB,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "medios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publicaciones" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "foto_id" TEXT,
    "resumen" TEXT,
    "cuerpo" JSONB NOT NULL,
    "categoria" TEXT,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoContenido" NOT NULL DEFAULT 'borrador',
    "publicar_desde" TIMESTAMP(3),
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "publicaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "inicio" TIMESTAMP(3) NOT NULL,
    "fin" TIMESTAMP(3),
    "repeticion" "Repeticion" NOT NULL DEFAULT 'ninguna',
    "lugar" TEXT,
    "foto_id" TEXT,
    "descripcion" JSONB,
    "ministerio_id" TEXT,
    "destacado" BOOLEAN NOT NULL DEFAULT false,
    "link_inscripcion" TEXT,
    "estado" "EstadoContenido" NOT NULL DEFAULT 'borrador',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "descripcion" TEXT,
    "foto_id" TEXT,
    "estado" "EstadoContenido" NOT NULL DEFAULT 'publicado',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "series_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "predicas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "predicador" TEXT NOT NULL,
    "serie_id" TEXT,
    "url_video" TEXT,
    "duracion_min" INTEGER,
    "resumen" TEXT,
    "versiculos" TEXT[],
    "foto_id" TEXT,
    "destacada" BOOLEAN NOT NULL DEFAULT false,
    "estado" "EstadoContenido" NOT NULL DEFAULT 'borrador',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "predicas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ministerios" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "edades" TEXT,
    "horario" TEXT,
    "descripcion" TEXT,
    "actividades" TEXT[],
    "foto_id" TEXT,
    "color" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "estado" "EstadoContenido" NOT NULL DEFAULT 'borrador',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "ministerios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campanas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "meta_usd" INTEGER NOT NULL,
    "monto_maximo_usd" INTEGER NOT NULL DEFAULT 10000,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "mostrar_montos" BOOLEAN NOT NULL DEFAULT true,
    "mensaje_meta_cumplida" TEXT,
    "montos_sugeridos" INTEGER[],
    "formas_pago_activas" "FormaPago"[],
    "dias_vencimiento" INTEGER NOT NULL DEFAULT 30,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "campanas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vouchers" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "campana_id" TEXT NOT NULL,
    "monto_usd" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "mostrar_como" "MostrarComo" NOT NULL DEFAULT 'anonimo',
    "apodo" TEXT,
    "apodo_aprobado" BOOLEAN NOT NULL DEFAULT false,
    "contacto_tipo" "ContactoTipo" NOT NULL,
    "contacto" TEXT NOT NULL,
    "forma_pago" "FormaPago" NOT NULL,
    "mensaje" VARCHAR(500),
    "estado" "EstadoVoucher" NOT NULL DEFAULT 'pendiente',
    "monto_recibido" DECIMAL(12,2),
    "moneda_recibida" "Moneda",
    "tipo_cambio" DECIMAL(12,2),
    "comprobante_clave" TEXT,
    "nota" TEXT,
    "confirmado_por_id" TEXT,
    "confirmado_en" TIMESTAMP(3),
    "motivo_anulacion" TEXT,
    "id_pago_externo" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ajustes_campana" (
    "id" TEXT NOT NULL,
    "campana_id" TEXT NOT NULL,
    "monto_usd" INTEGER NOT NULL,
    "motivo" TEXT NOT NULL,
    "cargado_por_id" TEXT NOT NULL,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ajustes_campana_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "visitas" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto_tipo" "ContactoTipo" NOT NULL,
    "contacto" TEXT NOT NULL,
    "intereses" TEXT[],
    "estado" "EstadoVisita" NOT NULL DEFAULT 'nueva',
    "notas" TEXT,
    "atendido_por_id" TEXT,
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "visitas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "paginas" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "bloques" JSONB NOT NULL DEFAULT '[]',
    "seo_titulo" TEXT,
    "seo_descripcion" TEXT,
    "seo_imagen_id" TEXT,
    "estado" "EstadoContenido" NOT NULL DEFAULT 'borrador',
    "creado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "paginas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "horario_reunion" TEXT,
    "direccion" TEXT,
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "redes" JSONB NOT NULL DEFAULT '{}',
    "whatsapp" TEXT,
    "canal_youtube" TEXT,
    "datos_transferencia" TEXT,
    "textos_pie" JSONB NOT NULL DEFAULT '{}',
    "actualizado" TIMESTAMP(3) NOT NULL,
    "actualizado_por_id" TEXT,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "medios_clave_key" ON "medios"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "publicaciones_slug_key" ON "publicaciones"("slug");

-- CreateIndex
CREATE INDEX "publicaciones_estado_publicar_desde_idx" ON "publicaciones"("estado", "publicar_desde");

-- CreateIndex
CREATE UNIQUE INDEX "eventos_slug_key" ON "eventos"("slug");

-- CreateIndex
CREATE INDEX "eventos_estado_inicio_idx" ON "eventos"("estado", "inicio");

-- CreateIndex
CREATE UNIQUE INDEX "series_slug_key" ON "series"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "predicas_slug_key" ON "predicas"("slug");

-- CreateIndex
CREATE INDEX "predicas_estado_fecha_idx" ON "predicas"("estado", "fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "ministerios_slug_key" ON "ministerios"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "campanas_slug_key" ON "campanas"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_numero_key" ON "vouchers"("numero");

-- CreateIndex
CREATE UNIQUE INDEX "vouchers_id_pago_externo_key" ON "vouchers"("id_pago_externo");

-- CreateIndex
CREATE INDEX "vouchers_campana_id_estado_idx" ON "vouchers"("campana_id", "estado");

-- CreateIndex
CREATE INDEX "vouchers_estado_creado_idx" ON "vouchers"("estado", "creado");

-- CreateIndex
CREATE INDEX "ajustes_campana_campana_id_idx" ON "ajustes_campana"("campana_id");

-- CreateIndex
CREATE INDEX "visitas_estado_creado_idx" ON "visitas"("estado", "creado");

-- CreateIndex
CREATE UNIQUE INDEX "paginas_slug_key" ON "paginas"("slug");

-- AddForeignKey
ALTER TABLE "publicaciones" ADD CONSTRAINT "publicaciones_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eventos" ADD CONSTRAINT "eventos_ministerio_id_fkey" FOREIGN KEY ("ministerio_id") REFERENCES "ministerios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series" ADD CONSTRAINT "series_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predicas" ADD CONSTRAINT "predicas_serie_id_fkey" FOREIGN KEY ("serie_id") REFERENCES "series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "predicas" ADD CONSTRAINT "predicas_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministerios" ADD CONSTRAINT "ministerios_foto_id_fkey" FOREIGN KEY ("foto_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_campana_id_fkey" FOREIGN KEY ("campana_id") REFERENCES "campanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vouchers" ADD CONSTRAINT "vouchers_confirmado_por_id_fkey" FOREIGN KEY ("confirmado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_campana" ADD CONSTRAINT "ajustes_campana_campana_id_fkey" FOREIGN KEY ("campana_id") REFERENCES "campanas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ajustes_campana" ADD CONSTRAINT "ajustes_campana_cargado_por_id_fkey" FOREIGN KEY ("cargado_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visitas" ADD CONSTRAINT "visitas_atendido_por_id_fkey" FOREIGN KEY ("atendido_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "paginas" ADD CONSTRAINT "paginas_seo_imagen_id_fkey" FOREIGN KEY ("seo_imagen_id") REFERENCES "medios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
