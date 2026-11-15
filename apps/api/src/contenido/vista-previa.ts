import { createHmac, timingSafeEqual } from 'node:crypto';

// Permiso firmado para ver borradores en el sitio público: "<payload>.<firma>",
// ambos en base64url. Dura una hora y no se guarda en ningún lado.
export const DURACION_PERMISO_MS = 3_600_000;

const LARGO_MAXIMO_RUTA = 200;

const firmar = (payload: string, secreto: string) => createHmac('sha256', secreto).update(payload).digest('base64url');

export function firmarPermiso(usuarioId: string, secreto: string, ahora = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ u: usuarioId, exp: ahora + DURACION_PERMISO_MS })).toString('base64url');
  return `${payload}.${firmar(payload, secreto)}`;
}

export function verificarPermiso(permiso: string, secreto: string, ahora = Date.now()): { usuarioId: string } | null {
  try {
    const partes = permiso.split('.');
    if (partes.length !== 2) return null;
    const [payload, firma] = partes;
    const esperada = Buffer.from(firmar(payload, secreto));
    const recibida = Buffer.from(firma);
    if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
    const datos = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof datos?.u !== 'string' || typeof datos?.exp !== 'number' || datos.exp < ahora) return null;
    return { usuarioId: datos.u };
  } catch {
    return null;
  }
}

/**
 * Solo rutas del propio sitio: evita que el redirect de la vista previa saque al
 * visitante afuera. Sin caracteres de control (va a un header Location). Misma
 * regla que la web (apps/web/src/lib/vista-previa.ts).
 */
export function rutaInterna(ruta: unknown): ruta is string {
  return (
    typeof ruta === 'string' &&
    ruta.length <= LARGO_MAXIMO_RUTA &&
    ruta.startsWith('/') &&
    !ruta.startsWith('//') &&
    !ruta.includes('\\') &&
    !/[\u0000-\u001f\u007f]/.test(ruta)
  );
}
