import { describe, expect, it, vi } from 'vitest';
import { ClienteApi } from './cliente.js';
import { cambiarEstado, crearContenido, editarContenido, listarContenido, verContenido } from './contenido.js';

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'content-type': 'application/json' } });

interface Pedido {
  metodo: string;
  ruta: string;
  cuerpo: unknown;
}

function armar(respuestas: Record<string, () => Response>) {
  const pedidos: Pedido[] = [];
  const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
    const ruta = url.replace('http://x', '');
    const metodo = init.method ?? 'GET';
    pedidos.push({ metodo, ruta, cuerpo: init.body ? JSON.parse(init.body as string) : undefined });
    const r = respuestas[`${metodo} ${ruta}`];
    if (!r) throw new Error(`pedido inesperado ${metodo} ${ruta}`);
    return r();
  });
  const cliente = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
  return { cliente, pedidos };
}

const ministerio = {
  id: 'm1',
  slug: 'jovenes',
  estado: 'borrador',
  nombre: 'Jóvenes',
  resumen: 'viejo',
  actividades: ['a', 'b'],
  foto: { id: 'f1', url: 'u', tamanos: {}, textoAlternativo: 't' },
  actualizado: '2026-01-01',
  orden: 1,
};

describe('contenido', () => {
  it('crear fuerza estado borrador', async () => {
    const { cliente, pedidos } = armar({
      'POST /api/admin/ministerios': () => json(201, { ...ministerio }),
      'POST /api/admin/vista-previa': () => json(200, { url: 'http://prev/1' }),
    });
    await crearContenido(cliente, 'ministerios', { nombre: 'X', estado: 'publicado' });
    expect((pedidos[0].cuerpo as Record<string, unknown>).estado).toBe('borrador');
  });

  it('editar un publicado da el error exacto y no hace PUT', async () => {
    const { cliente, pedidos } = armar({
      'GET /api/admin/ministerios': () => json(200, [{ ...ministerio, estado: 'publicado' }]),
    });
    await expect(editarContenido(cliente, 'ministerios', 'm1', { resumen: 'n' })).rejects.toThrow(
      'Está publicado: pasalo a borrador (con cambiar_estado o desde el panel) para editarlo con el MCP.',
    );
    expect(pedidos.some((p) => p.metodo === 'PUT')).toBe(false);
  });

  it('editar solo resumen conserva actividades, fotoId y slug', async () => {
    const { cliente, pedidos } = armar({
      'GET /api/admin/ministerios': () => json(200, [ministerio]),
      'PUT /api/admin/ministerios/m1': () => json(200, { ...ministerio, resumen: 'nuevo' }),
      'POST /api/admin/vista-previa': () => json(200, { url: 'http://prev/2' }),
    });
    const r = await editarContenido(cliente, 'ministerios', 'jovenes', { resumen: 'nuevo', estado: 'publicado' });
    const put = pedidos.find((p) => p.metodo === 'PUT')!.cuerpo as Record<string, unknown>;
    expect(put).toMatchObject({ resumen: 'nuevo', actividades: ['a', 'b'], fotoId: 'f1', slug: 'jovenes', estado: 'borrador' });
    expect(put).not.toHaveProperty('id');
    expect(put).not.toHaveProperty('actualizado');
    expect(put).not.toHaveProperty('foto');
    expect(r.vistaPrevia).toBe('http://prev/2');
  });

  it('cambiar estado publica y conserva el resto de los campos', async () => {
    const { cliente, pedidos } = armar({
      'GET /api/admin/ministerios': () => json(200, [ministerio]),
      'PUT /api/admin/ministerios/m1': () => json(200, { ...ministerio, estado: 'publicado' }),
      'POST /api/admin/vista-previa': () => json(200, { url: 'http://prev/3' }),
    });
    const r = await cambiarEstado(cliente, 'ministerios', 'jovenes', 'publicado');
    const put = pedidos.find((p) => p.metodo === 'PUT')!.cuerpo as Record<string, unknown>;
    expect(put).toMatchObject({ estado: 'publicado', resumen: 'viejo', actividades: ['a', 'b'], fotoId: 'f1', slug: 'jovenes' });
    expect(put).not.toHaveProperty('id');
    expect(put).not.toHaveProperty('foto');
    expect(r.estado).toBe('publicado');
  });

  it('cambiar estado despublica', async () => {
    const { cliente, pedidos } = armar({
      'GET /api/admin/ministerios': () => json(200, [{ ...ministerio, estado: 'publicado' }]),
      'PUT /api/admin/ministerios/m1': () => json(200, ministerio),
      'POST /api/admin/vista-previa': () => json(200, { url: 'http://prev/4' }),
    });
    await cambiarEstado(cliente, 'ministerios', 'm1', 'borrador');
    expect((pedidos.find((p) => p.metodo === 'PUT')!.cuerpo as Record<string, unknown>).estado).toBe('borrador');
  });

  it('cambiar estado al que ya tiene no hace PUT', async () => {
    const { cliente, pedidos } = armar({
      'GET /api/admin/ministerios': () => json(200, [ministerio]),
      'POST /api/admin/vista-previa': () => json(200, { url: 'http://prev/5' }),
    });
    const r = await cambiarEstado(cliente, 'ministerios', 'm1', 'borrador');
    expect(pedidos.some((p) => p.metodo === 'PUT')).toBe(false);
    expect(r.estado).toBe('borrador');
  });

  it('editar con clave inexistente', async () => {
    const { cliente } = armar({ 'GET /api/admin/ministerios': () => json(200, [ministerio]) });
    await expect(editarContenido(cliente, 'ministerios', 'x', {})).rejects.toThrow('No encontré ministerios "x".');
  });

  it('crear evento devuelve la vista previa; con 503 la deja en null', async () => {
    const evento = { id: 'e1', slug: 'cena', estado: 'borrador' };
    const ok = armar({
      'POST /api/admin/eventos': () => json(201, evento),
      'POST /api/admin/vista-previa': () => json(200, { url: 'http://prev/e' }),
    });
    expect(await crearContenido(ok.cliente, 'eventos', { titulo: 'Cena' })).toEqual({
      id: 'e1',
      slug: 'cena',
      estado: 'borrador',
      vistaPrevia: 'http://prev/e',
    });
    expect(ok.pedidos[1].cuerpo).toEqual({ ruta: '/eventos/cena' });

    const sin = armar({
      'POST /api/admin/eventos': () => json(201, evento),
      'POST /api/admin/vista-previa': () => json(503, { mensaje: 'no configurada' }),
    });
    expect((await crearContenido(sin.cliente, 'eventos', { titulo: 'Cena' })).vistaPrevia).toBeNull();
  });

  it('series no pide vista previa', async () => {
    const { cliente, pedidos } = armar({
      'POST /api/admin/series': () => json(201, { id: 's1', slug: 's', estado: 'borrador' }),
    });
    const r = await crearContenido(cliente, 'series', { nombre: 'S' });
    expect(r.vistaPrevia).toBeNull();
    expect(pedidos).toHaveLength(1);
  });

  it('listar prédicas mapea titulo', async () => {
    const { cliente } = armar({
      'GET /api/admin/predicas': () => json(200, [{ id: 'p1', slug: 'a', estado: 'borrador', titulo: 'Fe' }]),
    });
    expect(await listarContenido(cliente, 'predicas')).toEqual([{ id: 'p1', titulo: 'Fe', slug: 'a', estado: 'borrador' }]);
  });

  it('listar fotos usa medios', async () => {
    const { cliente } = armar({
      'GET /api/admin/medios': () => json(200, { items: [{ id: 'f', url: 'u', textoAlternativo: 't', tamanos: {} }], total: 1 }),
    });
    expect(await listarContenido(cliente, 'fotos')).toEqual([{ id: 'f', textoAlternativo: 't', url: 'u' }]);
  });
});
