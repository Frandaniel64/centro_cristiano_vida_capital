import type { FotoRef } from '@ccvida/shared';
import type { Medio } from '../generated/prisma/client.js';
import { ErrorDeFormulario } from '../comun/validacion.js';

/** "Encuentro de Jóvenes 2026" → "encuentro-de-jovenes-2026" */
export function slugDe(texto: string) {
  return (
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'sin-titulo'
  );
}

/**
 * Slug libre para una colección: si ya existe, agrega -2, -3… Si la persona
 * escribió uno a mano y está tomado, avisa en el formulario.
 */
export async function slugLibre(
  existe: (slug: string) => Promise<{ id: string } | null>,
  base: string,
  manual: string | undefined,
  idActual?: string,
) {
  if (manual?.trim()) {
    const slug = slugDe(manual);
    const otro = await existe(slug);
    if (otro && otro.id !== idActual) throw new ErrorDeFormulario({ slug: 'Esa dirección ya la usa otro contenido.' });
    return slug;
  }
  const raiz = slugDe(base);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? raiz : `${raiz}-${n}`;
    const otro = await existe(slug);
    if (!otro || otro.id === idActual) return slug;
  }
}

export const fotoRef = (m: Medio | null): FotoRef =>
  m ? { id: m.id, url: m.url, tamanos: (m.tamanos ?? {}) as Record<string, string>, textoAlternativo: m.textoAlternativo } : null;

export const incluirFoto = { foto: true } as const;
