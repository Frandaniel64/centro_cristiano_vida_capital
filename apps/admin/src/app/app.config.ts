import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { MAT_FORM_FIELD_DEFAULT_OPTIONS } from '@angular/material/form-field';
import { MatIconRegistry } from '@angular/material/icon';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { DomSanitizer } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { interceptorApi } from './api';
import { routes } from './app.routes';

const ICONOS = [
  'home',
  'confirmation_number',
  'foundation',
  'waving_hand',
  'badge',
  'logout',
  'visibility',
  'visibility_off',
  'search',
  'person_add',
  'groups',
  'event',
  'mic',
  'photo_library',
  'edit_note',
  'add',
  'edit',
  'delete',
  'upload',
  'arrow_back',
  'close',
];

/** Textos del paginador en castellano. */
function paginadorEnCastellano() {
  const intl = new MatPaginatorIntl();
  intl.itemsPerPageLabel = 'Por página';
  intl.nextPageLabel = 'Página siguiente';
  intl.previousPageLabel = 'Página anterior';
  intl.firstPageLabel = 'Primera página';
  intl.lastPageLabel = 'Última página';
  intl.getRangeLabel = (pagina, porPagina, total) => {
    if (total === 0) return '0 de 0';
    const desde = pagina * porPagina + 1;
    return `${desde} a ${Math.min(desde + porPagina - 1, total)} de ${total}`;
  };
  return intl;
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([interceptorApi])),
    { provide: MatPaginatorIntl, useFactory: paginadorEnCastellano },
    { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: { appearance: 'outline', subscriptSizing: 'dynamic' } },
    // Solo los íconos que usa el panel, como SVG sueltos de Material Symbols (public/iconos):
    // la fuente completa pesa 4 MB.
    provideAppInitializer(() => {
      const registro = inject(MatIconRegistry);
      const sanitizer = inject(DomSanitizer);
      for (const nombre of ICONOS) {
        registro.addSvgIcon(nombre, sanitizer.bypassSecurityTrustResourceUrl(`iconos/${nombre}.svg`));
      }
    }),
  ],
};
