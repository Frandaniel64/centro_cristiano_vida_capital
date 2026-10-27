import type { EstadoProTemplo, EstadoVoucher, FormaPago, MostrarComo } from '@ccvida/shared';

export const NOMBRE_ANONIMO = 'Alguien de la familia';
const LADRILLOS = 100;
const DIA_MS = 24 * 60 * 60 * 1000;

export const numeroVoucher = (n: number) => String(n).padStart(4, '0');

/** Datos del contador. Solo cuentan vouchers confirmados y ajustes manuales. */
export function calcularEstado(
  campana: { metaUsd: number; mostrarMontos: boolean },
  datos: { confirmadoUsd: number; ajustesUsd: number; personas: number; ultimos: { nombre: string; montoUsd: number }[] },
): EstadoProTemplo {
  const recaudado = Math.max(0, datos.confirmadoUsd + datos.ajustesUsd);
  const valorLadrillo = campana.metaUsd / LADRILLOS;
  return {
    recaudadoUsd: recaudado,
    metaUsd: campana.metaUsd,
    porcentaje: Math.min(100, Math.floor((recaudado / campana.metaUsd) * 100)),
    ladrillos: Math.min(LADRILLOS, Math.floor(recaudado / valorLadrillo)),
    personas: datos.personas,
    ultimosVouchers: datos.ultimos.map((u) => ({ nombre: u.nombre, montoUsd: campana.mostrarMontos ? u.montoUsd : null })),
  };
}

/** Cómo aparece quien dio en la web. Nunca el nombre real si no lo eligió. */
export function nombrePublico(v: { nombre: string; mostrarComo: MostrarComo; apodo: string | null; apodoAprobado: boolean }) {
  if (v.mostrarComo === 'nombre') return v.nombre;
  if (v.mostrarComo === 'apodo' && v.apodoAprobado && v.apodo) return v.apodo;
  return NOMBRE_ANONIMO;
}

export function instruccionesDePago(forma: FormaPago, numero: number, datosTransferencia: string) {
  const n = numeroVoucher(numero);
  if (forma === 'efectivo') {
    return `Acercate a la mesa Pro Templo el domingo después de la reunión y decí tu número: Nº ${n}.`;
  }
  if (forma === 'transferencia') {
    return datosTransferencia
      ? `Transferí a esta cuenta y mandanos el comprobante por WhatsApp con tu número (Nº ${n}):\n${datosTransferencia}`
      : `Te mandamos los datos para transferir por WhatsApp. Cuando pagues, mandanos el comprobante con tu número (Nº ${n}).`;
  }
  return `Te mandamos el link de pago de Mercado Pago. Tu número es Nº ${n}.`;
}

/** Un pendiente que pasó el plazo se informa como vencido aunque nadie lo haya marcado todavía. */
export function estadoVisible(
  v: { estado: EstadoVoucher; creado: Date; reactivadoEn?: Date | null },
  diasVencimiento: number,
  ahora = new Date(),
): EstadoVoucher {
  const desde = v.reactivadoEn ?? v.creado;
  if (v.estado === 'pendiente' && ahora.getTime() - desde.getTime() > diasVencimiento * DIA_MS) return 'vencido';
  return v.estado;
}
