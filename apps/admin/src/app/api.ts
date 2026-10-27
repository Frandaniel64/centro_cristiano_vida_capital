import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import type { ErrorApi } from '@ccvida/shared';
import { catchError, throwError } from 'rxjs';

// Se define al compilar: ng build --define "API_URL='https://api.ccvida.com.ar'"
declare const API_URL: string;
const BASE = API_URL.replace(/\/$/, '');

/** Las rutas de los servicios empiezan con /api: se completa la URL y se manda la cookie de sesión. */
export const interceptorApi: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const pedido = req.url.startsWith('/api') ? req.clone({ url: BASE + req.url, withCredentials: true }) : req;
  return next(pedido).pipe(
    catchError((e: unknown) => {
      // Sesión vencida o cerrada desde otro lado: de vuelta al ingreso.
      if (e instanceof HttpErrorResponse && e.status === 401 && !req.url.startsWith('/api/auth')) {
        router.navigate(['/ingresar']);
      }
      return throwError(() => e);
    }),
  );
};

/** Mensaje para mostrar y errores por campo de una respuesta de error de la API. */
export function errorDe(e: unknown): ErrorApi & { campos: Record<string, string> } {
  if (e instanceof HttpErrorResponse) {
    if (e.status === 0) return { mensaje: 'No hay conexión con el servidor. Revisá internet y probá de nuevo.', campos: {} };
    if (e.status === 429) return { mensaje: 'Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.', campos: {} };
    const cuerpo = e.error as Partial<ErrorApi> | null;
    if (cuerpo?.mensaje) return { mensaje: cuerpo.mensaje, campos: cuerpo.campos ?? {} };
  }
  return { mensaje: 'Algo salió mal. Probá de nuevo en unos minutos.', campos: {} };
}
