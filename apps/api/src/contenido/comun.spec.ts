import { slugDe, slugLibre } from './comun.js';

describe('slugDe', () => {
  it('saca tildes, mayúsculas y signos', () => {
    expect(slugDe('¡Encuentro de Jóvenes! 2026')).toBe('encuentro-de-jovenes-2026');
    expect(slugDe('Él no podía orar, yo puedo')).toBe('el-no-podia-orar-yo-puedo');
  });

  it('nunca queda vacío', () => {
    expect(slugDe('¿?')).toBe('sin-titulo');
  });
});

describe('slugLibre', () => {
  const tomados = new Map([
    ['bautismo', 'a'],
    ['bautismo-2', 'b'],
  ]);
  const existe = async (s: string) => (tomados.has(s) ? { id: tomados.get(s)! } : null);

  it('agrega un número si el slug está tomado', async () => {
    expect(await slugLibre(existe, 'Bautismo', undefined)).toBe('bautismo-3');
  });

  it('al editar, conserva su propio slug', async () => {
    expect(await slugLibre(existe, 'Bautismo', undefined, 'a')).toBe('bautismo');
  });

  it('un slug escrito a mano que ya usa otro da error en el campo', async () => {
    await expect(slugLibre(existe, 'X', 'Bautismo', 'c')).rejects.toMatchObject({ response: { campos: { slug: expect.any(String) } } });
  });
});
