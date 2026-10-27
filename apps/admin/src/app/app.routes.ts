import { Routes } from '@angular/router';
import { conSesion, soloRoles } from './sesion';

export const routes: Routes = [
  { path: 'ingresar', title: 'Ingresar · Panel CCVida', loadComponent: () => import('./ingreso/ingreso').then((m) => m.Ingreso) },
  {
    path: 'cambiar-clave',
    title: 'Cambiar contraseña · Panel CCVida',
    canActivate: [conSesion],
    loadComponent: () => import('./ingreso/cambiar-clave').then((m) => m.CambiarClave),
  },
  {
    path: '',
    canActivate: [conSesion],
    loadComponent: () => import('./marco/marco').then((m) => m.Marco),
    children: [
      { path: '', title: 'Inicio · Panel CCVida', loadComponent: () => import('./inicio/inicio').then((m) => m.Inicio) },
      {
        path: 'vouchers',
        title: 'Vouchers · Panel CCVida',
        canActivate: [soloRoles('administrador', 'tesoreria')],
        loadComponent: () => import('./pro-templo/vouchers').then((m) => m.Vouchers),
      },
      {
        path: 'campana',
        title: 'Campaña · Panel CCVida',
        canActivate: [soloRoles('administrador', 'tesoreria')],
        loadComponent: () => import('./pro-templo/campana').then((m) => m.Campana),
      },
      {
        path: 'visitas',
        title: 'Visitas · Panel CCVida',
        canActivate: [soloRoles('administrador', 'recepcion')],
        loadComponent: () => import('./visitas/visitas').then((m) => m.Visitas),
      },
      ...(
        [
          ['ministerios', 'Ministerios', () => import('./contenido/ministerios').then((m) => m.Ministerios)],
          ['eventos', 'Eventos', () => import('./contenido/eventos').then((m) => m.Eventos)],
          ['predicas', 'Prédicas', () => import('./contenido/predicas').then((m) => m.Predicas)],
          ['fotos', 'Fotos', () => import('./medios/medios').then((m) => m.Medios)],
          ['textos', 'Textos del sitio', () => import('./contenido/textos').then((m) => m.Textos)],
        ] as const
      ).map(([path, titulo, loadComponent]) => ({
        path,
        title: `${titulo} · Panel CCVida`,
        canActivate: [soloRoles('administrador', 'editor')],
        loadComponent,
      })),
      {
        path: 'usuarios',
        title: 'Usuarios · Panel CCVida',
        canActivate: [soloRoles('administrador')],
        loadComponent: () => import('./usuarios/usuarios').then((m) => m.Usuarios),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
