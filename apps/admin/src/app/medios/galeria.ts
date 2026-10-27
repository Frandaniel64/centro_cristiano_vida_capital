import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import type { MedioAdmin, Pagina } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { confirmar } from '../comun/confirmar';

/** Miniatura: la variante más chica disponible. */
export const miniatura = (m: Pick<MedioAdmin, 'url' | 'tamanos'>) => {
  const anchos = Object.keys(m.tamanos).map(Number).sort((a, b) => a - b);
  return anchos.length ? m.tamanos[anchos[0]] : m.url;
};

@Component({
  selector: 'app-galeria',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatProgressBarModule],
  styles: `
    .subir { display: grid; grid-template-columns: 1fr; gap: 12px; }
    .archivo { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
    .previa { width: 120px; height: 80px; object-fit: cover; border-radius: 8px; border: 1px solid var(--linea); }
    .grilla { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
    .foto { display: flex; flex-direction: column; gap: 6px; border: 1px solid var(--linea); border-radius: 12px; padding: 8px; background: var(--superficie); }
    .foto img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 8px; display: block; }
    .foto button.elegir { all: unset; cursor: pointer; display: block; border-radius: 8px; }
    .foto button.elegir:focus-visible { outline: 3px solid var(--azul); outline-offset: 2px; }
    .alt { font-size: 12px; color: var(--texto-suave); margin: 0; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }
    .acciones { display: flex; gap: 4px; }
  `,
  template: `
    <div class="pila">
      <form class="tarjeta pila" (ngSubmit)="subir()">
        <h2>Subir una foto</h2>
        <div class="archivo">
          <input #selector type="file" accept="image/jpeg,image/png,image/webp,image/avif" (change)="elegirArchivo(selector.files)" hidden />
          <button matButton="outlined" type="button" (click)="selector.click()"><mat-icon svgIcon="upload" />Elegir archivo</button>
          @if (previa()) {
            <img class="previa" [src]="previa()" alt="Vista previa de la foto elegida" />
            <span class="suave">{{ archivo()?.name }}</span>
          } @else {
            <span class="suave">JPG, PNG o WebP, hasta 15 MB.</span>
          }
        </div>
        @if (campos()['archivo']) { <p class="error">{{ campos()['archivo'] }}</p> }
        <mat-form-field>
          <mat-label>Texto alternativo</mat-label>
          <input matInput name="alt" maxlength="300" [(ngModel)]="textoAlternativo" placeholder="Ej.: Chicos de Kids Vida pintando en una mesa" />
          <mat-hint>Describí lo que se ve, para quien usa un lector de pantalla. Es obligatorio.</mat-hint>
        </mat-form-field>
        @if (campos()['textoAlternativo']) { <p class="error">{{ campos()['textoAlternativo'] }}</p> }
        <mat-form-field>
          <mat-label>Crédito (opcional)</mat-label>
          <input matInput name="credito" maxlength="200" [(ngModel)]="credito" placeholder="Ej.: Foto de Juan Pérez" />
        </mat-form-field>
        @if (subiendo()) { <mat-progress-bar mode="indeterminate" aria-label="Subiendo la foto" /> }
        <div class="fila derecha">
          <button matButton="filled" type="submit" [disabled]="subiendo()">Subir foto</button>
        </div>
      </form>

      <div class="grilla" role="list" aria-label="Fotos subidas">
        @for (m of fotos(); track m.id) {
          <div class="foto" role="listitem">
            @if (modo() === 'elegir') {
              <button type="button" class="elegir" (click)="elegida.emit(m)" [attr.aria-label]="'Elegir: ' + m.textoAlternativo">
                <img [src]="miniatura(m)" [alt]="m.textoAlternativo" loading="lazy" />
              </button>
            } @else {
              <img [src]="miniatura(m)" [alt]="m.textoAlternativo" loading="lazy" />
            }
            @if (editando() === m.id) {
              <form class="pila" style="gap: 6px" (ngSubmit)="guardarAlt(m)">
                <mat-form-field>
                  <mat-label>Texto alternativo</mat-label>
                  <textarea matInput name="altEditado" rows="3" maxlength="300" [(ngModel)]="altEditado" cdkFocusInitial></textarea>
                </mat-form-field>
                <div class="acciones">
                  <button matButton="filled" type="submit">Guardar</button>
                  <button matButton type="button" (click)="editando.set(null)">Cancelar</button>
                </div>
              </form>
            } @else {
              <p class="alt">{{ m.textoAlternativo }}</p>
            }
            @if (modo() === 'gestionar' && editando() !== m.id) {
              <div class="acciones">
                <button matIconButton type="button" (click)="editarAlt(m)" [attr.aria-label]="'Editar texto de: ' + m.textoAlternativo"><mat-icon svgIcon="edit" /></button>
                <button matIconButton type="button" class="peligro" (click)="borrar(m)" [attr.aria-label]="'Borrar: ' + m.textoAlternativo"><mat-icon svgIcon="delete" /></button>
              </div>
            }
          </div>
        } @empty {
          @if (!cargando()) { <p class="suave">Todavía no hay fotos. Subí la primera.</p> }
        }
      </div>
      @if (fotos().length < total()) {
        <div class="fila derecha"><button matButton="outlined" type="button" (click)="cargarMas()" [disabled]="cargando()">Ver más fotos</button></div>
      }
    </div>
  `,
})
export class Galeria {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  private readonly dialogo = inject(MatDialog);

