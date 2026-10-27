import { proximaTransmision } from './en-vivo.controller.js';

describe('proximaTransmision', () => {
  const iso = (ms: number) => new Date(ms).toISOString();

  it('un martes apunta al domingo siguiente a las 10 h de Buenos Aires', () => {
    expect(iso(proximaTransmision(Date.parse('2026-10-27T15:00:00Z')))).toBe('2026-11-01T13:00:00.000Z');
  });

  it('durante la transmisión devuelve la de hoy', () => {
    expect(iso(proximaTransmision(Date.parse('2026-11-01T14:30:00Z')))).toBe('2026-11-01T13:00:00.000Z');
  });

  it('el domingo después de las 13 h pasa a la semana siguiente', () => {
    expect(iso(proximaTransmision(Date.parse('2026-11-01T16:00:00Z')))).toBe('2026-11-08T13:00:00.000Z');
  });
});
