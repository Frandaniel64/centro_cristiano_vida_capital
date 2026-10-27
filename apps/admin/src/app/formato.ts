import type { EstadoVisita, EstadoVoucher, FormaPago, Rol } from '@ccvida/shared';

export const usd = (n: number) => `USD ${Math.round(n).toLocaleString('es-AR')}`;
export const numeroVoucher = (n: number) => `Nº ${String(n).padStart(4, '0')}`;

export const fecha = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-AR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Argentina/Buenos_Aires',
      })
    : '—';

export const ROLES: Record<Rol, string> = {
  administrador: 'Administración',
  editor: 'Edición',
  tesoreria: 'Tesorería',
  recepcion: 'Recepción',
};

export const FORMAS_PAGO: Record<FormaPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  mercadopago: 'Mercado Pago',
};

type Severidad = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export const ESTADOS_VOUCHER: Record<EstadoVoucher, { texto: string; severidad: Severidad }> = {
  pendiente: { texto: 'Pendiente', severidad: 'warn' },
  confirmado: { texto: 'Confirmado', severidad: 'success' },
  vencido: { texto: 'Vencido', severidad: 'secondary' },
  anulado: { texto: 'Anulado', severidad: 'danger' },
};

export const ESTADOS_VISITA: Record<EstadoVisita, { texto: string; severidad: Severidad }> = {
  nueva: { texto: 'Nueva', severidad: 'info' },
  contactada: { texto: 'Contactada', severidad: 'warn' },
  vino: { texto: 'Vino', severidad: 'success' },
};

/** Link para escribirle por WhatsApp a un número argentino cargado a mano. */
export function linkWhatsapp(numero: string) {
  let d = numero.replace(/\D/g, '');
  if (!d.startsWith('54')) d = `549${d.replace(/^0/, '').replace(/^15/, '')}`;
  return `https://wa.me/${d}`;
}
