import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { FotoRef, TextosAdmin, TextosSitio } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { SelectorFoto } from '../medios/selector-foto';
import { COLORES_MARCA } from './comun';

const MAX_GALERIA = 8;
// Los bloques de "Lo que nos mueve" admiten además el negro del sitio.
const COLORES_PILARES = [...COLORES_MARCA, { valor: '#0a0a0a', texto: 'Negro' }];

@Component({
  selector: 'app-nosotros',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, SelectorFoto],
  styles: `
    .dos { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 0 16px; }
    .renglon { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto; gap: 8px; align-items: start; }
    @media (max-width: 700px) { .renglon { grid-template-columns: minmax(0, 1fr) auto; } }
    .pilar { border: 1px solid var(--linea); border-radius: 12px; padding: 12px; display: flex; flex-direction: column; gap: 4px; }
    .colores { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; }
    .color { width: 32px; height: 32px; border-radius: 999px; border: 2px solid var(--linea); cursor: pointer; padding: 0; }
    .color[aria-pressed='true'] { outline: 3px solid var(--texto); outline-offset: 2px; }
    .galeria { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
    .barra { position: sticky; bottom: 0; background: var(--fondo); padding: 12px 0; border-top: 1px solid var(--linea); }
  `,
  template: `
    <div class="encabezado"><h1>Nosotros</h1></div>
    @if (t(); as t) {
      <form class="pila" (ngSubmit)="guardar()">
        <section class="tarjeta pila" aria-labelledby="n-portada">
          <h2 id="n-portada">Presentación</h2>
          <mat-form-field>
            <mat-label>Quiénes somos (texto de arriba)</mat-label>
            <textarea matInput name="intro" rows="3" maxlength="600" [(ngModel)]="t.nosotrosIntro"></textarea>
          </mat-form-field>
          <mat-form-field>
            <mat-label>Datos de la iglesia</mat-label>
            <input matInput name="datos" maxlength="200" [(ngModel)]="t.datosIglesia" placeholder="Más de 150 personas · Desde 2016 · Floresta, CABA" />
          </mat-form-field>
          <app-selector-foto [(foto)]="portada" />
          <p class="ayuda">Foto grande de arriba. Si no elegís ninguna, se muestra la de diseño.</p>
        </section>

        <section class="tarjeta pila" aria-labelledby="n-historia">
          <h2 id="n-historia">Nuestra historia</h2>
          <mat-form-field>
            <mat-label>Historia</mat-label>
            <textarea matInput name="historia" rows="7" maxlength="4000" [(ngModel)]="t.historia"></textarea>
            <mat-hint>Dejá una línea en blanco entre párrafos.</mat-hint>
          </mat-form-field>
          <app-selector-foto [(foto)]="fotoHistoria" />
        </section>

        <section class="tarjeta pila" aria-labelledby="n-pilares">
          <h2 id="n-pilares">Lo que nos mueve</h2>
          <p class="ayuda">Bloques de color, de 2 a 6.</p>
          <div class="dos" style="gap: 12px 16px">
            @for (p of t.pilares; track $index; let i = $index) {
              <div class="pilar">
                <mat-form-field><mat-label>Título</mat-label><input matInput [name]="'pt' + i" maxlength="80" [(ngModel)]="p.titulo" /></mat-form-field>
                <mat-form-field><mat-label>Texto</mat-label><textarea matInput [name]="'px' + i" rows="2" maxlength="400" [(ngModel)]="p.texto"></textarea></mat-form-field>
                <div class="fila" style="justify-content: space-between">
                  <div class="colores" role="group" [attr.aria-label]="'Color del bloque ' + (i + 1)">
                    @for (c of colores; track c.valor) {
                      <button type="button" class="color" [style.background]="c.valor" [attr.aria-pressed]="p.color === c.valor" [attr.aria-label]="c.texto" (click)="p.color = c.valor"></button>
                    }
                  </div>
                  <button matIconButton type="button" (click)="t.pilares.splice(i, 1)" [disabled]="t.pilares.length <= 2" aria-label="Quitar este bloque"><mat-icon svgIcon="delete" /></button>
                </div>
              </div>
            }
          </div>
          @if (t.pilares.length < 6) {
            <button matButton type="button" style="align-self: flex-start" (click)="t.pilares.push({ titulo: '', texto: '', color: '#0c74b8' })"><mat-icon svgIcon="add" />Agregar bloque</button>
          }
        </section>

        <section class="tarjeta pila" aria-labelledby="n-pastores">
          <h2 id="n-pastores">Nuestros pastores</h2>
          <mat-form-field><mat-label>Nombres</mat-label><input matInput name="pnombres" maxlength="120" [(ngModel)]="t.pastores.nombres" /></mat-form-field>
          <mat-form-field><mat-label>Sobre los pastores</mat-label><textarea matInput name="ptexto" rows="4" maxlength="1500" [(ngModel)]="t.pastores.texto"></textarea></mat-form-field>
          <mat-form-field><mat-label>Frase</mat-label><input matInput name="pcita" maxlength="300" [(ngModel)]="t.pastores.cita" /></mat-form-field>
          <app-selector-foto [(foto)]="fotoPastores" />
        </section>

        <section class="tarjeta pila" aria-labelledby="n-creemos">
          <h2 id="n-creemos">Lo que creemos</h2>
          @for (c of t.creemos; track $index; let i = $index) {
            <div class="renglon">
              <mat-form-field><mat-label>Título</mat-label><input matInput [name]="'kt' + i" maxlength="80" [(ngModel)]="c.titulo" /></mat-form-field>
              <mat-form-field><mat-label>Texto</mat-label><input matInput [name]="'kx' + i" maxlength="400" [(ngModel)]="c.texto" /></mat-form-field>
              <button matIconButton type="button" (click)="t.creemos.splice(i, 1)" aria-label="Quitar"><mat-icon svgIcon="delete" /></button>
            </div>
          }
          <button matButton type="button" style="align-self: flex-start" (click)="t.creemos.push({ titulo: '', texto: '' })"><mat-icon svgIcon="add" />Agregar</button>
        </section>

        <section class="tarjeta pila" aria-labelledby="n-galeria">
          <h2 id="n-galeria">Galería</h2>
          <p class="ayuda">Hasta {{ maxGaleria }} fotos al pie de la página. Sin fotos elegidas se muestran las de diseño.</p>
          <div class="galeria">
            @for (f of galeria(); track f?.id ?? $index; let i = $index) {
              <app-selector-foto [foto]="f" (fotoChange)="cambiarGaleria(i, $event)" />
            }
            @if (galeria().length < maxGaleria) {
              <app-selector-foto [foto]="null" (fotoChange)="agregarGaleria($event)" />
            }
          </div>
        </section>

        @if (campos()['fotosNosotros']) { <p class="aviso-error" role="alert">{{ campos()['fotosNosotros'] }}</p> }
        <div class="barra fila derecha">
          <button matButton="filled" type="submit" [disabled]="guardando()">Guardar Nosotros</button>
        </div>
      </form>
    } @else {
      <p class="suave">Cargando…</p>
    }
  `,
})
export class Nosotros {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);

  protected readonly colores = COLORES_PILARES;
  protected readonly maxGaleria = MAX_GALERIA;
  protected readonly t = signal<TextosSitio | null>(null);
  protected readonly galeria = signal<FotoRef[]>([]);
  protected readonly guardando = signal(false);
  protected readonly campos = signal<Record<string, string>>({});
  protected portada: FotoRef = null;
  protected fotoHistoria: FotoRef = null;
  protected fotoPastores: FotoRef = null;

  constructor() {
    firstValueFrom(this.http.get<TextosAdmin>('/api/admin/textos'))
      .then((r) => this.cargar(r))
      .catch((e) => this.avisos.error(errorDe(e).mensaje));
  }

  private cargar({ fotos, ...textos }: TextosAdmin) {
    const ref = (id: string | null) => (id ? (fotos[id] ?? null) : null);
    this.portada = ref(textos.fotosNosotros.portada);
    this.fotoHistoria = ref(textos.fotosNosotros.historia);
    this.fotoPastores = ref(textos.fotosNosotros.pastores);
    this.galeria.set(textos.fotosNosotros.galeria.map(ref).filter((f) => f !== null));
    this.t.set(textos);
  }

  protected cambiarGaleria(i: number, f: FotoRef) {
    // "Quitar" deja el lugar vacío: se saca de la lista.
    this.galeria.update((lista) => (f ? lista.map((x, j) => (j === i ? f : x)) : lista.filter((_, j) => j !== i)));
  }

  protected agregarGaleria(f: FotoRef) {
    if (f) this.galeria.update((lista) => [...lista, f]);
  }

  protected async guardar() {
    const t = this.t();
    if (!t) return;
    const cuerpo: TextosSitio = {
      ...t,
      fotosNosotros: {
        portada: this.portada?.id ?? null,
        historia: this.fotoHistoria?.id ?? null,
        pastores: this.fotoPastores?.id ?? null,
        galeria: this.galeria().flatMap((f) => (f ? [f.id] : [])),
      },
    };
    this.guardando.set(true);
    this.campos.set({});
    try {
      this.cargar(await firstValueFrom(this.http.put<TextosAdmin>('/api/admin/textos', cuerpo)));
      this.avisos.exito('Nosotros guardado. En menos de un minuto se ve en la web.');
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.campos.set(campos);
      this.avisos.error(Object.keys(campos).length ? 'Revisá los campos marcados.' : mensaje);
    } finally {
      this.guardando.set(false);
    }
  }
}
