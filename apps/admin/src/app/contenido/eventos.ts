import { NgTemplateOutlet } from '@angular/common';
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
import type { EventoAdmin, FotoRef, Guardar, MinisterioAdmin, Repeticion } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { confirmar } from '../comun/confirmar';
import { fecha } from '../formato';
import { SelectorFoto } from '../medios/selector-foto';
import { ESTADOS_CONTENIDO, aFechaHoraLocal, deFechaHoraLocal } from './comun';

interface Formulario extends Omit<Guardar<EventoAdmin>, 'inicio' | 'fin'> {
  inicio: string; // datetime-local
  fin: string;
}

const VACIO: Formulario = {
  titulo: '',
  slug: '',
  estado: 'borrador',
  inicio: '',
  fin: '',
  repeticion: 'ninguna',
  lugar: 'Camarones 2201, CABA',
  resumen: '',
  descripcion: '',
  ministerioId: null,
  destacado: false,
  linkInscripcion: '',
  fotoId: null,
};

const REPETICIONES: { valor: Repeticion; texto: string }[] = [
  { valor: 'ninguna', texto: 'Una sola vez' },
  { valor: 'semanal', texto: 'Todas las semanas' },
  { valor: 'mensual', texto: 'Todos los meses' },
];

@Component({
  selector: 'app-eventos',
  imports: [NgTemplateOutlet, FormsModule, MatButtonModule, MatButtonToggleModule, MatFormFieldModule, MatInputModule, MatIconModule, MatSelectModule, MatSlideToggleModule, SelectorFoto],
  styles: `
    .item { display: flex; gap: 12px; align-items: center; padding: 12px 16px; }
    .item h2 { font-size: 17px; }
    .dos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 16px; }
    .seccion { font-size: 14px; font-weight: 700; color: var(--texto-suave); margin: 8px 0 0; text-transform: uppercase; letter-spacing: 0.06em; }
    .pasado { opacity: 0.65; }
  `,
  template: `
    @if (editando() === null) {
      <div class="encabezado">
        <h1>Eventos</h1>
        <button matButton="filled" type="button" (click)="nuevo()"><mat-icon svgIcon="add" />Nuevo evento</button>
      </div>
      <div class="pila" style="gap: 8px">
        <p class="seccion">Próximos y que se repiten</p>
        @for (e of proximos(); track e.id) {
          <ng-container *ngTemplateOutlet="fila; context: { $implicit: e }" />
        } @empty {
          <p class="suave">No hay eventos próximos.</p>
        }
        @if (pasados().length) {
          <p class="seccion">Pasados</p>
          @for (e of pasados(); track e.id) {
            <div class="pasado"><ng-container *ngTemplateOutlet="fila; context: { $implicit: e }" /></div>
          }
        }
      </div>
      <ng-template #fila let-e>
        <div class="tarjeta item">
          <div class="pila" style="gap: 4px; flex: 1; min-width: 0">
            <h2>{{ e.titulo }}</h2>
            <span class="suave">{{ cuando(e) }}</span>
            <div class="fila" style="gap: 6px">
              <span class="etiqueta" [class]="e.estado === 'publicado' ? 'success' : 'secondary'">{{ e.estado === 'publicado' ? 'Publicado' : 'Borrador' }}</span>
              @if (e.destacado) { <span class="etiqueta info">En el inicio</span> }
            </div>
          </div>
          <button matIconButton type="button" (click)="editar(e)" [attr.aria-label]="'Editar ' + e.titulo"><mat-icon svgIcon="edit" /></button>
        </div>
      </ng-template>
    } @else {
      <form class="pila" (ngSubmit)="guardar()">
        <div class="encabezado">
          <div class="fila">
            <button matIconButton type="button" (click)="volver()" aria-label="Volver a la lista"><mat-icon svgIcon="arrow_back" /></button>
            <h1>{{ editando() ? 'Editar evento' : 'Nuevo evento' }}</h1>
          </div>
          <mat-button-toggle-group name="estado" [(ngModel)]="f.estado" aria-label="Estado" hideSingleSelectionIndicator>
            @for (e of estados; track e.valor) { <mat-button-toggle [value]="e.valor">{{ e.texto }}</mat-button-toggle> }
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
              <mat-label>Empieza</mat-label>
              <input matInput name="inicio" type="datetime-local" [(ngModel)]="f.inicio" required />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Termina (opcional)</mat-label>
              <input matInput name="fin" type="datetime-local" [(ngModel)]="f.fin" />
            </mat-form-field>
          </div>
          @if (campos()['inicio']) { <p class="error">{{ campos()['inicio'] }}</p> }
          @if (campos()['fin']) { <p class="error">{{ campos()['fin'] }}</p> }
          <div class="dos">
            <mat-form-field>
              <mat-label>¿Se repite?</mat-label>
              <mat-select name="repeticion" [(ngModel)]="f.repeticion">
                @for (r of repeticiones; track r.valor) { <mat-option [value]="r.valor">{{ r.texto }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Lugar</mat-label>
              <input matInput name="lugar" maxlength="160" [(ngModel)]="f.lugar" />
            </mat-form-field>
          </div>
          <mat-form-field>
            <mat-label>Frase corta (tarjeta)</mat-label>
            <input matInput name="resumen" maxlength="200" [(ngModel)]="f.resumen" placeholder="Ej.: Una charla para parejas y un almuerzo compartido." />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Descripción</mat-label>
            <textarea matInput name="descripcion" rows="6" maxlength="5000" [(ngModel)]="f.descripcion"></textarea>
            <mat-hint>Dejá una línea en blanco entre párrafos.</mat-hint>
          </mat-form-field>
        </div>

        <div class="tarjeta pila">
          <app-selector-foto [(foto)]="foto" />
          @if (campos()['fotoId']) { <p class="error">{{ campos()['fotoId'] }}</p> }
          <div class="dos">
            <mat-form-field>
              <mat-label>Ministerio que lo organiza</mat-label>
              <mat-select name="ministerio" [(ngModel)]="f.ministerioId">
                <mat-option [value]="null">Ninguno</mat-option>
                @for (m of ministerios(); track m.id) { <mat-option [value]="m.id">{{ m.nombre }}</mat-option> }
              </mat-select>
            </mat-form-field>
            <mat-form-field>
              <mat-label>Link de inscripción (opcional)</mat-label>
              <input matInput name="link" maxlength="500" [(ngModel)]="f.linkInscripcion" placeholder="https://forms.gle/…" />
            </mat-form-field>
          </div>
          @if (campos()['linkInscripcion']) { <p class="error">{{ campos()['linkInscripcion'] }}</p> }
          <mat-slide-toggle name="destacado" [(ngModel)]="f.destacado">Mostrar en "Próximos eventos" del inicio</mat-slide-toggle>
          <mat-form-field>
            <mat-label>Dirección en la web</mat-label>
            <span matTextPrefix>/eventos/</span>
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
export class Eventos {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  private readonly dialogo = inject(MatDialog);

  protected readonly estados = ESTADOS_CONTENIDO;
  protected readonly repeticiones = REPETICIONES;
  protected readonly eventos = signal<EventoAdmin[]>([]);
  protected readonly ministerios = signal<MinisterioAdmin[]>([]);
  protected readonly editando = signal<string | null>(null);
  protected readonly guardando = signal(false);
  protected readonly campos = signal<Record<string, string>>({});
  protected f: Formulario = { ...VACIO };
  protected foto: FotoRef = null;

  private readonly vigente = (e: EventoAdmin) => e.repeticion !== 'ninguna' || new Date(e.fin ?? e.inicio).getTime() >= Date.now();
  protected readonly proximos = computed(() =>
    this.eventos()
      .filter(this.vigente)
      .sort((a, b) => a.inicio.localeCompare(b.inicio)),
  );
  protected readonly pasados = computed(() => this.eventos().filter((e) => !this.vigente(e)));

  constructor() {
    void this.cargar();
  }

  private async cargar() {
    try {
      const [eventos, ministerios] = await Promise.all([
        firstValueFrom(this.http.get<EventoAdmin[]>('/api/admin/eventos')),
        firstValueFrom(this.http.get<MinisterioAdmin[]>('/api/admin/ministerios')),
      ]);
      this.eventos.set(eventos);
      this.ministerios.set(ministerios);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected cuando(e: EventoAdmin) {
    const r = REPETICIONES.find((x) => x.valor === e.repeticion)!;
    return e.repeticion === 'ninguna' ? fecha(e.inicio) : `${r.texto} · desde ${fecha(e.inicio)}`;
  }

  protected nuevo() {
    this.f = { ...VACIO };
    this.foto = null;
    this.campos.set({});
    this.editando.set('');
  }

  protected editar(e: EventoAdmin) {
    this.f = {
      titulo: e.titulo,
      slug: e.slug,
      estado: e.estado,
      inicio: aFechaHoraLocal(e.inicio),
      fin: aFechaHoraLocal(e.fin),
      repeticion: e.repeticion,
      lugar: e.lugar ?? '',
      resumen: e.resumen ?? '',
      descripcion: e.descripcion ?? '',
      ministerioId: e.ministerioId,
      destacado: e.destacado,
      linkInscripcion: e.linkInscripcion ?? '',
      fotoId: e.foto?.id ?? null,
    };
    this.foto = e.foto;
    this.campos.set({});
    this.editando.set(e.id);
  }

  protected volver() {
    this.editando.set(null);
  }

  protected async guardar() {
    if (!this.f.inicio) {
      this.campos.set({ inicio: 'Elegí fecha y hora de inicio.' });
      return;
    }
    const id = this.editando();
    const cuerpo: Guardar<EventoAdmin> = { ...this.f, inicio: deFechaHoraLocal(this.f.inicio)!, fin: deFechaHoraLocal(this.f.fin), fotoId: this.foto?.id ?? null };
    this.guardando.set(true);
    this.campos.set({});
    try {
      const ev = await firstValueFrom(id ? this.http.put<EventoAdmin>(`/api/admin/eventos/${id}`, cuerpo) : this.http.post<EventoAdmin>('/api/admin/eventos', cuerpo));
      this.eventos.update((lista) => (id ? lista.map((x) => (x.id === id ? ev : x)) : [ev, ...lista]));
      this.avisos.exito(ev.estado === 'publicado' ? `"${ev.titulo}" publicado.` : `"${ev.titulo}" guardado como borrador.`);
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
    if (!id || !(await confirmar(this.dialogo, { titulo: 'Borrar evento', texto: `Se borra "${this.f.titulo}" y deja de verse en la web.`, accion: 'Borrar' }))) return;
    try {
      await firstValueFrom(this.http.delete(`/api/admin/eventos/${id}`));
      this.eventos.update((lista) => lista.filter((x) => x.id !== id));
      this.avisos.exito('Evento borrado.');
      this.volver();
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }
}
