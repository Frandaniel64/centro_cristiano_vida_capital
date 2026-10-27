export const usd = (n: number) => Math.round(n).toLocaleString('es-AR');

export const fechaLarga = (iso: string) =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  });

export const numeroVoucher = (n: number) => String(n).padStart(4, '0');
