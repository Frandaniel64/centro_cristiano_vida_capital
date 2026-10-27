import type { CrearVoucher, ErrorApi, VoucherCreado } from '@ccvida/shared';

export const API_URL = (import.meta.env.PUBLIC_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Versión de muestra para enseñarle el sitio a la iglesia sin API:
// los formularios responden con datos simulados y no se guarda nada.
export const DEMO = import.meta.env.PUBLIC_DEMO === 'true';

const INSTRUCCIONES_DEMO: Record<string, string> = {
  efectivo: 'Acercate a la mesa Pro Templo el domingo después de la reunión y decí tu número.',
  transferencia: 'Transferí a la cuenta en dólares de la iglesia y mandanos el comprobante por WhatsApp con tu número.\n(Los datos bancarios reales se cargan desde el panel.)',
  mercadopago: 'Te mandamos el link de pago de Mercado Pago.',
};
let numeroDemo = 347;

function respuestaDemo(ruta: string, cuerpo: unknown): unknown {
  if (ruta === '/api/vouchers') {
    const v = cuerpo as CrearVoucher;
    numeroDemo += 1;
    return {
      numero: numeroDemo,
      montoUsd: v.montoUsd,
      formaPago: v.formaPago,
      estado: 'pendiente',
      instrucciones: INSTRUCCIONES_DEMO[v.formaPago],
    } satisfies VoucherCreado;
  }
  return {};
}

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
  if (DEMO) {
    await new Promise((r) => setTimeout(r, 600));
    return respuestaDemo(ruta, cuerpo) as T;
  }
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
