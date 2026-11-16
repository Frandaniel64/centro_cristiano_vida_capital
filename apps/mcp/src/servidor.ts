import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { ClienteApi, ErrorHerramienta } from './cliente.js';
import {
  crearContenido,
  editarContenido,
  linkVistaPrevia,
  listarContenido,
  verContenido,
  type Tipo,
} from './contenido.js';
import { subirFoto } from './fotos.js';
import { editarTextos, verTextos } from './textos.js';

type Resultado = { content: { type: 'text'; text: string }[]; isError?: boolean };

async function responder(trabajo: () => Promise<unknown>): Promise<Resultado> {
  try {
    const dato = await trabajo();
    return { content: [{ type: 'text', text: JSON.stringify(dato ?? null, null, 2) }] };
  } catch (e) {
    const texto = e instanceof ErrorHerramienta ? e.message : `Error inesperado: ${e instanceof Error ? e.message : String(e)}`;
    return { isError: true, content: [{ type: 'text', text: texto }] };
  }
}

// --- Campos por tipo (los de Guardar<…> sin estado: lo que se crea o edita siempre queda en borrador).
const texto = (min: number, max: number) => z.string().min(min).max(max);
const nulo = <T extends z.ZodType>(t: T) => t.nullable();
const fecha = z.iso.datetime({ offset: true, message: 'Usá fecha y hora ISO con zona, ej. 2026-12-25T19:00:00-03:00.' });
const slug = z.string().min(1).max(80).describe('Opcional: si no se pasa se arma con el título o nombre.');
const fotoId = nulo(z.string()).describe('Id de una foto ya subida (ver subir_foto o listar_contenido con tipo "fotos"), o null para sin foto.');

