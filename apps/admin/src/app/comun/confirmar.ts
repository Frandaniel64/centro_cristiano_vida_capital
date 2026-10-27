import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';

interface DatosConfirmar {
  titulo: string;
  texto: string;
  accion: string;
}

@Component({
  selector: 'app-confirmar',
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ datos.titulo }}</h2>
    <mat-dialog-content><p style="margin: 0">{{ datos.texto }}</p></mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" [mat-dialog-close]="false">Cancelar</button>
      <button matButton="filled" type="button" class="peligro-relleno" [mat-dialog-close]="true" cdkFocusInitial>{{ datos.accion }}</button>
    </mat-dialog-actions>
  `,
})
class Confirmar {
  protected readonly datos = inject<DatosConfirmar>(MAT_DIALOG_DATA);
}

/** Pide confirmación antes de una acción que no se puede deshacer. */
export function confirmar(dialogo: MatDialog, datos: DatosConfirmar): Promise<boolean> {
  return firstValueFrom(dialogo.open(Confirmar, { data: datos, width: '26rem', maxWidth: '95vw' }).afterClosed()).then(Boolean);
}
