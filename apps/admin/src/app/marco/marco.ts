import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import type { Rol } from '@ccvida/shared';
import { ROLES } from '../formato';
import { SesionService } from '../sesion';

interface Seccion {
  ruta: string;
  texto: string;
  icono: string;
  roles: Rol[] | null;
}

const SECCIONES: Seccion[] = [
  { ruta: '/', texto: 'Inicio', icono: 'home', roles: null },
  { ruta: '/vouchers', texto: 'Vouchers', icono: 'confirmation_number', roles: ['administrador', 'tesoreria'] },
  { ruta: '/campana', texto: 'Campaña y ajustes', icono: 'foundation', roles: ['administrador', 'tesoreria'] },
  { ruta: '/visitas', texto: 'Visitas', icono: 'waving_hand', roles: ['administrador', 'recepcion'] },
  { ruta: '/eventos', texto: 'Eventos', icono: 'event', roles: ['administrador', 'editor'] },
  { ruta: '/predicas', texto: 'Prédicas', icono: 'mic', roles: ['administrador', 'editor'] },
  { ruta: '/ministerios', texto: 'Ministerios', icono: 'groups', roles: ['administrador', 'editor'] },
  { ruta: '/nosotros', texto: 'Nosotros', icono: 'diversity_3', roles: ['administrador', 'editor'] },
  { ruta: '/fotos', texto: 'Fotos', icono: 'photo_library', roles: ['administrador', 'editor'] },
  { ruta: '/textos', texto: 'Textos del sitio', icono: 'edit_note', roles: ['administrador', 'editor'] },
  { ruta: '/usuarios', texto: 'Usuarios', icono: 'badge', roles: ['administrador'] },
];

@Component({
  selector: 'app-marco',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatButtonModule, MatIconModule],
  styleUrl: './marco.css',
  template: `
    <div class="marco">
      <aside class="lateral">
        <a routerLink="/" class="marca">
          <img src="logo.png" alt="" width="36" height="36" />
          <span>Panel CCVida</span>
        </a>
        <nav aria-label="Secciones del panel">
          @for (s of secciones(); track s.ruta) {
            <a [routerLink]="s.ruta" routerLinkActive="activa" [routerLinkActiveOptions]="{ exact: s.ruta === '/' }" ariaCurrentWhenActive="page">
              <mat-icon aria-hidden="true" [svgIcon]="s.icono" />{{ s.texto }}
            </a>
          }
        </nav>
      </aside>
      <div class="principal">
        <header class="barra">
          <div>
            <strong>{{ sesion.usuario()?.nombre }}</strong>
            <span class="suave"> · {{ rol() }}</span>
          </div>
          <div class="fila">
            <a routerLink="/cambiar-clave" class="link-clave">Cambiar contraseña</a>
            <button matButton type="button" (click)="salir()"><mat-icon svgIcon="logout" />Salir</button>
          </div>
        </header>
        <main class="contenido">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
})
export class Marco {
  protected readonly sesion = inject(SesionService);
  private readonly router = inject(Router);

  protected readonly secciones = computed(() => {
    const rol = this.sesion.rol();
    return SECCIONES.filter((s) => !s.roles || (rol && s.roles.includes(rol)));
  });
  protected readonly rol = computed(() => {
    const rol = this.sesion.rol();
    return rol ? ROLES[rol] : '';
  });

  protected async salir() {
    await this.sesion.salir();
    await this.router.navigateByUrl('/ingresar');
  }
}
