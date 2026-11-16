import type { TextosAdmin, TextosSitio } from '@ccvida/shared';
import { ErrorHerramienta, type ClienteApi } from './cliente.js';

export interface CambioTexto {
  campo: string;
  antes: unknown;
  despues: unknown;
}

const AVISO = 'Al confirmar, esto sale en la web enseguida.';

type Objeto = Record<string, unknown>;

const esObjeto = (v: unknown): v is Objeto => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Rechaza campos que no existen o con otro formato: la API los descartaría en silencio. */
function validar(base: unknown, cambios: unknown, ruta: string): void {
  const baseObjeto = esObjeto(base);
  if (baseObjeto !== esObjeto(cambios)) throw new ErrorHerramienta(`El campo "${ruta}" tiene otro formato.`);
  if (!baseObjeto || !esObjeto(cambios)) return;
  const lista = Object.keys(base).join(', ');
  for (const [clave, valor] of Object.entries(cambios)) {
    const camino = ruta ? `${ruta}.${clave}` : clave;
    if (!Object.hasOwn(base, clave)) {
      throw new ErrorHerramienta(
        ruta
          ? `No existe el campo "${camino}". Los campos de ${ruta} son: ${lista}.`
          : `No existe el campo "${camino}". Los campos son: ${lista}.`,
      );
    }
    validar(base[clave], valor, camino);
  }
}

/** Objetos planos se mezclan; arrays y valores se reemplazan. */
function mezclar(base: unknown, cambios: unknown): unknown {
  if (!esObjeto(base) || !esObjeto(cambios)) return cambios;
  const salida: Objeto = { ...base };
  for (const [clave, valor] of Object.entries(cambios)) salida[clave] = mezclar(base[clave], valor);
  return salida;
}

/** Hojas que cambian, con ruta de puntos; un array que cambia es una sola entrada. */
function diferencias(antes: unknown, despues: unknown, ruta: string, salida: CambioTexto[]): void {
  if (esObjeto(antes) && esObjeto(despues)) {
    for (const clave of Object.keys(despues)) {
      diferencias(antes[clave], despues[clave], ruta ? `${ruta}.${clave}` : clave, salida);
    }
    return;
  }
  if (JSON.stringify(antes) !== JSON.stringify(despues)) salida.push({ campo: ruta, antes, despues });
}

export async function verTextos(cliente: ClienteApi): Promise<TextosSitio> {
  const { fotos: _fotos, ...textos } = await cliente.get<TextosAdmin>('/api/admin/textos');
  return textos;
}

export async function editarTextos(
  cliente: ClienteApi,
  cambios: Record<string, unknown>,
  confirmar = false,
): Promise<{ guardado: boolean; cambios: CambioTexto[]; aviso?: string }> {
  const actuales = await verTextos(cliente);
  validar(actuales, cambios, '');
  const nuevos = mezclar(actuales, cambios) as TextosSitio;
  const lista: CambioTexto[] = [];
  diferencias(actuales, nuevos, '', lista);

  if (lista.length === 0) return { guardado: false, cambios: [] };
  if (!confirmar) return { guardado: false, cambios: lista, aviso: AVISO };
  await cliente.put('/api/admin/textos', nuevos);
  return { guardado: true, cambios: lista };
}
