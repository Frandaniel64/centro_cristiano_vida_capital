import type { ContenidoPublico, EstadoProTemplo } from '@ccvida/shared';
import { CONTENIDO_EJEMPLO } from '../data/ejemplo';
import { estadoProTemploEjemplo } from '../data/estaticos';
import { API_URL, DEMO } from './api';

// Con los 20 s de caché del CDN delante de la API, un cambio del panel tarda
// como mucho ~40 s en verse (spec: menos de 1 minuto).
const VIGENCIA_MS = 20_000;
const ESPERA_MS = 4000;

// Última respuesta buena, por instancia del servidor. Si la API no responde se
// sigue mostrando esto: nunca se cae a los datos de ejemplo en producción.
let ultimo: { datos: ContenidoPublico; hasta: number } | null = null;

/**
 * Todo el contenido publicado del sitio. Se pide a la API como mucho cada 20 s
 * (spec: lo que se publica en el panel aparece en menos de 1 minuto).
 *
 * En vista previa el middleware ya trajo el contenido con borradores
 * (`cargarVistaPrevia`) y lo dejó en `locals`: se devuelve ese, sin otra
 * llamada y sin tocar la caché del contenido público.
 */
export async function contenido(locals?: App.Locals): Promise<ContenidoPublico> {
  if (DEMO) return CONTENIDO_EJEMPLO;
  return locals?.contenidoVistaPrevia ?? publico();
}

export type VistaPrevia =
  | { estado: 'ok'; datos: ContenidoPublico }
  /** El permiso no sirve (401) o la API no tiene el secreto (503): se borra la cookie. */
  | { estado: 'rechazado' }
  /** La API no respondió: se sigue con el sitio público, pero la cookie queda (el permiso puede servir). */
  | { estado: 'error' };

/**
 * Contenido con borradores para un permiso de vista previa. Lo llama el
 * middleware antes de armar la página, así decide a tiempo qué mostrar.
 */
export async function cargarVistaPrevia(permiso: string): Promise<VistaPrevia> {
  if (DEMO) return { estado: 'error' };
  try {
    const res = await fetch(`${API_URL}/api/contenido/vista-previa`, {
      headers: { Authorization: `Bearer ${permiso}` },
      signal: AbortSignal.timeout(ESPERA_MS),
    });
    if (res.ok) return { estado: 'ok', datos: (await res.json()) as ContenidoPublico };
    if (res.status === 401 || res.status === 503) return { estado: 'rechazado' };
  } catch {
    // Sin respuesta de la API: se trata como un error, no como permiso inválido.
  }
  return { estado: 'error' };
}

async function publico(): Promise<ContenidoPublico> {
  if (ultimo && ultimo.hasta > Date.now()) return ultimo.datos;
  try {
    const res = await fetch(`${API_URL}/api/contenido`, { signal: AbortSignal.timeout(ESPERA_MS) });
    if (!res.ok) throw new Error(`La API respondió ${res.status}`);
    const datos = (await res.json()) as ContenidoPublico;
    ultimo = { datos, hasta: Date.now() + VIGENCIA_MS };
    return datos;
  } catch (e) {
    if (ultimo) return ultimo.datos;
    throw e;
  }
}

/** Primer valor del contador (después lo actualiza el navegador cada 15 s). */
export async function estadoProTemplo(metaUsd: number): Promise<EstadoProTemplo> {
  if (DEMO) return estadoProTemploEjemplo;
  try {
    const res = await fetch(`${API_URL}/api/pro-templo/estado`, { signal: AbortSignal.timeout(ESPERA_MS) });
    if (res.ok) return (await res.json()) as EstadoProTemplo;
  } catch {
    // Sin respuesta: se muestra en cero y el navegador lo completa al recibirlo.
  }
  return { recaudadoUsd: 0, metaUsd, porcentaje: 0, ladrillos: 0, personas: 0, ultimosVouchers: [] };
}

/** Párrafos de un texto largo cargado en el panel (separados por línea en blanco). */
export const parrafos = (texto: string | null | undefined) =>
  (texto ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Texto legible sobre el color de un bloque de ministerio. */
export function colorTexto(fondo: string | null) {
  const hex = (fondo ?? '#f5f5f0').replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  // Contraste contra negro vs. contra blanco: se elige el mayor.
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#000000' : '#ffffff';
}
