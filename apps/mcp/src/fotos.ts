import { readFile, stat } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import type { MedioAdmin } from '@ccvida/shared';
import { ErrorHerramienta, type ClienteApi } from './cliente.js';

const MAXIMO_BYTES = 15 * 1024 * 1024;

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

/** Acceso al disco; se inyecta en los tests para no depender de archivos grandes. */
export interface AccesoArchivos {
  stat: (ruta: string) => Promise<{ size: number }>;
  readFile: (ruta: string) => Promise<Uint8Array>;
}

const discoReal: AccesoArchivos = { stat, readFile };

export interface DatosFoto {
  ruta: string;
  textoAlternativo: string;
  credito?: string;
}

export async function subirFoto(
  cliente: ClienteApi,
  datos: DatosFoto,
  fs: AccesoArchivos = discoReal,
): Promise<{ id: string; url: string; textoAlternativo: string }> {
  let tamano: number;
  try {
    tamano = (await fs.stat(datos.ruta)).size;
  } catch {
    throw new ErrorHerramienta(`No encontré el archivo ${datos.ruta}.`);
  }
  const mime = MIME[extname(datos.ruta).toLowerCase()];
  if (!mime) throw new ErrorHerramienta('La foto tiene que ser JPG, PNG, WebP o AVIF.');
  if (tamano > MAXIMO_BYTES) throw new ErrorHerramienta('La foto pesa más de 15 MB.');

  const bytes = await fs.readFile(datos.ruta);
  const form = new FormData();
  form.append('archivo', new Blob([bytes as BlobPart], { type: mime }), basename(datos.ruta));
  form.append('textoAlternativo', datos.textoAlternativo);
  if (datos.credito) form.append('credito', datos.credito);

  const medio = await cliente.subir<MedioAdmin>('/api/admin/medios', form);
  return { id: medio.id, url: medio.url, textoAlternativo: medio.textoAlternativo };
}
