import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Avisos cortos abajo de la pantalla después de una acción. */
@Injectable({ providedIn: 'root' })
export class Avisos {
  private readonly snack = inject(MatSnackBar);

  exito(texto: string) {
    this.snack.open(texto, 'Cerrar', { duration: 4000, politeness: 'polite' });
  }

  error(texto: string) {
    this.snack.open(texto, 'Cerrar', { duration: 7000, politeness: 'assertive', panelClass: 'aviso-snack-error' });
  }
}
