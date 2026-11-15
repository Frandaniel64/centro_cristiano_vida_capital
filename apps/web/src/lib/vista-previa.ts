export const COOKIE_VISTA_PREVIA = 'ccvida_vista_previa';

/**
 * Ruta interna segura para redirigir: empieza con "/", no es "//", sin "\" y
 * sin caracteres de control (va a un header Location). Misma regla que la API
 * (duplicada a propósito: @ccvida/shared es sólo de tipos).
 */
export function rutaInterna(ruta: unknown): ruta is string {
  return (
    typeof ruta === 'string' &&
    ruta.startsWith('/') &&
    !ruta.startsWith('//') &&
    !ruta.includes('\\') &&
    ruta.length <= 200 &&
    !/[\u0000-\u001f\u007f]/.test(ruta)
  );
}
