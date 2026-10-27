import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { config } from '../config.js';

/** Carpeta local donde se guardan las fotos cuando no hay R2 (desarrollo). */
export const CARPETA_LOCAL = resolve(process.cwd(), 'medios');

/**
 * Guarda archivos públicos. En producción va a Cloudflare R2 (compatible con S3);
 * sin credenciales de R2 escribe en disco y la API los sirve en /medios.
 */
@Injectable()
export class Almacen {
  private readonly log = new Logger(Almacen.name);
  private readonly r2 = config.r2.cuenta
    ? new S3Client({
        region: 'auto',
        endpoint: `https://${config.r2.cuenta}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId: config.r2.claveId, secretAccessKey: config.r2.claveSecreta },
      })
    : null;

  constructor() {
    if (!this.r2) this.log.log(`Sin R2: las fotos se guardan en ${CARPETA_LOCAL}`);
  }

  /** Guarda y devuelve la URL pública. */
  async guardar(clave: string, datos: Buffer, tipo: string): Promise<string> {
    if (this.r2) {
      await this.r2.send(
        new PutObjectCommand({
          Bucket: config.r2.bucket,
          Key: clave,
          Body: datos,
          ContentType: tipo,
          // El nombre lleva un id único: se puede guardar en caché para siempre.
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      return `${config.r2.urlPublica}/${clave}`;
    }
    const destino = join(CARPETA_LOCAL, clave);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, datos);
    return `${config.apiUrl}/medios/${clave}`;
  }

  async borrar(clave: string) {
    if (this.r2) {
      await this.r2.send(new DeleteObjectCommand({ Bucket: config.r2.bucket, Key: clave }));
      return;
    }
    await rm(join(CARPETA_LOCAL, clave), { force: true });
  }
}
