import { describe, expect, it, vi } from 'vitest';
import { ClienteApi, ErrorHerramienta } from './cliente.js';
import { RUTA_ENV_POR_DEFECTO } from './config.js';

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'content-type': 'application/json' } });

describe('ClienteApi', () => {
  it('sin token falla con un mensaje claro que incluye la ruta del archivo', async () => {
    const fetchFn = vi.fn();
    const c = new ClienteApi({ apiUrl: 'http://x', token: null }, fetchFn as unknown as typeof fetch);
    await expect(c.get('/api/admin/algo')).rejects.toThrow(
      `Falta el token del MCP: corré npm run crear-token-mcp -w @ccvida/api y guardalo en ${RUTA_ENV_POR_DEFECTO}`,
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('manda Authorization Bearer y devuelve el JSON', async () => {
    const fetchFn = vi.fn(async () => json(200, { ok: 1 }));
    const c = new ClienteApi({ apiUrl: 'http://x', token: 'tok' }, fetchFn as unknown as typeof fetch);
    expect(await c.get('/api/admin/a')).toEqual({ ok: 1 });
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('http://x/api/admin/a');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer tok');
  });

  it('post y put mandan el cuerpo como JSON', async () => {
    const fetchFn = vi.fn(async () => json(200, {}));
    const c = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
    await c.post('/a', { n: 1 });
    await c.put('/b', { n: 2 });
    const [, p] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    const [, u] = fetchFn.mock.calls[1] as unknown as [string, RequestInit];
    expect(p.method).toBe('POST');
    expect(p.body).toBe('{"n":1}');
    expect((p.headers as Record<string, string>)['Content-Type']).toBe('application/json');
    expect(u.method).toBe('PUT');
  });

  it('subir manda el FormData sin Content-Type', async () => {
    const fetchFn = vi.fn(async () => json(200, {}));
    const c = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
    const form = new FormData();
    await c.subir('/m', form);
    const [, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(form);
    expect((init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('400 con campos: mensaje y un campo por línea, con el estado', async () => {
    const fetchFn = vi.fn(async () =>
      json(400, { mensaje: 'Datos inválidos', campos: { titulo: 'Es obligatorio', fecha: 'Fecha inválida' } }),
    );
    const c = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
    const e = await c.post('/a', {}).catch((x) => x);
    expect(e).toBeInstanceOf(ErrorHerramienta);
    expect(e.message).toBe('Datos inválidos\n- titulo: Es obligatorio\n- fecha: Fecha inválida');
    expect(e.estado).toBe(400);
  });

  it('401: el token venció o no es válido, con cómo generar otro y el estado', async () => {
    const fetchFn = vi.fn(async () => json(401, { mensaje: 'Sesión vencida' }));
    const c = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
    const e = await c.get('/a').catch((x) => x);
    expect(e).toBeInstanceOf(ErrorHerramienta);
    expect(e.message).toBe(
      `El token del MCP venció o no es válido: generá uno nuevo con npm run crear-token-mcp -w @ccvida/api y guardalo en ${RUTA_ENV_POR_DEFECTO}.`,
    );
    expect(e.estado).toBe(401);
  });

  it('fetch que rechaza: no se pudo conectar', async () => {
    const fetchFn = vi.fn(async () => {
      throw new TypeError('fetch failed');
    });
    const c = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
    const e = await c.get('/a').catch((x) => x);
    expect(e).toBeInstanceOf(ErrorHerramienta);
    expect(e.message).toBe('No se pudo conectar con la API en http://x.');
    expect(e.estado).toBeUndefined();
  });

  it('error sin cuerpo JSON usa un mensaje genérico con el estado', async () => {
    const fetchFn = vi.fn(async () => new Response('boom', { status: 503 }));
    const c = new ClienteApi({ apiUrl: 'http://x', token: 't' }, fetchFn as unknown as typeof fetch);
    const e = await c.get('/a').catch((x) => x);
    expect(e.estado).toBe(503);
    expect(e.message).toContain('503');
  });
});
