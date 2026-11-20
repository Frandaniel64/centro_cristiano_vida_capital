import type { HttpClient } from '@angular/common/http';
import type { EstadoContenido } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import type { Avisos } from '../avisos';

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
  // Paleta oficial del Manual de Identidad Visual.
  { valor: '#0a6cac', texto: 'Azul' },
  { valor: '#a0d062', texto: 'Verde' },
  { valor: '#b1d9e1', texto: 'Celeste' },
  { valor: '#0d1f2d', texto: 'Azul noche' },
];

/** Abre la web con los borradores visibles en una pestaña nueva. */
export async function abrirVistaPrevia(http: HttpClient, avisos: Avisos, ruta: string) {
  // Se abre ya, de forma sincrónica, para que el navegador no la bloquee.
  const pestana = window.open('', '_blank');
  try {
    const { url } = await firstValueFrom(http.post<{ url: string }>('/api/admin/vista-previa', { ruta }));
    if (pestana) pestana.location.href = url;
    else window.location.href = url;
  } catch (e) {
    pestana?.close();
    avisos.error(errorDe(e).mensaje);
  }
}
