import { proximaTransmision } from './en-vivo.controller.js';

describe('proximaTransmision', () => {
  const iso = (ms: number) => new Date(ms).toISOString();

  it('un martes apunta al domingo siguiente a las 11 h de Buenos Aires', () => {
    expect(iso(proximaTransmision(Date.parse('2026-10-27T15:00:00Z')))).toBe('2026-11-01T14:00:00.000Z');
  });

  it('el domingo durante el compartir (10:30 h) todavía apunta al culto de las 11 h', () => {
    expect(iso(proximaTransmision(Date.parse('2026-11-01T13:30:00Z')))).toBe('2026-11-01T14:00:00.000Z');
  });

  it('durante la transmisión devuelve la de hoy', () => {
    expect(iso(proximaTransmision(Date.parse('2026-11-01T15:30:00Z')))).toBe('2026-11-01T14:00:00.000Z');
  });

  it('el domingo después de las 13 h pasa a la semana siguiente', () => {
    expect(iso(proximaTransmision(Date.parse('2026-11-01T16:00:00Z')))).toBe('2026-11-08T14:00:00.000Z');
  });
});
