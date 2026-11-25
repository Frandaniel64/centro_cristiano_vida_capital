// Cableado de las herramientas: el servidor real por un transporte en memoria y la API con un fetch falso.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ClienteApi } from './cliente.js';
import { crearServidor } from './servidor.js';

const json = (estado: number, cuerpo: unknown) =>
  new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'content-type': 'application/json' } });

const guardado = {
  id: 'm1',
  slug: 'jovenes',
  nombre: 'Jóvenes',
  edades: '15 a 25',
  horario: 'Sábados 20 h',
  resumen: 'Resumen guardado',
  descripcion: null,
  actividades: ['Reunión', 'Campamento'],
  color: '#1a73e8',
  orden: 3,
  foto: { id: 'f1', url: 'http://x/f1.jpg' },
  estado: 'borrador',
  actualizado: '2026-11-01T00:00:00.000Z',
};

type Llamada = { metodo: string; url: string; cuerpo: unknown };

describe('servidor MCP', () => {
  let llamadas: Llamada[];
  let respuesta: (metodo: string, url: string) => Response;
  let cliente: Client;

  beforeEach(async () => {
    llamadas = [];
    respuesta = (metodo, url) => {
      if (url.endsWith('/api/admin/vista-previa')) return json(200, { url: 'http://web/vista' });
      if (metodo === 'GET' && url.endsWith('/api/admin/ministerios')) return json(200, [guardado]);
      return json(200, { ...guardado, ...(llamadas.at(-1)?.cuerpo as object) });
    };
    const fetchFn = vi.fn(async (url: string, init: RequestInit) => {
      const metodo = init.method ?? 'GET';
      llamadas.push({ metodo, url, cuerpo: typeof init.body === 'string' ? JSON.parse(init.body) : undefined });
      return respuesta(metodo, url);
    });
    const servidor = crearServidor(new ClienteApi({ apiUrl: 'http://api', token: 'tok' }, fetchFn as unknown as typeof fetch));
    const [lado1, lado2] = InMemoryTransport.createLinkedPair();
    cliente = new Client({ name: 'test', version: '0.0.0' });
    await Promise.all([servidor.connect(lado1), cliente.connect(lado2)]);
  });

  afterEach(async () => {
    await cliente.close();
  });

  it('expone las 15 herramientas', async () => {
    const { tools } = await cliente.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        'listar_contenido',
        'ver_contenido',
        'crear_ministerio',
        'crear_evento',
        'crear_predica',
        'crear_serie',
        'editar_ministerio',
        'editar_evento',
        'editar_predica',
        'editar_serie',
        'subir_foto',
        'ver_textos',
        'editar_textos',
        'link_vista_previa',
        'cambiar_estado',
      ].sort(),
    );
  });

  it('crear_ministerio manda los valores por defecto y estado borrador', async () => {
    const res = await cliente.callTool({ name: 'crear_ministerio', arguments: { nombre: 'Jóvenes', orden: 1 } });
    expect(res.isError).toBeFalsy();
    const post = llamadas.find((l) => l.metodo === 'POST' && l.url === 'http://api/api/admin/ministerios');
    expect(post?.cuerpo).toEqual({ fotoId: null, actividades: [], nombre: 'Jóvenes', orden: 1, estado: 'borrador' });
  });

  it('editar_ministerio no pisa con valores por defecto lo que no se pasó', async () => {
    const res = await cliente.callTool({ name: 'editar_ministerio', arguments: { clave: 'jovenes', resumen: 'Nuevo' } });
    expect(res.isError).toBeFalsy();
    const put = llamadas.find((l) => l.metodo === 'PUT');
    expect(put?.url).toBe('http://api/api/admin/ministerios/m1');
    expect(put?.cuerpo).toMatchObject({
      resumen: 'Nuevo',
      actividades: ['Reunión', 'Campamento'],
      orden: 3,
      color: '#1a73e8',
      fotoId: 'f1',
      estado: 'borrador',
    });
  });

  it('rechaza un campo desconocido sin llamar a la API', async () => {
    const res = await cliente
      .callTool({ name: 'crear_serie', arguments: { nombre: 'Serie', inventado: 1 } })
      .catch((e: Error) => ({ isError: true, content: [{ type: 'text', text: e.message }] }));
    expect(res.isError).toBe(true);
    expect(JSON.stringify(res.content)).toContain('inventado');
    expect(llamadas).toHaveLength(0);
  });

  it('un ErrorHerramienta sale como isError con su mensaje', async () => {
    respuesta = () => json(400, { mensaje: 'Revisá los datos marcados.', campos: { nombre: 'Muy corto' } });
    const res = await cliente.callTool({ name: 'crear_serie', arguments: { nombre: 'Serie' } });
    expect(res.isError).toBe(true);
    expect(res.content).toEqual([{ type: 'text', text: 'Revisá los datos marcados.\n- nombre: Muy corto' }]);
  });
});
