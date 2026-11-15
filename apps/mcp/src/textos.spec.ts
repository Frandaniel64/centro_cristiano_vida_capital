import { describe, expect, it, vi } from 'vitest';
import { ClienteApi } from './cliente.js';
import { editarTextos, verTextos } from './textos.js';

const actuales = {
  lema: 'Una familia',
  youtube: 'https://youtube.com/old',
  pastores: { nombres: 'Juan y Ana', texto: 'Texto', cita: 'vieja' },
  creemos: [{ titulo: 'A', texto: 'a' }],
  fotos: { f1: { id: 'f1', url: 'u' } },
};

function armar() {
  const pedidos: { metodo: string; ruta: string; cuerpo: unknown }[] = [];
  const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
    pedidos.push({
      metodo: init.method ?? 'GET',
      ruta: url.replace('http://x', ''),
      cuerpo: init.body ? JSON.parse(init.body as string) : undefined,
    });
    return new Response(JSON.stringify(actuales), { status: 200, headers: { 'content-type': 'application/json' } });
  });
  const cliente = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
  return { cliente, pedidos };
}

describe('textos', () => {
  it('verTextos saca fotos', async () => {
    const { cliente } = armar();
    const t = await verTextos(cliente);
    expect(t).not.toHaveProperty('fotos');
    expect(t.lema).toBe('Una familia');
  });

  it('sin confirmar no hace PUT y lista solo pastores.cita', async () => {
    const { cliente, pedidos } = armar();
    const r = await editarTextos(cliente, { pastores: { cita: 'x' } });
    expect(pedidos.some((p) => p.metodo === 'PUT')).toBe(false);
    expect(r).toEqual({
      guardado: false,
      cambios: [{ campo: 'pastores.cita', antes: 'vieja', despues: 'x' }],
      aviso: 'Al confirmar, esto sale en la web enseguida.',
    });
  });

  it('con confirmar el PUT conserva el resto y no lleva fotos', async () => {
    const { cliente, pedidos } = armar();
    const r = await editarTextos(cliente, { pastores: { cita: 'x' } }, true);
    const put = pedidos.find((p) => p.metodo === 'PUT')!;
    expect(put.ruta).toBe('/api/admin/textos');
    expect(put.cuerpo).toEqual({
      lema: 'Una familia',
      youtube: 'https://youtube.com/old',
      pastores: { nombres: 'Juan y Ana', texto: 'Texto', cita: 'x' },
      creemos: [{ titulo: 'A', texto: 'a' }],
    });
    expect(r).toEqual({ guardado: true, cambios: [{ campo: 'pastores.cita', antes: 'vieja', despues: 'x' }] });
  });

  it('cambio a youtube aparece en la lista', async () => {
    const { cliente } = armar();
    const r = await editarTextos(cliente, { youtube: 'https://youtube.com/new' });
    expect(r.cambios).toEqual([{ campo: 'youtube', antes: 'https://youtube.com/old', despues: 'https://youtube.com/new' }]);
  });

  it('un array que cambia es una sola entrada', async () => {
    const { cliente } = armar();
    const r = await editarTextos(cliente, { creemos: [{ titulo: 'B', texto: 'b' }] });
    expect(r.cambios).toEqual([
      { campo: 'creemos', antes: [{ titulo: 'A', texto: 'a' }], despues: [{ titulo: 'B', texto: 'b' }] },
    ]);
  });

  it('sin cambios no hace PUT aunque se confirme', async () => {
    const { cliente, pedidos } = armar();
    const r = await editarTextos(cliente, { lema: 'Una familia' }, true);
    expect(r).toEqual({ guardado: false, cambios: [] });
    expect(pedidos.some((p) => p.metodo === 'PUT')).toBe(false);
  });
});
