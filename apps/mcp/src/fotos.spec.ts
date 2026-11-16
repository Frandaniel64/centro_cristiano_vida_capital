import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { ClienteApi } from './cliente.js';
import { subirFoto } from './fotos.js';

const fixture = fileURLToPath(new URL('../test/fixtures/foto.jpg', import.meta.url));

function armar() {
  const pedidos: { metodo: string; ruta: string; form: FormData }[] = [];
  const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
    pedidos.push({ metodo: init.method ?? 'GET', ruta: url.replace('http://x', ''), form: init.body as FormData });
    return new Response(JSON.stringify({ id: 'f1', url: 'http://u/f1', textoAlternativo: 'Coro', tamanos: {} }), {
      status: 201,
      headers: { 'content-type': 'application/json' },
    });
  });
  const cliente = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
  return { cliente, pedidos, fetchFn };
}

describe('subirFoto', () => {
  it('ruta inexistente', async () => {
    const { cliente, fetchFn } = armar();
    const ruta = 'C:/no/existe/foto.jpg';
    await expect(subirFoto(cliente, { ruta, textoAlternativo: 'Coro cantando' })).rejects.toThrow(
      `No encontré el archivo ${ruta}.`,
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('extensión no permitida (.gif)', async () => {
    const { cliente, fetchFn } = armar();
    const fs = { stat: vi.fn(async () => ({ size: 10 })), readFile: vi.fn(async () => Buffer.from('x')) };
    await expect(subirFoto(cliente, { ruta: 'a/b.gif', textoAlternativo: 'Coro cantando' }, fs)).rejects.toThrow(
      'La foto tiene que ser JPG, PNG, WebP o AVIF.',
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('más de 15 MB', async () => {
    const { cliente, fetchFn } = armar();
    const fs = { stat: vi.fn(async () => ({ size: 15 * 1024 * 1024 + 1 })), readFile: vi.fn(async () => Buffer.from('x')) };
    await expect(subirFoto(cliente, { ruta: 'a/b.png', textoAlternativo: 'Coro cantando' }, fs)).rejects.toThrow(
      'La foto pesa más de 15 MB.',
    );
    expect(fs.readFile).not.toHaveBeenCalled();
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('subida OK manda archivo, textoAlternativo y credito', async () => {
    const { cliente, pedidos } = armar();
    const r = await subirFoto(cliente, { ruta: fixture, textoAlternativo: 'Coro cantando', credito: 'Ana' });
    expect(r).toEqual({ id: 'f1', url: 'http://u/f1', textoAlternativo: 'Coro' });
    expect(pedidos[0].metodo).toBe('POST');
    expect(pedidos[0].ruta).toBe('/api/admin/medios');
    const form = pedidos[0].form;
    expect(form.get('textoAlternativo')).toBe('Coro cantando');
    expect(form.get('credito')).toBe('Ana');
    const archivo = form.get('archivo') as File;
    expect(archivo.type).toBe('image/jpeg');
    expect(archivo.name).toBe('foto.jpg');
    expect(archivo.size).toBeGreaterThan(0);
  });

  it('acepta extensión en mayúsculas', async () => {
    const { cliente, pedidos } = armar();
    const fs = { stat: async () => ({ size: 10 }), readFile: async () => Buffer.from('x') };
    await subirFoto(cliente, { ruta: 'carpeta/A.JPG', textoAlternativo: 'Coro cantando' }, fs);
    expect((pedidos[0].form.get('archivo') as File).type).toBe('image/jpeg');
  });

  it('sin crédito no manda el campo', async () => {
    const { cliente, pedidos } = armar();
    await subirFoto(cliente, { ruta: fixture, textoAlternativo: 'Coro cantando' });
    expect(pedidos[0].form.has('credito')).toBe(false);
  });
});
