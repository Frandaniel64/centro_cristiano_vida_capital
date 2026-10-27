import type { EventoPublico as Evento } from '@ccvida/shared';

const ZONA = 'America/Argentina/Buenos_Aires';
const DIA_MS = 24 * 60 * 60 * 1000;

/** Inicio y fin de la próxima vez que ocurre el evento (o la última, si ya pasó). */
export function proximaOcurrencia(e: Evento, ahora: number = Date.now()) {
  let inicio = new Date(e.inicio).getTime();
  // Sin hora de fin, el evento se considera terminado al empezar.
  let fin = e.fin ? new Date(e.fin).getTime() : inicio;
  if (e.repeticion === 'semanal') {
    while (fin < ahora) {
      inicio += 7 * DIA_MS;
      fin += 7 * DIA_MS;
    }
  } else if (e.repeticion === 'mensual') {
    while (fin < ahora) {
      const i = new Date(inicio);
      const f = new Date(fin);
      i.setUTCMonth(i.getUTCMonth() + 1);
      f.setUTCMonth(f.getUTCMonth() + 1);
      inicio = i.getTime();
      fin = f.getTime();
    }
  }
  return { inicio, fin };
}

/** Eventos que todavía no terminaron, ordenados por fecha. */
export function proximosEventos(lista: Evento[], ahora: number = Date.now()) {
  return lista
    .map((e) => ({ evento: e, ...proximaOcurrencia(e, ahora) }))
    .filter((o) => o.fin >= ahora)
    .sort((a, b) => a.inicio - b.inicio);
}

const parte = (ms: number, opciones: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-AR', { timeZone: ZONA, ...opciones }).format(ms);

const hora = (ms: number) => {
  const [h, m] = parte(ms, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).split(':');
  return m === '00' ? `${Number(h)} h` : `${Number(h)}:${m} h`;
};

/** Textos de fecha listos para mostrar. */
export function fechaEvento(e: Evento, inicio: number) {
  const diaSemana = parte(inicio, { weekday: 'long' });
  const diaMes = parte(inicio, { day: 'numeric', month: 'long' });
  const plural: Record<string, string> = { sábado: 'sábados', domingo: 'domingos' };
  const recurrente =
    e.repeticion === 'semanal'
      ? `Todos los ${plural[diaSemana] ?? diaSemana}`
      : e.repeticion === 'mensual'
        ? `Una vez por mes, el ${diaSemana}`
        : null;
  return {
    dia: parte(inicio, { day: 'numeric' }),
    mes: parte(inicio, { month: 'short' }).replace('.', ''),
    diaCorto: parte(inicio, { weekday: 'short' }).replace('.', ''),
    hora: hora(inicio),
    // "domingo 29 de noviembre" o "Todos los sábados"
    cuando: recurrente ?? `${diaSemana} ${diaMes}`,
    proxima: recurrente ? `Próximo: ${diaSemana} ${diaMes}` : null,
  };
}

const fechaIcs = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const textoIcs = (t: string) => t.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, (c) => `\\${c}`);

/** Archivo .ics para "Agregar a mi calendario". */
export function ics(e: Evento, url: string) {
  const regla = { semanal: 'RRULE:FREQ=WEEKLY', mensual: 'RRULE:FREQ=MONTHLY', ninguna: null }[e.repeticion];
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CCVida Capital//Eventos//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${e.slug}@ccvida`,
    `DTSTAMP:${fechaIcs(Date.now())}`,
    `DTSTART:${fechaIcs(new Date(e.inicio).getTime())}`,
    e.fin ? `DTEND:${fechaIcs(new Date(e.fin).getTime())}` : null,
    regla,
    `SUMMARY:${textoIcs(e.titulo)}`,
    `DESCRIPTION:${textoIcs(e.resumen ? `${e.resumen}\n${url}` : url)}`,
    e.lugar ? `LOCATION:${textoIcs(e.lugar)}` : null,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);
  return lineas.join('\r\n') + '\r\n';
}
