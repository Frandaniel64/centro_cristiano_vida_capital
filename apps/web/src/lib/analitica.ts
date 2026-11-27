// Medición de visitas con Umami (self-hosted en Coolify): sin cookies ni datos personales.
// Se activa con PUBLIC_UMAMI_URL y PUBLIC_UMAMI_ID (de build). Sin ellas no se carga nada.

declare global {
  interface Window {
    umami?: { track: (evento: string, datos?: Record<string, string | number>) => void };
  }
}

const URL_UMAMI = (import.meta.env.PUBLIC_UMAMI_URL ?? '').replace(/\/$/, '');
const ID_UMAMI = import.meta.env.PUBLIC_UMAMI_ID ?? '';

/** Script de Umami, o null si la medición no está configurada. */
export const umami = URL_UMAMI && ID_UMAMI ? { src: `${URL_UMAMI}/script.js`, id: ID_UMAMI } : null;

/**
 * Cuenta un evento propio (por ejemplo, un formulario enviado con éxito).
 * Nunca mandar datos personales: ni nombres, ni emails, ni teléfonos.
 * Si Umami no cargó (bloqueador, sin configurar), no hace nada.
 */
export function registrar(evento: string, datos?: Record<string, string | number>) {
  try {
    window.umami?.track(evento, datos);
  } catch {
    // La medición nunca puede romper la página.
  }
}
