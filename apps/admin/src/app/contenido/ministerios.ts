import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { FotoRef, Guardar, MinisterioAdmin } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { confirmar } from '../comun/confirmar';
import { SelectorFoto } from '../medios/selector-foto';
import { COLORES_MARCA, ESTADOS_CONTENIDO, aLineas, deLineas } from './comun';

interface Formulario extends Omit<Guardar<MinisterioAdmin>, 'actividades'> {
  actividades: string;
}

const VACIO: Formulario = { nombre: '', slug: '', estado: 'borrador', edades: '', horario: '', resumen: '', descripcion: '', actividades: '', color: '#0c74b8', orden: 0, fotoId: null };

@Component({
  selector: 'app-ministerios',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatIconModule, SelectorFoto],
  styles: `
    .lista { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 12px; }
    .item { display: flex; gap: 12px; align-items: center; padding: 12px; }
    .muestra { width: 12px; align-self: stretch; border-radius: 6px; flex: none; border: 1px solid var(--linea); }
    .item h2 { font-size: 17px; }
    .colores { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .color { width: 36px; height: 36px; border-radius: 999px; border: 2px solid var(--linea); cursor: pointer; padding: 0; }
    .color[aria-pressed='true'] { outline: 3px solid var(--texto); outline-offset: 2px; }
    .dos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 16px; }
  `,
  template: `
    @if (editando() === null) {
      <div class="encabezado">
        <h1>Ministerios</h1>
        <button matButton="filled" type="button" (click)="nuevo()"><mat-icon svgIcon="add" />Nuevo ministerio</button>
      </div>
      <div class="lista">
        @for (m of ministerios(); track m.id) {
          <div class="tarjeta item">
            <span class="muestra" [style.background]="m.color || '#ffffff'"></span>
            <div class="pila" style="gap: 4px; flex: 1; min-width: 0">
              <h2>{{ m.nombre }}</h2>
              <span class="suave">{{ m.horario || 'Sin horario' }}</span>
              <span class="etiqueta" [class]="m.estado === 'publicado' ? 'success' : 'secondary'" style="align-self: flex-start">{{ m.estado === 'publicado' ? 'Publicado' : 'Borrador' }}</span>
            </div>
            <button matIconButton type="button" (click)="editar(m)" [attr.aria-label]="'Editar ' + m.nombre"><mat-icon svgIcon="edit" /></button>
          </div>
        } @empty {
          <p class="suave">Todavía no hay ministerios cargados.</p>
        }
      </div>
    } @else {
      <form class="pila" (ngSubmit)="guardar()">
        <div class="encabezado">
          <div class="fila">
            <button matIconButton type="button" (click)="volver()" aria-label="Volver a la lista"><mat-icon svgIcon="arrow_back" /></button>
            <h1>{{ editando() ? 'Editar ministerio' : 'Nuevo ministerio' }}</h1>
          </div>
          <mat-button-toggle-group name="estado" [(ngModel)]="f.estado" aria-label="Estado" hideSingleSelectionIndicator>
            @for (e of estados; track e.valor) { <mat-button-toggle [value]="e.valor">{{ e.texto }}</mat-button-toggle> }
          </mat-button-toggle-group>
        </div>

        <div class="tarjeta pila">
          <mat-form-field>
            <mat-label>Nombre</mat-label>
            <input matInput name="nombre" maxlength="80" [(ngModel)]="f.nombre" required />
          </mat-form-field>
          @if (campos()['nombre']) { <p class="error">{{ campos()['nombre'] }}</p> }
          <div class="dos">
            <mat-form-field>
              <mat-label>Para quién</mat-label>
              <input matInput name="edades" maxlength="100" [(ngModel)]="f.edades" placeholder="Ej.: De 3 a 11 años" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Cuándo se reúnen</mat-label>
              <input matInput name="horario" maxlength="120" [(ngModel)]="f.horario" placeholder="Ej.: Sábados 19 h" />
            </mat-form-field>
          </div>
          <mat-form-field>
            <mat-label>Frase corta (tarjeta del inicio)</mat-label>
            <input matInput name="resumen" maxlength="200" [(ngModel)]="f.resumen" placeholder="Ej.: Los más chicos conocen a Jesús jugando." />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Descripción</mat-label>
            <textarea matInput name="descripcion" rows="5" maxlength="3000" [(ngModel)]="f.descripcion"></textarea>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Actividades</mat-label>
            <textarea matInput name="actividades" rows="4" [(ngModel)]="f.actividades" placeholder="Una por línea"></textarea>
            <mat-hint>Una por línea. Se muestran como lista.</mat-hint>
          </mat-form-field>
        </div>

        <div class="tarjeta pila">
          <app-selector-foto [(foto)]="foto" />
          @if (campos()['fotoId']) { <p class="error">{{ campos()['fotoId'] }}</p> }
          <div class="pila" style="gap: 8px">
            <span style="font-weight: 600" id="color-etiqueta">Color del bloque</span>
            <div class="colores" role="group" aria-labelledby="color-etiqueta">
              @for (c of colores; track c.valor) {
                <button type="button" class="color" [style.background]="c.valor" [attr.aria-pressed]="f.color === c.valor" [attr.aria-label]="c.texto" (click)="f.color = c.valor"></button>
              }
            </div>
          </div>
          <div class="dos">
            <mat-form-field>
              <mat-label>Orden en la lista</mat-label>
              <input matInput name="orden" type="number" [(ngModel)]="f.orden" />
              <mat-hint>Los números más bajos van primero.</mat-hint>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Dirección en la web</mat-label>
              <span matTextPrefix>/ministerios/</span>
              <input matInput name="slug" maxlength="80" [(ngModel)]="f.slug" placeholder="se arma con el nombre" />
            </mat-form-field>
          </div>
          @if (campos()['slug']) { <p class="error">{{ campos()['slug'] }}</p> }
        </div>

        <div class="fila" style="justify-content: space-between">
          @if (editando()) {
            <button matButton type="button" class="peligro" (click)="borrar()"><mat-icon svgIcon="delete" />Borrar</button>
          } @else { <span></span> }
          <div class="fila">
            <button matButton type="button" (click)="volver()">Cancelar</button>
            <button matButton="filled" type="submit" [disabled]="guardando()">{{ f.estado === 'publicado' ? 'Guardar y publicar' : 'Guardar borrador' }}</button>
          </div>
        </div>
      </form>
    }
  `,
})
export class Ministerios {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  private readonly dialogo = inject(MatDialog);

