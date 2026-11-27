import type { ContenidoPublico } from '@ccvida/shared';
// Con extensión .ts para que `node --test` lo resuelva sin Vite.
import { fechaEvento, proximosEventos } from './eventos.ts';

const NOMBRE = 'Centro Cristiano Vida Capital';

// Páginas fijas que se listan al final (sólo los títulos van escritos aquí).
const PAGINAS: [string, string][] = [
  ['Nosotros', '/nosotros'],
  ['Prédicas', '/predicas'],
  ['Visitanos', '/visitanos'],
];

/** Texto de una sola línea, sin espacios de más. Vacío si no hay nada. */
const limpio = (t: string | null | undefined) => (t ?? '').replace(/\s+/g, ' ').trim();

/** Une las partes que tienen texto; las vacías se omiten. */
const unir = (partes: (string | null | undefined)[], separador: string) =>
  partes.map(limpio).filter(Boolean).join(separador);

const enlace = (titulo: string, ruta: string, site: URL) =>
  `[${limpio(titulo).replace(/[[\]]/g, '')}](${new URL(ruta, site).href})`;

/**
 * /llms.txt: resumen de la iglesia para motores de IA (https://llmstxt.org),
 * armado con el contenido publicado. Las líneas sin datos se omiten, y una
 * sección sin líneas no se escribe.
 */
export function armarLlmsTxt(c: ContenidoPublico, site: URL, ahora: number = Date.now()): string {
  const { textos } = c;
  const bloques: string[] = [`# ${NOMBRE}`];

  const lema = limpio(textos.lema);
  if (lema) bloques.push(`> ${lema}`);
  const intro = unir([textos.bajadaInicio, textos.datosIglesia], '\n\n');
  if (intro) bloques.push(intro);

  const seccion = (titulo: string, lineas: string[]) => {
    if (lineas.length) bloques.push(`## ${titulo}\n\n${lineas.join('\n')}`);
  };

  const reunion = unir([textos.reunion, unir([textos.direccion, textos.barrio], ', ')], ' — ');
  seccion('Reuniones', reunion ? [`- ${reunion}`] : []);

  seccion(
    'Ministerios',
    c.ministerios.map((m) => {
      const datos = unir([m.edades, m.horario], ', ');
      const detalle = unir([m.resumen, datos && `(${datos})`], ' ');
      return `- ${enlace(m.nombre, `/ministerios/${m.slug}`, site)}${detalle ? `: ${detalle}` : ''}`;
    }),
  );

  seccion(
    'Próximos eventos',
    proximosEventos(c.eventos, ahora).map(({ evento: e, inicio }) => {
      const f = fechaEvento(e, inicio);
      const detalle = unir([`${f.cuando}, ${f.hora}`, e.lugar], ', ');
      return `- ${enlace(e.titulo, `/eventos/${e.slug}`, site)}: ${detalle}`;
    }),
  );

  seccion(
    'Páginas',
    PAGINAS.map(([titulo, ruta]) => `- ${enlace(titulo, ruta, site)}`),
  );

  return bloques.join('\n\n') + '\n';
}

/** robots.txt: todo permitido (también los bots de IA) y el sitemap del dominio. */
export function armarRobotsTxt(site: URL): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${new URL('/sitemap.xml', site).href}\n`;
}
