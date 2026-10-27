import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, TemplateRef, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { EstadoVisita, Pagina, VisitaAdmin } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { ESTADOS_VISITA, fecha, linkWhatsapp } from '../formato';

const POR_PAGINA = 25;

@Component({
  selector: 'app-visitas',
  imports: [
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
  styles: `
    .filtros { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 16px; }
    .intereses { display: flex; flex-wrap: wrap; gap: 4px; }
    .notas { white-space: pre-line; max-width: 22rem; }
    .estado { width: 11rem; padding-top: 8px; }
    .vacio { padding: 24px 16px; margin: 0; }
  `,
  template: `
    <div class="encabezado"><h1>Primeras visitas</h1></div>
    <p class="ayuda" style="margin-bottom: 16px">Personas que avisaron por la web que vienen el domingo. Escribiles antes de la reunión y marcá cómo va cada una.</p>

    <div class="filtros">
      <mat-button-toggle-group [(ngModel)]="filtro" (change)="recargar()" aria-label="Filtrar por estado" hideSingleSelectionIndicator>
        @for (f of filtros; track f.valor) {
          <mat-button-toggle [value]="f.valor">{{ f.texto }}</mat-button-toggle>
        }
      </mat-button-toggle-group>
      <mat-form-field>
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix svgIcon="search" />
        <input matInput type="search" [(ngModel)]="busqueda" (keyup.enter)="recargar()" (search)="recargar()" placeholder="Nombre o contacto" />
      </mat-form-field>
    </div>

    <div class="tabla-caja">
      @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando visitas" /> }
      <table mat-table [dataSource]="visitas()" style="min-width: 52rem">
        <ng-container matColumnDef="creado">
          <th mat-header-cell *matHeaderCellDef>Pedido</th>
          <td mat-cell *matCellDef="let v">{{ fecha(v.creado) }}</td>
        </ng-container>
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let v"><strong>{{ v.nombre }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="contacto">
          <th mat-header-cell *matHeaderCellDef>Contacto</th>
          <td mat-cell *matCellDef="let v">
            @if (v.contactoTipo === 'whatsapp') {
              <a [href]="whatsapp(v.contacto)" target="_blank" rel="noopener">WhatsApp {{ v.contacto }}</a>
            } @else {
              <a [href]="'mailto:' + v.contacto">{{ v.contacto }}</a>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="intereses">
          <th mat-header-cell *matHeaderCellDef>Le interesa</th>
          <td mat-cell *matCellDef="let v">
            <div class="intereses">
              @for (i of v.intereses; track i) { <span class="etiqueta secondary">{{ i }}</span> } @empty { <span class="suave">—</span> }
            </div>
          </td>
        </ng-container>
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let v">
            <mat-form-field class="estado">
              <mat-select [value]="v.estado" (selectionChange)="cambiarEstado(v, $event.value)" [attr.aria-label]="'Estado de ' + v.nombre">
                @for (e of estados; track e.valor) { <mat-option [value]="e.valor">{{ e.texto }}</mat-option> }
              </mat-select>
            </mat-form-field>
          </td>
        </ng-container>
        <ng-container matColumnDef="notas">
          <th mat-header-cell *matHeaderCellDef>Notas</th>
          <td mat-cell *matCellDef="let v">
            <div class="notas">{{ v.notas || '' }}</div>
            <button matButton type="button" (click)="abrirNotas(v)">{{ v.notas ? 'Editar nota' : 'Agregar nota' }}</button>
            @if (v.atendidoPor) { <div class="ayuda">Último cambio: {{ v.atendidoPor }}</div> }
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
      </table>
      @if (!cargando() && visitas().length === 0) { <p class="vacio suave">No hay visitas con este filtro.</p> }
      <mat-paginator [length]="total()" [pageSize]="porPagina" [pageIndex]="pagina()" [hidePageSize]="true" (page)="cambiarPagina($event)" aria-label="Páginas de visitas" />
    </div>

    <ng-template #dialogoNotas>
      <h2 mat-dialog-title>Notas sobre {{ editando()?.nombre }}</h2>
      <form (ngSubmit)="guardarNotas()">
        <mat-dialog-content>
          <mat-form-field class="campo-completo">
            <mat-label>Notas</mat-label>
            <textarea matInput name="notas" rows="5" maxlength="2000" [(ngModel)]="notas" placeholder="Ej.: le escribimos el jueves, viene con su hija"></textarea>
          </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button matButton type="button" mat-dialog-close>Cancelar</button>
          <button matButton="filled" type="submit" [disabled]="guardando()">Guardar</button>
        </mat-dialog-actions>
      </form>
    </ng-template>
  `,
})
export class Visitas {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  private readonly dialogo = inject(MatDialog);
  private readonly plantillaNotas = viewChild.required<TemplateRef<unknown>>('dialogoNotas');
  private abierto: MatDialogRef<unknown> | null = null;

  readonly estadoInicial = input<EstadoVisita | undefined>(undefined, { alias: 'estado' });

  protected readonly columnas = ['creado', 'nombre', 'contacto', 'intereses', 'estado', 'notas'];
  protected readonly porPagina = POR_PAGINA;
  protected readonly fecha = fecha;
  protected readonly whatsapp = linkWhatsapp;
  protected readonly estados = (Object.keys(ESTADOS_VISITA) as EstadoVisita[]).map((valor) => ({ valor, texto: ESTADOS_VISITA[valor].texto }));
  protected readonly filtros = [{ valor: 'todas', texto: 'Todas' }, ...this.estados.map((e) => ({ ...e, texto: e.valor === 'nueva' ? 'Sin contactar' : e.texto }))];

  protected filtro: EstadoVisita | 'todas' = 'todas';
  protected busqueda = '';
  protected notas = '';

  protected readonly visitas = signal<VisitaAdmin[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly editando = signal<VisitaAdmin | null>(null);

  ngOnInit() {
    const desdeInicio = this.estadoInicial();
    if (desdeInicio) this.filtro = desdeInicio;
    void this.cargar();
  }

  protected async cargar() {
    let params = new HttpParams().set('pagina', this.pagina() + 1);
    if (this.filtro !== 'todas') params = params.set('estado', this.filtro);
    if (this.busqueda.trim()) params = params.set('q', this.busqueda.trim());
    this.cargando.set(true);
    try {
      const r = await firstValueFrom(this.http.get<Pagina<VisitaAdmin>>('/api/admin/visitas', { params }));
      this.visitas.set(r.items);
      this.total.set(r.total);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  protected recargar() {
    this.pagina.set(0);
    void this.cargar();
  }

  protected cambiarPagina(e: PageEvent) {
    this.pagina.set(e.pageIndex);
    void this.cargar();
  }

  protected cambiarEstado(v: VisitaAdmin, estado: EstadoVisita) {
    void this.guardar(v, { estado }, `${v.nombre}: ${ESTADOS_VISITA[estado].texto.toLowerCase()}.`);
  }

  protected abrirNotas(v: VisitaAdmin) {
    this.notas = v.notas ?? '';
    this.editando.set(v);
    this.abierto = this.dialogo.open(this.plantillaNotas(), { width: '30rem', maxWidth: '95vw' });
    this.abierto.afterClosed().subscribe(() => this.editando.set(null));
  }

  protected async guardarNotas() {
    const v = this.editando();
    if (v && (await this.guardar(v, { notas: this.notas.trim() }, 'Nota guardada.'))) this.abierto?.close();
  }

  private async guardar(v: VisitaAdmin, cambios: object, exito: string) {
    this.guardando.set(true);
    try {
      const actualizada = await firstValueFrom(this.http.patch<VisitaAdmin>(`/api/admin/visitas/${v.id}`, cambios));
      this.visitas.update((lista) => lista.map((x) => (x.id === actualizada.id ? actualizada : x)));
      this.avisos.exito(exito);
      return true;
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
      return false;
    } finally {
      this.guardando.set(false);
    }
  }
}
