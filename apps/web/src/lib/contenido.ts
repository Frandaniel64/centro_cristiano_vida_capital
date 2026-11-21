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

// Pedido en curso: si llegan varias visitas a la vez, comparten la misma llamada.
let pidiendo: Promise<ContenidoPublico> | null = null;

function pedirContenido(): Promise<ContenidoPublico> {
  pidiendo ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/api/contenido`, { signal: AbortSignal.timeout(ESPERA_MS) });
      if (!res.ok) throw new Error(`La API respondió ${res.status}`);
      const datos = (await res.json()) as ContenidoPublico;
      ultimo = { datos, hasta: Date.now() + VIGENCIA_MS };
      return datos;
    } finally {
      pidiendo = null;
    }
  })();
  return pidiendo;
}

async function publico(): Promise<ContenidoPublico> {
  mantenerAlDia();
  if (ultimo) {
    // Vencido: se responde ya con lo que hay y se renueva sin hacer esperar a la visita.
    if (ultimo.hasta <= Date.now()) pedirContenido().catch(() => {});
    return ultimo.datos;
  }
  return pedirContenido();
}

// Último estado de Pro Templo, con la misma idea que el contenido.
let ultimoEstado: { datos: EstadoProTemplo; hasta: number } | null = null;
let pidiendoEstado: Promise<EstadoProTemplo | null> | null = null;

function pedirEstado(): Promise<EstadoProTemplo | null> {
  pidiendoEstado ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/api/pro-templo/estado`, { signal: AbortSignal.timeout(ESPERA_MS) });
      if (!res.ok) return null;
      const datos = (await res.json()) as EstadoProTemplo;
      ultimoEstado = { datos, hasta: Date.now() + VIGENCIA_MS };
      return datos;
    } catch {
      return null;
    } finally {
      pidiendoEstado = null;
    }
  })();
  return pidiendoEstado;
}

/** Primer valor del contador (después lo actualiza el navegador cada 15 s). */
export async function estadoProTemplo(metaUsd: number): Promise<EstadoProTemplo> {
  if (DEMO) return estadoProTemploEjemplo;
  mantenerAlDia();
  if (ultimoEstado) {
    if (ultimoEstado.hasta <= Date.now()) void pedirEstado();
    return ultimoEstado.datos;
  }
  // Sin respuesta: se muestra en cero y el navegador lo completa al recibirlo.
  return (await pedirEstado()) ?? { recaudadoUsd: 0, metaUsd, porcentaje: 0, ladrillos: 0, personas: 0, ultimosVouchers: [] };
}

/**
 * En el servidor Node (producción) se renueva todo cada 20 s aunque no entre
 * nadie: así la primera visita después de un rato sin tráfico no espera a la
 * API, y lo publicado en el panel sigue apareciendo en menos de 1 minuto.
 * En Cloudflare Workers no hay temporizadores entre pedidos: ahí basta con
 * renovar al vencer (lo hacen `publico` y `estadoProTemplo`).
 */
let renovando = false;
function mantenerAlDia() {
  if (renovando || DEMO || !globalThis.process?.versions?.node || 'WebSocketPair' in globalThis) return;
  renovando = true;
  const t = setInterval(() => {
    pedirContenido().catch(() => {});
    void pedirEstado();
  }, VIGENCIA_MS);
  t.unref?.();
}

/** Párrafos de un texto largo cargado en el panel (separados por línea en blanco). */
export const parrafos = (texto: string | null | undefined) =>
  (texto ?? '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Texto legible sobre el color de un bloque de ministerio. */
export function colorTexto(fondo: string | null) {
  const hex = (fondo ?? '#b1d9e1').replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const l = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b);
  // Contraste contra negro vs. contra blanco: se elige el mayor.
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#0d1f2d' : '#ffffff';
}
