export const usd = (n: number) => Math.round(n).toLocaleString('es-AR');

export const fechaLarga = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

export const numeroVoucher = (n: number) => String(n).padStart(4, '0');

/** Link de WhatsApp a partir de un número argentino escrito a mano ("11 5555 1234"). */
export function linkWhatsapp(numero: string) {
  let d = numero.replace(/\D/g, '');
  if (!d) return '';
  if (!d.startsWith('54')) d = `549${d.replace(/^0/, '').replace(/^15/, '')}`;
  return `https://wa.me/${d}`;
}
