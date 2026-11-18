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

const UNA_HORA_S = 60 * 60;
const SIETE_DIAS_S = 7 * 24 * UNA_HORA_S;

/**
 * Segundos que le quedan al permiso según su vencimiento, para que la cookie dure
 * lo mismo (una hora, o siete días el link para compartir). No valida la firma:
 * eso lo hace la API en cada pedido. Si no se puede leer, una hora.
 */
export function vigenciaCookie(permiso: string, ahora = Date.now()): number {
  try {
    const datos = JSON.parse(Buffer.from(permiso.split('.')[0] ?? '', 'base64url').toString('utf8'));
    if (typeof datos?.exp !== 'number') return UNA_HORA_S;
    return Math.min(Math.max(Math.floor((datos.exp - ahora) / 1000), 0), SIETE_DIAS_S);
  } catch {
    return UNA_HORA_S;
  }
}
