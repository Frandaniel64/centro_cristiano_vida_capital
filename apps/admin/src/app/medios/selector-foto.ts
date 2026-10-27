import { Component, TemplateRef, inject, model, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import type { FotoRef, MedioAdmin } from '@ccvida/shared';
import { Galeria, miniatura } from './galeria';

/** Campo "Foto" de los formularios: muestra la elegida y abre la galería para cambiarla. */
@Component({
  selector: 'app-selector-foto',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, Galeria],
  styles: `
    .selector { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
    img { width: 160px; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 10px; border: 1px solid var(--linea); }
    .vacia { width: 160px; aspect-ratio: 4 / 3; border-radius: 10px; border: 1px dashed var(--texto-suave); display: grid; place-items: center; color: var(--texto-suave); font-size: 13px; }
    .alt { margin: 0; max-width: 22rem; }
  `,
  template: `
    <div class="pila" style="gap: 8px">
      <span style="font-weight: 600">Foto</span>
      <div class="selector">
        @if (foto(); as f) {
          <img [src]="miniatura(f)" [alt]="f.textoAlternativo" />
          <div class="pila" style="gap: 6px">
            <p class="alt ayuda">{{ f.textoAlternativo }}</p>
            <div class="fila">
              <button matButton="outlined" type="button" (click)="abrir()">Cambiar foto</button>
              <button matButton type="button" (click)="foto.set(null)">Quitar</button>
            </div>
          </div>
        } @else {
          <div class="vacia" aria-hidden="true">Sin foto</div>
          <button matButton="outlined" type="button" (click)="abrir()"><mat-icon svgIcon="photo_library" />Elegir foto</button>
        }
      </div>
    </div>

    <ng-template #dialogoGaleria>
      <div class="fila" style="justify-content: space-between; padding-right: 8px">
        <h2 mat-dialog-title>Elegí una foto</h2>
        <button matIconButton type="button" mat-dialog-close aria-label="Cerrar"><mat-icon svgIcon="close" /></button>
      </div>
      <mat-dialog-content>
        <app-galeria modo="elegir" (elegida)="elegir($event)" />
      </mat-dialog-content>
    </ng-template>
  `,
})
export class SelectorFoto {
  private readonly dialogo = inject(MatDialog);
  private readonly plantilla = viewChild.required<TemplateRef<unknown>>('dialogoGaleria');
  private abierto: MatDialogRef<unknown> | null = null;

  readonly foto = model<FotoRef>(null);
  protected readonly miniatura = miniatura;

  protected abrir() {
    this.abierto = this.dialogo.open(this.plantilla(), { width: '56rem', maxWidth: '95vw', maxHeight: '90vh' });
  }

  protected elegir(m: MedioAdmin) {
    this.foto.set({ id: m.id, url: m.url, tamanos: m.tamanos, textoAlternativo: m.textoAlternativo });
    this.abierto?.close();
  }
}
