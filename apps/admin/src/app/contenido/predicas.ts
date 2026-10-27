import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import type { FotoRef, Guardar, PredicaAdmin, SerieAdmin } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { confirmar } from '../comun/confirmar';
import { SelectorFoto } from '../medios/selector-foto';
import { ESTADOS_CONTENIDO, aLineas, deLineas } from './comun';

interface Formulario extends Omit<Guardar<PredicaAdmin>, 'versiculos' | 'duracionMin'> {
  versiculos: string;
  duracionMin: number | null;
}

const hoy = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' });
const VACIO = (): Formulario => ({
  titulo: '',
  slug: '',
  estado: 'borrador',
  fecha: hoy(),
  predicador: '',
  serieId: null,
  urlVideo: '',
  duracionMin: null,
  resumen: '',
  versiculos: '',
  destacada: false,
  fotoId: null,
});

@Component({
  selector: 'app-predicas',
  imports: [FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatSlideToggleModule, SelectorFoto],
  styles: `
    .columnas { display: grid; grid-template-columns: minmax(0, 2fr) minmax(260px, 1fr); gap: 20px; align-items: start; }
    @media (max-width: 900px) { .columnas { grid-template-columns: minmax(0, 1fr); } }
    .item { display: flex; gap: 12px; align-items: center; padding: 12px 16px; }
    .item h2 { font-size: 17px; }
    .dos { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0 16px; }
    .serie { display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 6px 0; border-bottom: 1px solid var(--linea); }
  `,
  template: `
    @if (editando() === null) {
      <div class="encabezado">
        <h1>Prédicas</h1>
        <button matButton="filled" type="button" (click)="nueva()"><mat-icon svgIcon="add" />Nueva prédica</button>
      </div>
      <div class="columnas">
        <div class="pila" style="gap: 8px">
          @for (p of predicas(); track p.id) {
            <div class="tarjeta item">
              <div class="pila" style="gap: 4px; flex: 1; min-width: 0">
                <h2>{{ p.titulo }}</h2>
                <span class="suave">{{ fechaCorta(p.fecha) }} · {{ p.predicador }}@if (nombreSerie(p.serieId); as s) { · {{ s }} }</span>
                <div class="fila" style="gap: 6px">
                  <span class="etiqueta" [class]="p.estado === 'publicado' ? 'success' : 'secondary'">{{ p.estado === 'publicado' ? 'Publicada' : 'Borrador' }}</span>
                  @if (!p.urlVideo) { <span class="etiqueta warn">Sin video</span> }
                </div>
              </div>
              <button matIconButton type="button" (click)="editar(p)" [attr.aria-label]="'Editar ' + p.titulo"><mat-icon svgIcon="edit" /></button>
            </div>
          } @empty {
            <p class="suave">Todavía no hay prédicas cargadas.</p>
          }
        </div>

        <section class="tarjeta pila" aria-labelledby="titulo-series">
          <h2 id="titulo-series">Series</h2>
          <p class="ayuda">Agrupan prédicas en la web: "En vivo" tiene un filtro por serie.</p>
          <div>
            @for (s of series(); track s.id) {
              <div class="serie">
                <span>{{ s.nombre }} <span class="suave">· {{ s.predicas }}</span></span>
                <button matIconButton type="button" class="peligro" (click)="borrarSerie(s)" [attr.aria-label]="'Borrar la serie ' + s.nombre"><mat-icon svgIcon="delete" /></button>
              </div>
            } @empty {
              <p class="suave">Sin series.</p>
            }
          </div>
          <form class="fila" (ngSubmit)="crearSerie()">
            <mat-form-field style="flex: 1; min-width: 10rem">
              <mat-label>Nueva serie</mat-label>
              <input matInput name="serie" maxlength="80" [(ngModel)]="nuevaSerie" />
            </mat-form-field>
            <button matButton="outlined" type="submit">Agregar</button>
          </form>
        </section>
      </div>
    } @else {
      <form class="pila" (ngSubmit)="guardar()">
        <div class="encabezado">
          <div class="fila">
            <button matIconButton type="button" (click)="volver()" aria-label="Volver a la lista"><mat-icon svgIcon="arrow_back" /></button>
            <h1>{{ editando() ? 'Editar prédica' : 'Nueva prédica' }}</h1>
          </div>
          <mat-button-toggle-group name="estado" [(ngModel)]="f.estado" aria-label="Estado" hideSingleSelectionIndicator>
            @for (e of estados; track e.valor) { <mat-button-toggle [value]="e.valor">{{ e.valor === 'publicado' ? 'Publicada' : e.texto }}</mat-button-toggle> }
          </mat-button-toggle-group>
        </div>

        <div class="tarjeta pila">
          <mat-form-field>
            <mat-label>Título</mat-label>
            <input matInput name="titulo" maxlength="120" [(ngModel)]="f.titulo" required />
          </mat-form-field>
          @if (campos()['titulo']) { <p class="error">{{ campos()['titulo'] }}</p> }
          <div class="dos">
            <mat-form-field>
              <mat-label>Fecha</mat-label>
              <input matInput name="fecha" type="date" [(ngModel)]="f.fecha" required />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Predicador</mat-label>
              <input matInput name="predicador" maxlength="100" [(ngModel)]="f.predicador" placeholder="Ej.: Pastor Martín Ruiz" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Serie</mat-label>
              <mat-select name="serie" [(ngModel)]="f.serieId">
                <mat-option [value]="null">Sin serie</mat-option>
                @for (s of series(); track s.id) { <mat-option [value]="s.id">{{ s.nombre }}</mat-option> }
              </mat-select>
            </mat-form-field>
          </div>
          @if (campos()['predicador']) { <p class="error">{{ campos()['predicador'] }}</p> }
          <div class="dos">
            <mat-form-field style="grid-column: span 2">
              <mat-label>Link del video (YouTube o Instagram)</mat-label>
              <input matInput name="video" maxlength="500" [(ngModel)]="f.urlVideo" placeholder="https://youtube.com/watch?v=…" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Duración (minutos)</mat-label>
              <input matInput name="duracion" type="number" min="1" max="600" [(ngModel)]="f.duracionMin" />
            </mat-form-field>
          </div>
          @if (campos()['urlVideo']) { <p class="error">{{ campos()['urlVideo'] }}</p> }
          <mat-form-field>
            <mat-label>Resumen</mat-label>
            <textarea matInput name="resumen" rows="3" maxlength="500" [(ngModel)]="f.resumen"></textarea>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Versículos</mat-label>
            <textarea matInput name="versiculos" rows="3" [(ngModel)]="f.versiculos" placeholder="Uno por línea, ej.: Salmo 1"></textarea>
            <mat-hint>Uno por línea.</mat-hint>
          </mat-form-field>
        </div>

        <div class="tarjeta pila">
          <app-selector-foto [(foto)]="foto" />
          @if (campos()['fotoId']) { <p class="error">{{ campos()['fotoId'] }}</p> }
          <mat-slide-toggle name="destacada" [(ngModel)]="f.destacada">Destacar en el inicio como "Última prédica"</mat-slide-toggle>
          <mat-form-field>
            <mat-label>Dirección en la web</mat-label>
            <span matTextPrefix>/predicas/</span>
            <input matInput name="slug" maxlength="80" [(ngModel)]="f.slug" placeholder="se arma con el título" />
          </mat-form-field>
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
export class Predicas {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  private readonly dialogo = inject(MatDialog);

  protected readonly estados = ESTADOS_CONTENIDO;
  protected readonly predicas = signal<PredicaAdmin[]>([]);
  protected readonly series = signal<SerieAdmin[]>([]);
  protected readonly editando = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly campos = signal<Record<string, string>>({});
  protected f: Formulario = VACIO();
  protected foto: FotoRef = null;
  protected nuevaSerie = '';

  private readonly nombres = computed(() => new Map(this.series().map((s) => [s.id, s.nombre])));
  protected readonly nombreSerie = (id: string | null) => (id ? this.nombres().get(id) : undefined);
  protected readonly fechaCorta = (f: string) =>
    new Date(`${f}T12:00:00Z`).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

  constructor() {
    void this.cargar();
  }

  private async cargar() {
    try {
      const [predicas, series] = await Promise.all([
        firstValueFrom(this.http.get<PredicaAdmin[]>('/api/admin/predicas')),
        firstValueFrom(this.http.get<SerieAdmin[]>('/api/admin/series')),
      ]);
      this.predicas.set(predicas);
      this.series.set(series);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected nueva() {
    this.f = VACIO();
    this.foto = null;
    this.campos.set({});
    this.editando.set('');
  }

  protected editar(p: PredicaAdmin) {
    this.f = {
      titulo: p.titulo,
      slug: p.slug,
      estado: p.estado,
      fecha: p.fecha,
      predicador: p.predicador,
      serieId: p.serieId,
      urlVideo: p.urlVideo ?? '',
      duracionMin: p.duracionMin,
      resumen: p.resumen ?? '',
      versiculos: aLineas(p.versiculos),
      destacada: p.destacada,
      fotoId: p.foto?.id ?? null,
    };
    this.foto = p.foto;
    this.campos.set({});
    this.editando.set(p.id);
  }

  protected volver() {
    this.editando.set(null);
  }

  protected async guardar() {
    const id = this.editando();
    const duracion = Number(this.f.duracionMin);
    const cuerpo: Guardar<PredicaAdmin> = {
      ...this.f,
      duracionMin: duracion > 0 ? duracion : null,
      versiculos: deLineas(this.f.versiculos),
      fotoId: this.foto?.id ?? null,
    };
    this.guardando.set(true);
    this.campos.set({});
    try {
      const p = await firstValueFrom(id ? this.http.put<PredicaAdmin>(`/api/admin/predicas/${id}`, cuerpo) : this.http.post<PredicaAdmin>('/api/admin/predicas', cuerpo));
      this.predicas.update((lista) => (id ? lista.map((x) => (x.id === id ? p : x)) : [p, ...lista]).sort((a, b) => b.fecha.localeCompare(a.fecha)));
      await this.recargarSeries();
      this.avisos.exito(p.estado === 'publicado' ? `"${p.titulo}" publicada.` : `"${p.titulo}" guardada como borrador.`);
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
    if (!id || !(await confirmar(this.dialogo, { titulo: 'Borrar prédica', texto: `Se borra "${this.f.titulo}" y deja de verse en la web.`, accion: 'Borrar' }))) return;
    try {
      await firstValueFrom(this.http.delete(`/api/admin/predicas/${id}`));
      this.predicas.update((lista) => lista.filter((x) => x.id !== id));
      await this.recargarSeries();
      this.avisos.exito('Prédica borrada.');
      this.volver();
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected async crearSerie() {
    const nombre = this.nuevaSerie.trim();
    if (!nombre) return;
    try {
      const s = await firstValueFrom(this.http.post<SerieAdmin>('/api/admin/series', { nombre, estado: 'publicado', descripcion: null, fotoId: null }));
      this.series.update((lista) => [s, ...lista]);
      this.nuevaSerie = '';
      this.avisos.exito(`Serie "${s.nombre}" creada.`);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected async borrarSerie(s: SerieAdmin) {
    if (!(await confirmar(this.dialogo, { titulo: 'Borrar serie', texto: `Se borra la serie "${s.nombre}".`, accion: 'Borrar' }))) return;
    try {
      await firstValueFrom(this.http.delete(`/api/admin/series/${s.id}`));
      this.series.update((lista) => lista.filter((x) => x.id !== s.id));
      this.avisos.exito('Serie borrada.');
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  private async recargarSeries() {
    this.series.set(await firstValueFrom(this.http.get<SerieAdmin[]>('/api/admin/series')));
  }
}