const camposMinisterio = {
  nombre: texto(2, 80),
  slug,
  edades: nulo(texto(0, 100)),
  horario: nulo(texto(0, 120)),
  resumen: nulo(texto(0, 200)),
  descripcion: nulo(texto(0, 3000)),
  actividades: z.array(texto(0, 160)).max(12),
  color: nulo(z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Usá un color hexadecimal, ej. #1a73e8.')),
  orden: z.number().int().describe('Posición en la lista (0 primero).'),
  fotoId,
};
const camposEvento = {
  titulo: texto(3, 120),
  slug,
  inicio: fecha,
  fin: nulo(fecha),
  repeticion: z.enum(['ninguna', 'semanal', 'mensual']),
  lugar: nulo(texto(0, 160)),
  resumen: nulo(texto(0, 200)),
  descripcion: nulo(texto(0, 5000)),
  ministerioId: nulo(z.string()),
  destacado: z.boolean(),
  linkInscripcion: nulo(texto(0, 500)).describe('Empieza con https:// (o / si es una página del sitio).'),
  fotoId,
};
const camposPredica = {
  titulo: texto(3, 120),
  slug,
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usá el formato AAAA-MM-DD.'),
  predicador: texto(2, 100),
  serieId: nulo(z.string()),
  urlVideo: nulo(texto(0, 500)),
  duracionMin: nulo(z.number().int().min(1).max(600)),
  resumen: nulo(texto(0, 500)),
  versiculos: z.array(texto(0, 80)).max(10),
  destacada: z.boolean(),
  fotoId,
};
const camposSerie = {
  nombre: texto(2, 80),
  slug,
  descripcion: nulo(texto(0, 1000)),
  fotoId,
};

const tipoCreable = z.enum(['ministerios', 'eventos', 'predicas', 'series']);

/** Crear: obligatorios los que pide el pedido; el resto con el valor por defecto de la API. */
function esquemaCrear(campos: Record<string, z.ZodType>, obligatorios: string[]) {
  const forma: Record<string, z.ZodType> = {};
  for (const [k, v] of Object.entries(campos)) forma[k] = obligatorios.includes(k) ? v : v.optional();
  return z.strictObject(forma);
}

/** Editar: `clave` más todos los campos, opcionales; lo que no se pasa no se toca. */
function esquemaEditar(campos: Record<string, z.ZodType>) {
  const forma: Record<string, z.ZodType> = { clave: z.string().min(1).describe('Id o slug del elemento a editar.') };
  for (const [k, v] of Object.entries(campos)) forma[k] = v.optional();
  return z.strictObject(forma);
}

const AVISO_BORRADOR = 'Queda en borrador: no se ve en la web hasta que alguien lo publique desde el panel.';
const AVISO_EDITAR = 'Solo funciona con elementos en borrador y los deja en borrador. Solo cambia los campos que pasás.';
const AVISO_CAMPOS = 'Los campos desconocidos se rechazan con un error.';

// La API exige estos campos: se completan acá cuando no se pasan.
const DEFECTOS: Record<Tipo, Record<string, unknown>> = {
  ministerios: { actividades: [] },
  eventos: { repeticion: 'ninguna', destacado: false },
  predicas: { versiculos: [], destacada: false },
  series: {},
};

/** Arma el servidor con todas las herramientas, sin conectarlo (index.ts lo conecta por stdio). */
export function crearServidor(cliente: ClienteApi): McpServer {
  const servidor = new McpServer({ name: 'ccvida-contenido', version: '0.0.1' });

  function registrarCrear(nombre: string, tipo: Tipo, descripcion: string, esquema: z.ZodObject) {
    servidor.registerTool(nombre, { description: `${descripcion} ${AVISO_BORRADOR} ${AVISO_CAMPOS}`, inputSchema: esquema }, (args) =>
      responder(() => crearContenido(cliente, tipo, { ...DEFECTOS[tipo], ...(args as Record<string, unknown>) })),
    );
  }

  function registrarEditar(nombre: string, tipo: Tipo, descripcion: string, esquema: z.ZodObject) {
    servidor.registerTool(nombre, { description: `${descripcion} ${AVISO_EDITAR} ${AVISO_CAMPOS}`, inputSchema: esquema }, (args) => {
      const { clave, ...cambios } = args as { clave: string } & Record<string, unknown>;
      return responder(() => editarContenido(cliente, tipo, clave, cambios));
    });
  }

  servidor.registerTool(
    'listar_contenido',
    {
      description: 'Lista ministerios, eventos, prédicas, series o fotos (id, título, slug y estado; de las fotos, las 40 más recientes con id, texto alternativo y url).',
      inputSchema: z.strictObject({ tipo: z.enum(['ministerios', 'eventos', 'predicas', 'series', 'fotos']) }),
    },
    ({ tipo }) => responder(() => listarContenido(cliente, tipo)),
  );

  servidor.registerTool(
    'ver_contenido',
    {
      description: 'Devuelve todos los campos de un ministerio, evento, prédica o serie, buscándolo por id o por slug.',
      inputSchema: z.strictObject({ tipo: tipoCreable, clave: z.string().min(1).describe('Id o slug.') }),
    },
    ({ tipo, clave }) => responder(() => verContenido(cliente, tipo, clave)),
  );

  registrarCrear(
    'crear_ministerio',
    'ministerios',
    'Crea un ministerio. Obligatorios: nombre y orden. Si no pasás actividades queda sin actividades.',
    esquemaCrear(camposMinisterio, ['nombre', 'orden']),
  );
  registrarCrear(
    'crear_evento',
    'eventos',
    'Crea un evento. Obligatorios: titulo e inicio. Por defecto no se repite y no es destacado.',
    esquemaCrear(camposEvento, ['titulo', 'inicio']),
  );
  registrarCrear(
    'crear_predica',
    'predicas',
    'Crea una prédica. Obligatorios: titulo, fecha (AAAA-MM-DD) y predicador. Por defecto sin versículos y no destacada.',
    esquemaCrear(camposPredica, ['titulo', 'fecha', 'predicador']),
  );
  registrarCrear('crear_serie', 'series', 'Crea una serie de prédicas. Obligatorio: nombre.', esquemaCrear(camposSerie, ['nombre']));

  registrarEditar('editar_ministerio', 'ministerios', 'Edita un ministerio.', esquemaEditar(camposMinisterio));
  registrarEditar('editar_evento', 'eventos', 'Edita un evento.', esquemaEditar(camposEvento));
  registrarEditar('editar_predica', 'predicas', 'Edita una prédica.', esquemaEditar(camposPredica));
  registrarEditar('editar_serie', 'series', 'Edita una serie de prédicas.', esquemaEditar(camposSerie));

  servidor.registerTool(
    'subir_foto',
    {
      description:
        'Sube una foto de esta computadora (JPG, PNG, WebP o AVIF, hasta 15 MB) a la biblioteca de fotos y devuelve su id para usarlo como fotoId. El texto alternativo describe la imagen para quien no la ve.',
      inputSchema: z.strictObject({
        ruta: z.string().min(1).describe('Ruta absoluta del archivo en esta computadora.'),
        textoAlternativo: z.string().min(3).max(300),
        credito: z.string().max(200).optional(),
      }),
    },
    (args) => responder(() => subirFoto(cliente, args)),
  );

  servidor.registerTool(
    'ver_textos',
    { description: 'Devuelve los textos editables del sitio (lema, dirección, preguntas frecuentes, pastores, etc.).', inputSchema: z.strictObject({}) },
    () => responder(() => verTextos(cliente)),
  );

  servidor.registerTool(
    'editar_textos',
    {
      description:
        'Cambia textos del sitio. A diferencia de los borradores, esto sale en la web enseguida. Sin confirmar: true no guarda nada y devuelve los cambios (antes y después). Mostrale esos cambios a la persona y pedí confirmación antes de mandar confirmar: true. Pasá solo lo que cambia: los objetos se mezclan (pastores.cita no pisa pastores.nombres) y las listas se reemplazan enteras. Los campos que no existen se rechazan.',
      inputSchema: z.strictObject({
        cambios: z.record(z.string(), z.unknown()).describe('Objeto con los campos a cambiar, con la misma forma que devuelve ver_textos.'),
        confirmar: z.boolean().optional().describe('Solo true después de que la persona haya confirmado.'),
      }),
    },
    ({ cambios, confirmar }) => responder(() => editarTextos(cliente, cambios, confirmar === true)),
  );

  servidor.registerTool(
    'link_vista_previa',
    {
      description:
        'Genera un link de vista previa (válido 1 hora) para ver un ministerio, evento o prédica, borrador incluido. Devuelve null para series o si la vista previa no está activada en la API.',
      inputSchema: z.strictObject({ tipo: tipoCreable, slug: z.string().min(1) }),
    },
    ({ tipo, slug }) => responder(async () => ({ url: await linkVistaPrevia(cliente, tipo, slug) })),
  );

  return servidor;
}
