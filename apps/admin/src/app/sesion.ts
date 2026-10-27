import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Rol, UsuarioPanel } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SesionService {
  private readonly http = inject(HttpClient);
  readonly usuario = signal<UsuarioPanel | null>(null);
  readonly rol = computed(() => this.usuario()?.rol ?? null);

  /** Pide a la API quién está conectado. null si no hay sesión completa. */
  async cargar(): Promise<UsuarioPanel | null> {
    try {
      this.usuario.set(await firstValueFrom(this.http.get<UsuarioPanel>('/api/auth/yo')));
    } catch {
      this.usuario.set(null);
    }
    return this.usuario();
  }

  puede(...roles: Rol[]) {
    const rol = this.rol();
    return rol !== null && roles.includes(rol);
  }

  async salir() {
    await firstValueFrom(this.http.post('/api/auth/salir', {})).catch(() => undefined);
    this.usuario.set(null);
  }
}

/** Exige sesión completa; si la clave es temporal, primero hay que cambiarla. */
export const conSesion: CanActivateFn = async (ruta) => {
  const sesion = inject(SesionService);
  const router = inject(Router);
  const usuario = sesion.usuario() ?? (await sesion.cargar());
  if (!usuario) return router.parseUrl('/ingresar');
  if (usuario.debeCambiarClave && ruta.routeConfig?.path !== 'cambiar-clave') return router.parseUrl('/cambiar-clave');
  return true;
};

/** Restringe una sección a ciertos roles (la API igual lo vuelve a controlar). */
export const soloRoles =
  (...roles: Rol[]): CanActivateFn =>
  () =>
    inject(SesionService).puede(...roles) || inject(Router).parseUrl('/');
