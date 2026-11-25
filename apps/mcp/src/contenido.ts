import type { EventoAdmin, MedioAdmin, MinisterioAdmin, PredicaAdmin, SerieAdmin } from '@ccvida/shared';
import { ErrorHerramienta, type ClienteApi } from './cliente.js';

export type Tipo = 'ministerios' | 'eventos' | 'predicas' | 'series';

type Elemento = MinisterioAdmin | EventoAdmin | PredicaAdmin | SerieAdmin;

export interface ResultadoGuardado {
  id: string;
  slug: string;
  estado: string;
  vistaPrevia: string | null;
}

const PREFIJO_WEB: Record<Tipo, string | null> = {
  ministerios: '/ministerios/',
  eventos: '/eventos/',
  predicas: '/predicas/',
  series: null,
};

const tituloDe = (e: Elemento): string => ('nombre' in e ? e.nombre : e.titulo);

async function listar(cliente: ClienteApi, tipo: Tipo): Promise<Elemento[]> {
  return cliente.get<Elemento[]>(`/api/admin/${tipo}`);
}

export async function listarContenido(cliente: ClienteApi, tipo: Tipo | 'fotos') {
  if (tipo === 'fotos') {
    const { items } = await cliente.get<{ items: MedioAdmin[]; total: number }>('/api/admin/medios');
    return items.map((m) => ({ id: m.id, textoAlternativo: m.textoAlternativo, url: m.url }));
  }
  const elementos = await listar(cliente, tipo);
  return elementos.map((e) => ({ id: e.id, titulo: tituloDe(e), slug: e.slug, estado: e.estado }));
}

export async function verContenido(cliente: ClienteApi, tipo: Tipo, clave: string): Promise<Elemento> {
  const elemento = (await listar(cliente, tipo)).find((e) => e.id === clave || e.slug === clave);
  if (!elemento) throw new ErrorHerramienta(`No encontré ${tipo} "${clave}".`);
  return elemento;
}

export async function linkVistaPrevia(cliente: ClienteApi, tipo: Tipo, slug: string): Promise<string | null> {
  const prefijo = PREFIJO_WEB[tipo];
  if (!prefijo) return null;
  try {
    const { url } = await cliente.post<{ url: string }>('/api/admin/vista-previa', { ruta: `${prefijo}${slug}` });
    return url;
  } catch (e) {
    if (e instanceof ErrorHerramienta && e.estado === 503) return null;
    throw e;
  }
}

// La operación ya salió bien: un fallo del link de vista previa no debe hacerla parecer fallida.
async function resultado(cliente: ClienteApi, tipo: Tipo, guardado: Elemento): Promise<ResultadoGuardado> {
  const vistaPrevia = await linkVistaPrevia(cliente, tipo, guardado.slug).catch(() => null);
  return { id: guardado.id, slug: guardado.slug, estado: guardado.estado, vistaPrevia };
}

export async function crearContenido(
  cliente: ClienteApi,
  tipo: Tipo,
  datos: Record<string, unknown>,
): Promise<ResultadoGuardado> {
  const creado = await cliente.post<Elemento>(`/api/admin/${tipo}`, { fotoId: null, ...datos, estado: 'borrador' });
  return resultado(cliente, tipo, creado);
}

export async function editarContenido(
  cliente: ClienteApi,
  tipo: Tipo,
  clave: string,
  cambios: Record<string, unknown>,
): Promise<ResultadoGuardado> {
  const actual = await verContenido(cliente, tipo, clave);
  if (actual.estado !== 'borrador') {
    throw new ErrorHerramienta('Está publicado: pasalo a borrador (con cambiar_estado o desde el panel) para editarlo con el MCP.');
  }
  const { estado: _ignorado, ...permitidos } = cambios;
  return guardar(cliente, tipo, actual, { ...permitidos, estado: 'borrador' });
}

/** PUT con todos los campos actuales más los cambios (la API pide el elemento completo). */
async function guardar(cliente: ClienteApi, tipo: Tipo, actual: Elemento, cambios: Record<string, unknown>) {
  const { id, actualizado: _actualizado, foto, predicas: _predicas, ...resto } = actual as Elemento & { predicas?: number };
  const cuerpo = { ...resto, fotoId: foto?.id ?? null, ...cambios };
  const guardado = await cliente.put<Elemento>(`/api/admin/${tipo}/${id}`, cuerpo);
  return resultado(cliente, tipo, guardado);
}

/** Publica o pasa a borrador sin tocar ningún otro campo. */
export async function cambiarEstado(
  cliente: ClienteApi,
  tipo: Tipo,
  clave: string,
  estado: 'publicado' | 'borrador',
): Promise<ResultadoGuardado> {
  const actual = await verContenido(cliente, tipo, clave);
  if (actual.estado === estado) return resultado(cliente, tipo, actual);
  return guardar(cliente, tipo, actual, { estado });
}
