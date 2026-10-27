// La reunión es el domingo a las 10 h de Buenos Aires (UTC-3, sin horario de
// verano) y la transmisión se considera en curso de 10 a 13 h.
const HORA_INICIO_UTC = 13;
const DURACION_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

/** Inicio de la transmisión actual o de la próxima. */
export function proximaTransmision(ahora: number = Date.now()): number {
  const d = new Date(ahora);
  let inicio =
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), HORA_INICIO_UTC) +
    ((7 - d.getUTCDay()) % 7) * DIA_MS;
  if (ahora - inicio >= DURACION_MS) inicio += 7 * DIA_MS;
  return inicio;
}

export function estaEnVivo(ahora: number = Date.now()): boolean {
  const inicio = proximaTransmision(ahora);
  return ahora >= inicio && ahora < inicio + DURACION_MS;
}

export function cuentaRegresiva(ahora: number = Date.now()) {
  const falta = Math.max(0, proximaTransmision(ahora) - ahora);
  return {
    dias: Math.floor(falta / DIA_MS),
    horas: Math.floor((falta % DIA_MS) / 3_600_000),
    min: Math.floor((falta % 3_600_000) / 60_000),
    seg: Math.floor((falta % 60_000) / 1000),
  };
}