  readonly modo = input<'elegir' | 'gestionar'>('gestionar');
  readonly elegida = output<MedioAdmin>();

  protected readonly miniatura = miniatura;
  protected readonly fotos = signal<MedioAdmin[]>([]);
  protected readonly total = signal(0);
  protected readonly cargando = signal(false);
  protected readonly subiendo = signal(false);
  protected readonly archivo = signal<File | null>(null);
  protected readonly previa = signal<string | null>(null);
  protected readonly campos = signal<Record<string, string>>({});
  protected readonly editando = signal<string | null>(null);
  protected textoAlternativo = '';
  protected credito = '';
  protected altEditado = '';
  private pagina = 1;

  constructor() {
    void this.cargar();
  }

  private async cargar() {
    this.cargando.set(true);
    try {
      const r = await firstValueFrom(this.http.get<Pagina<MedioAdmin>>('/api/admin/medios', { params: new HttpParams().set('pagina', this.pagina) }));
      this.fotos.update((f) => (this.pagina === 1 ? r.items : [...f, ...r.items]));
      this.total.set(r.total);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  protected cargarMas() {
    this.pagina++;
    void this.cargar();
  }

  protected elegirArchivo(lista: FileList | null) {
    const f = lista?.[0] ?? null;
    if (this.previa()) URL.revokeObjectURL(this.previa()!);
    this.archivo.set(f);
    this.previa.set(f ? URL.createObjectURL(f) : null);
  }

  protected async subir() {
    this.campos.set({});
    const f = this.archivo();
    if (!f) {
      this.campos.set({ archivo: 'Elegí una foto.' });
      return;
    }
    const datos = new FormData();
    datos.append('archivo', f);
    datos.append('textoAlternativo', this.textoAlternativo.trim());
    if (this.credito.trim()) datos.append('credito', this.credito.trim());
    this.subiendo.set(true);
    try {
      const m = await firstValueFrom(this.http.post<MedioAdmin>('/api/admin/medios', datos));
      this.fotos.update((lista) => [m, ...lista]);
      this.total.update((t) => t + 1);
      this.elegirArchivo(null);
      this.textoAlternativo = '';
      this.credito = '';
      this.avisos.exito('Foto subida.');
      if (this.modo() === 'elegir') this.elegida.emit(m);
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.campos.set(campos);
      if (!Object.keys(campos).length) this.avisos.error(mensaje);
    } finally {
      this.subiendo.set(false);
    }
  }

  protected editarAlt(m: MedioAdmin) {
    this.altEditado = m.textoAlternativo;
    this.editando.set(m.id);
  }

  protected async guardarAlt(m: MedioAdmin) {
    const nuevo = this.altEditado.trim();
    if (nuevo === m.textoAlternativo) {
      this.editando.set(null);
      return;
    }
    try {
      const actualizado = await firstValueFrom(this.http.patch<MedioAdmin>(`/api/admin/medios/${m.id}`, { textoAlternativo: nuevo }));
      this.fotos.update((lista) => lista.map((x) => (x.id === m.id ? actualizado : x)));
      this.editando.set(null);
      this.avisos.exito('Texto actualizado.');
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected async borrar(m: MedioAdmin) {
    const ok = await confirmar(this.dialogo, { titulo: 'Borrar foto', texto: `Se borra "${m.textoAlternativo}". No se puede deshacer.`, accion: 'Borrar' });
    if (!ok) return;
    try {
      await firstValueFrom(this.http.delete(`/api/admin/medios/${m.id}`));
      this.fotos.update((lista) => lista.filter((x) => x.id !== m.id));
      this.total.update((t) => t - 1);
      this.avisos.exito('Foto borrada.');
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }
}
