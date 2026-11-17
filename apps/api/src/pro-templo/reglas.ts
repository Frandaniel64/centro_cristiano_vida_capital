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

/**
 * Cómo pagar, en una sola fuente para la web y el email. `datos` son los datos
 * bancarios tal como los cargó la iglesia: van aparte para mostrarlos en un recuadro.
 */
export type InstruccionesPago = { texto: string; datos?: string };

export function instruccionesDePago(forma: FormaPago, numero: number, datosTransferencia: string): InstruccionesPago {
  const n = numeroVoucher(numero);
  if (forma === 'efectivo') {
    return { texto: `Acercate a la mesa Pro Templo el domingo después de la reunión y decí tu número: Nº ${n}.` };
  }
  if (forma === 'transferencia') {
    const datos = datosTransferencia.trim();
    return datos
      ? { texto: `Transferí a esta cuenta y respondé el email que te mandamos con la foto del comprobante (Nº ${n}):`, datos }
      : { texto: `Respondé el email que te mandamos y tesorería te pasa los datos para transferir (Nº ${n}).` };
  }
  return { texto: `Te mandamos el link de pago por email. Tu número es Nº ${n}.` };
}

/** Las instrucciones como texto plano, para la web: los datos en las líneas siguientes. */
export const instruccionesEnTexto = (i: InstruccionesPago) => (i.datos ? `${i.texto}\n${i.datos}` : i.texto);

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
