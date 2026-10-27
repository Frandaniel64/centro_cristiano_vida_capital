import type { ErrorApi } from '@ccvida/shared';

export const API_URL = (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export class ErrorDeApi extends Error {
  constructor(
    mensaje: string,
    readonly campos: Record<string, string> = {},
  ) {
    super(mensaje);
  }
}

/** POST JSON a la API. Lanza ErrorDeApi con un mensaje para mostrar. */
export async function enviar<T>(ruta: string, cuerpo: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(API_URL + ruta, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cuerpo),
    });
  } catch {
    throw new ErrorDeApi('No pudimos conectarnos. Revisá tu conexión y probá de nuevo.');
  }
  if (res.ok) return (await res.json()) as T;
  if (res.status === 429) {
    throw new ErrorDeApi('Recibimos muchos envíos desde tu conexión. Esperá un rato y probá de nuevo.');
  }
  const error = (await res.json().catch(() => null)) as ErrorApi | null;
  throw new ErrorDeApi(
    error?.mensaje ?? 'Algo salió mal de nuestro lado. Probá de nuevo en unos minutos.',
    error?.campos,
  );
}
