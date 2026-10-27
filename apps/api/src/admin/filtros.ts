import type { Prisma } from '../generated/prisma/client.js';

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * "Vencido" no se guarda: es un pendiente cuyo plazo ya pasó, contado desde que
 * se creó o desde que se reactivó. Misma regla que estadoVisible().
 */
export function fueraDePlazo(diasVencimiento: number, ahora = Date.now()): Prisma.VoucherWhereInput {
  const limite = new Date(ahora - diasVencimiento * DIA_MS);
  // `not: null` es necesario: sin él, en SQL "NULL < límite" da NULL y un NOT(...) alrededor
  // (pendientes en plazo) descartaría los vouchers nunca reactivados.
  return { OR: [{ reactivadoEn: null, creado: { lt: limite } }, { reactivadoEn: { not: null, lt: limite } }] };
}

export const pendientesEnPlazo = (dias: number): Prisma.VoucherWhereInput => ({ estado: 'pendiente', NOT: fueraDePlazo(dias) });

export const apodosPorRevisar: Prisma.VoucherWhereInput = { mostrarComo: 'apodo', apodoAprobado: false, estado: { not: 'anulado' } };
