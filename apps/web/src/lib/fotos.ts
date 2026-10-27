import type { FotoPublica } from '@ccvida/shared';
import indice from '../data/fotos-diseno.json';

export type Foto = FotoPublica;
type NombreFoto = keyof typeof indice;

/** Una foto de diseño (public/fotos, generada con scripts/optimizar-fotos.mjs). */
export function fotoDiseno(nombre: NombreFoto, alt: string): Foto {
  const tamanos = indice[nombre] as Record<string, string>;
  const anchos = Object.keys(tamanos).filter((k) => /^\d+$/.test(k)).map(Number);
  return { url: tamanos[Math.max(...anchos)], tamanos, alt };
}

/** srcset con las variantes WebP por ancho. */
export const srcset = (f: Foto) =>
  Object.entries(f.tamanos)
    .filter(([ancho]) => /^\d+$/.test(ancho))
    .map(([ancho, url]) => `${url} ${ancho}w`)
    .join(', ');

/** Imagen para compartir (JPG 1200×630). */
export const imagenCompartir = (f: Foto | null | undefined) => f?.tamanos['compartir'] ?? f?.url;
