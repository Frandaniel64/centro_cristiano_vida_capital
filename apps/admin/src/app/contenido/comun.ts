import type { EstadoContenido } from '@ccvida/shared';

export const ESTADOS_CONTENIDO: { valor: EstadoContenido; texto: string }[] = [
  { valor: 'borrador', texto: 'Borrador' },
  { valor: 'publicado', texto: 'Publicado' },
];

/** Una línea por elemento ↔ lista. */
export const aLineas = (lista: string[]) => lista.join('\n');
export const deLineas = (texto: string) =>
  texto
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

/** ISO → valor de <input type="datetime-local"> en la hora del navegador. */
export function aFechaHoraLocal(iso: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Valor de <input type="datetime-local"> → ISO. */
export const deFechaHoraLocal = (valor: string) => (valor ? new Date(valor).toISOString() : null);

/** Colores de la marca para los bloques de ministerios. */
export const COLORES_MARCA = [
  { valor: '#0c74b8', texto: 'Azul' },
  { valor: '#8cc63f', texto: 'Verde' },
  { valor: '#f5d547', texto: 'Amarillo' },
  { valor: '#f5f5f0', texto: 'Blanco' },
];
