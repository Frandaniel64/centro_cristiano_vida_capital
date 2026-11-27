import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { ContenidoPublico, EventoPublico, MinisterioPublico } from '@ccvida/shared';
import { armarLlmsTxt, armarRobotsTxt } from './llms.ts';

const SITE = new URL('https://ccvidacapital.org');
const AHORA = Date.parse('2026-11-26T12:00:00Z');

const ministerio = (m: Partial<MinisterioPublico> & Pick<MinisterioPublico, 'slug' | 'nombre'>): MinisterioPublico => ({
  edades: null, horario: null, resumen: null, descripcion: null, actividades: [], color: null, foto: null, ...m,
});

const evento = (e: Partial<EventoPublico> & Pick<EventoPublico, 'slug' | 'titulo' | 'inicio'>): EventoPublico => ({
  fin: null, repeticion: 'ninguna', lugar: null, resumen: null, descripcion: null, ministerio: null,
  destacado: false, linkInscripcion: null, foto: null, ...e,
});

function contenido(cambios: Partial<ContenidoPublico> = {}, textos: Record<string, unknown> = {}): ContenidoPublico {
  return {
    textos: { lema: 'Hay lugar para ti.', bajadaInicio: '', datosIglesia: '', reunion: 'Domingos 10 h', direccion: 'Av. Siempre Viva 123', barrio: 'Floresta, CABA', ...textos },
    nosotros: { portada: null, historia: null, pastores: null, galeria: [] },
    ministerios: [],
    eventos: [],
    predicas: [],
    campana: { metaUsd: 0, montoMaximoUsd: 0, montosSugeridos: [], formasPago: [] },
    ...cambios,
  } as ContenidoPublico;
}

test('robots.txt apunta al sitemap del dominio', () => {
  assert.match(armarRobotsTxt(SITE), /^Sitemap: https:\/\/ccvidacapital\.org\/sitemap\.xml$/m);
  assert.match(armarRobotsTxt(SITE), /^Allow: \/$/m);
});

test('llms.txt lista los ministerios con link absoluto y omite los campos vacíos', () => {
  const txt = armarLlmsTxt(
    contenido({
      ministerios: [
        ministerio({ slug: 'vida-kids', nombre: 'Vida Kids', resumen: 'Para los más chicos.', edades: '3 a 11 años', horario: 'Domingos 10 h' }),
        ministerio({ slug: 'jovenes', nombre: 'Jóvenes' }),
        ministerio({ slug: 'mujeres', nombre: 'Mujeres', horario: 'Sábados 17 h' }),
      ],
    }),
    SITE,
    AHORA,
  );
  assert.match(txt, /^- \[Vida Kids\]\(https:\/\/ccvidacapital\.org\/ministerios\/vida-kids\): Para los más chicos\. \(3 a 11 años, Domingos 10 h\)$/m);
  assert.match(txt, /^- \[Jóvenes\]\(https:\/\/ccvidacapital\.org\/ministerios\/jovenes\)$/m);
  assert.match(txt, /^- \[Mujeres\]\(https:\/\/ccvidacapital\.org\/ministerios\/mujeres\): \(Sábados 17 h\)$/m);
  assert.doesNotMatch(txt, /null|undefined/);
});

test('llms.txt arma encabezado, reunión, eventos y páginas', () => {
  const txt = armarLlmsTxt(
    contenido({
      eventos: [
        evento({ slug: 'bautismos', titulo: 'Bautismos', inicio: '2026-12-06T13:00:00Z', lugar: 'Templo' }),
        evento({ slug: 'pasado', titulo: 'Ya pasó', inicio: '2026-11-01T13:00:00Z' }),
      ],
    }),
    SITE,
    AHORA,
  );
  assert.ok(txt.startsWith('# Centro Cristiano Vida Capital\n\n> Hay lugar para ti.\n'));
  assert.match(txt, /^- Domingos 10 h — Av\. Siempre Viva 123, Floresta, CABA$/m);
  assert.match(txt, /^- \[Bautismos\]\(https:\/\/ccvidacapital\.org\/eventos\/bautismos\): domingo 6 de diciembre, 10 h, Templo$/m);
  assert.doesNotMatch(txt, /Ya pasó/);
  assert.match(txt, /^- \[Prédicas\]\(https:\/\/ccvidacapital\.org\/predicas\)$/m);
});

test('llms.txt no escribe secciones sin datos', () => {
  const txt = armarLlmsTxt(contenido({}, { lema: '', reunion: '', direccion: '', barrio: '' }), SITE, AHORA);
  assert.doesNotMatch(txt, /^>/m);
  assert.doesNotMatch(txt, /## Reuniones|## Ministerios|## Próximos eventos/);
  assert.match(txt, /## Páginas/);
});
