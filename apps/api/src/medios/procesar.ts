import sharp from 'sharp';

/** Anchos que se generan; solo los que no superan el original. */
export const ANCHOS = [480, 960, 1600];
export const TIPOS_ACEPTADOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
export const PESO_MAXIMO = 15 * 1024 * 1024;

export interface Variante {
  ancho: number;
  datos: Buffer;
}

/**
 * Prepara una foto para la web: la gira según la orientación de la cámara,
 * le quita los metadatos (EXIF, incluida la ubicación GPS) y la guarda en WebP
 * en varios tamaños.
 */
export async function procesarFoto(original: Buffer) {
  const base = sharp(original, { failOn: 'error' }).rotate();
  const { width = 0, height = 0 } = await base.metadata();
  // Después de rotate(), ancho y alto pueden estar intercambiados según la orientación.
  const girada = await base.clone().toBuffer({ resolveWithObject: true });
  const ancho = girada.info.width || width;
  const alto = girada.info.height || height;

  const anchos = ANCHOS.filter((a) => a < ancho);
  if (anchos.length < ANCHOS.length) anchos.push(Math.min(ancho, ANCHOS[ANCHOS.length - 1]));

  const variantes: Variante[] = await Promise.all(
    [...new Set(anchos)].map(async (a) => ({
      ancho: a,
      datos: await sharp(girada.data).resize({ width: a, withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
    })),
  );
  return { ancho, alto, variantes };
}