  protected readonly estados = ESTADOS_CONTENIDO;
  protected readonly colores = COLORES_MARCA;
  protected readonly ministerios = signal<MinisterioAdmin[]>([]);
  // null = lista; '' = nuevo; id = editando.
  protected readonly editando = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly campos = signal<Record<string, string>>({});
  protected f: Formulario = { ...VACIO };
  protected foto: FotoRef = null;

  constructor() {
    void this.cargar();
  }

  private async cargar() {
    try {
      this.ministerios.set(await firstValueFrom(this.http.get<MinisterioAdmin[]>('/api/admin/ministerios')));
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected nuevo() {
    this.f = { ...VACIO, orden: this.ministerios().length + 1 };
    this.foto = null;
    this.campos.set({});
    this.editando.set('');
  }

  protected editar(m: MinisterioAdmin) {
    this.f = {
      nombre: m.nombre,
      slug: m.slug,
      estado: m.estado,
      edades: m.edades ?? '',
      horario: m.horario ?? '',
      resumen: m.resumen ?? '',
      descripcion: m.descripcion ?? '',
      actividades: aLineas(m.actividades),
      color: m.color ?? '#0c74b8',
      orden: m.orden,
      fotoId: m.foto?.id ?? null,
    };
    this.foto = m.foto;
    this.campos.set({});
    this.editando.set(m.id);
  }

  protected volver() {
    this.editando.set(null);
  }

  protected async guardar() {
    const id = this.editando();
    const cuerpo: Guardar<MinisterioAdmin> = { ...this.f, orden: Number(this.f.orden) || 0, actividades: deLineas(this.f.actividades), fotoId: this.foto?.id ?? null };
    this.guardando.set(true);
    this.campos.set({});
    try {
      const m = await firstValueFrom(
        id ? this.http.put<MinisterioAdmin>(`/api/admin/ministerios/${id}`, cuerpo) : this.http.post<MinisterioAdmin>('/api/admin/ministerios', cuerpo),
      );
      this.ministerios.update((lista) => (id ? lista.map((x) => (x.id === id ? m : x)) : [...lista, m]).sort((a, b) => a.orden - b.orden));
      this.avisos.exito(m.estado === 'publicado' ? `"${m.nombre}" publicado.` : `"${m.nombre}" guardado como borrador.`);
      this.volver();
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.campos.set(campos);
      this.avisos.error(Object.keys(campos).length ? 'Revisá los campos marcados.' : mensaje);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async borrar() {
    const id = this.editando();
    if (!id || !(await confirmar(this.dialogo, { titulo: 'Borrar ministerio', texto: `Se borra "${this.f.nombre}" y deja de verse en la web.`, accion: 'Borrar' }))) return;
    try {
      await firstValueFrom(this.http.delete(`/api/admin/ministerios/${id}`));
      this.ministerios.update((lista) => lista.filter((x) => x.id !== id));
      this.avisos.exito('Ministerio borrado.');
      this.volver();
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }
}
