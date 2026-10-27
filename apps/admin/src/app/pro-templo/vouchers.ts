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
import type { ConfirmarVoucher, EstadoVoucher, FormaPago, Pagina, VoucherAdmin } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { ESTADOS_VOUCHER, FORMAS_PAGO, fecha, linkWhatsapp, numeroVoucher, usd } from '../formato';

type Filtro = EstadoVoucher | 'apodos' | 'todos';
const POR_PAGINA = 25;

@Component({
  selector: 'app-vouchers',
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
    .acciones { display: flex; gap: 4px; flex-wrap: wrap; padding: 6px 0; }
    .detalle { display: grid; grid-template-columns: max-content 1fr; gap: 8px 16px; margin: 0; }
    .detalle dt { font-weight: 700; }
    .detalle dd { margin: 0; white-space: pre-line; }
    .link-numero { background: none; border: 0; padding: 0; font: inherit; font-weight: 800; color: var(--azul); cursor: pointer; text-decoration: underline; }
    .vacio { padding: 24px 16px; margin: 0; }
    .apodo { display: block; margin-top: 4px; }
  `,
  template: `
    <div class="encabezado">
      <h1>Vouchers</h1>
    </div>

    <div class="filtros">
      <mat-button-toggle-group [(ngModel)]="filtro" (change)="recargar()" aria-label="Filtrar por estado" hideSingleSelectionIndicator>
        @for (e of estados; track e.valor) {
          <mat-button-toggle [value]="e.valor">{{ e.texto }}</mat-button-toggle>
        }
      </mat-button-toggle-group>
      <mat-form-field>
        <mat-label>Forma de pago</mat-label>
        <mat-select [(ngModel)]="formaPago" (selectionChange)="recargar()">
          <mat-option [value]="null">Todas</mat-option>
          @for (f of formasPago; track f.valor) {
            <mat-option [value]="f.valor">{{ f.texto }}</mat-option>
          }
        </mat-select>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Buscar</mat-label>
        <mat-icon matPrefix svgIcon="search" />
        <input matInput type="search" [(ngModel)]="busqueda" (keyup.enter)="recargar()" (search)="recargar()" placeholder="Número, nombre o contacto" />
      </mat-form-field>
    </div>

    <div class="tabla-caja">
      @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando vouchers" /> }
      <table mat-table [dataSource]="vouchers()" style="min-width: 60rem">
        <ng-container matColumnDef="numero">
          <th mat-header-cell *matHeaderCellDef>Nº</th>
          <td mat-cell *matCellDef="let v"><button type="button" class="link-numero" (click)="verDetalle(v)">{{ numero(v.numero) }}</button></td>
        </ng-container>
        <ng-container matColumnDef="creado">
          <th mat-header-cell *matHeaderCellDef>Pedido</th>
          <td mat-cell *matCellDef="let v">{{ fecha(v.creado) }}</td>
        </ng-container>
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let v">
            {{ v.nombre }}
            @if (v.mostrarComo === 'apodo') {
              <span class="etiqueta apodo" [class]="v.apodoAprobado ? 'success' : 'warn'">Apodo: {{ v.apodo }}</span>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="contacto">
          <th mat-header-cell *matHeaderCellDef>Contacto</th>
          <td mat-cell *matCellDef="let v">
            @if (v.contactoTipo === 'whatsapp') {
              <a [href]="whatsapp(v.contacto)" target="_blank" rel="noopener">{{ v.contacto }}</a>
            } @else {
              <a [href]="'mailto:' + v.contacto">{{ v.contacto }}</a>
            }
          </td>
        </ng-container>
        <ng-container matColumnDef="monto">
          <th mat-header-cell *matHeaderCellDef>Monto</th>
          <td mat-cell *matCellDef="let v" class="numero"><strong>{{ usd(v.montoUsd) }}</strong></td>
        </ng-container>
        <ng-container matColumnDef="pago">
          <th mat-header-cell *matHeaderCellDef>Pago</th>
          <td mat-cell *matCellDef="let v">{{ formaPagoTexto(v.formaPago) }}</td>
        </ng-container>
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let v"><span class="etiqueta" [class]="estado(v.estado).severidad">{{ estado(v.estado).texto }}</span></td>
        </ng-container>
        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let v">
            <div class="acciones">
              @if (v.estado === 'pendiente' || v.estado === 'vencido') {
                <button matButton="filled" type="button" (click)="abrirConfirmar(v)">Confirmar pago</button>
              }
              @if (v.mostrarComo === 'apodo' && !v.apodoAprobado && v.estado !== 'anulado') {
                <button matButton="outlined" type="button" (click)="revisarApodo(v, true)">Aprobar apodo</button>
                <button matButton="outlined" type="button" (click)="revisarApodo(v, false)">Rechazar apodo</button>
              }
              @if (v.estado === 'vencido' || v.estado === 'anulado') {
                <button matButton="outlined" type="button" (click)="reactivar(v)">Reactivar</button>
              }
              @if (v.estado !== 'anulado') {
                <button matButton type="button" class="peligro" (click)="abrirAnular(v)">Anular</button>
              }
            </div>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
      </table>
      @if (!cargando() && vouchers().length === 0) {
        <p class="vacio suave">No hay vouchers con este filtro.</p>
      }
      <mat-paginator [length]="total()" [pageSize]="porPagina" [pageIndex]="pagina()" [hidePageSize]="true" [showFirstLastButtons]="true" (page)="cambiarPagina($event)" aria-label="Páginas de vouchers" />
    </div>

    <ng-template #dialogoConfirmar>
      @if (confirmando(); as v) {
        <h2 mat-dialog-title>Confirmar pago {{ numero(v.numero) }}</h2>
        <form (ngSubmit)="confirmar()">
          <mat-dialog-content>
            <div class="pila">
              <p style="margin: 0">{{ v.nombre }} pidió un voucher de <strong>{{ usd(v.montoUsd) }}</strong> para pagar en {{ formaPagoTexto(v.formaPago).toLowerCase() }}.</p>
              <div>
                <p style="margin: 0 0 6px; font-weight: 600" id="moneda-etiqueta">¿En qué moneda se recibió?</p>
                <mat-button-toggle-group name="moneda" [(ngModel)]="pago.monedaRecibida" (change)="cambiarMoneda(v)" aria-labelledby="moneda-etiqueta" hideSingleSelectionIndicator>
                  <mat-button-toggle value="USD">Dólares</mat-button-toggle>
                  <mat-button-toggle value="ARS">Pesos</mat-button-toggle>
                </mat-button-toggle-group>
              </div>
              <mat-form-field>
                <mat-label>Monto recibido ({{ pago.monedaRecibida }})</mat-label>
                <input matInput name="recibido" type="number" min="0" step="0.01" [(ngModel)]="pago.montoRecibido" />
              </mat-form-field>
              @if (campos()['montoRecibido']) { <p class="error">{{ campos()['montoRecibido'] }}</p> }
              @if (pago.monedaRecibida === 'ARS') {
                <mat-form-field>
                  <mat-label>Tipo de cambio (pesos por dólar)</mat-label>
                  <input matInput name="cambio" type="number" min="0" step="0.01" [(ngModel)]="pago.tipoCambio" />
                </mat-form-field>
                @if (campos()['tipoCambio']) { <p class="error">{{ campos()['tipoCambio'] }}</p> }
              }
              <mat-form-field>
                <mat-label>Nota (opcional)</mat-label>
                <textarea matInput name="nota" rows="3" maxlength="500" [(ngModel)]="pago.nota" placeholder="Número de comprobante, quién lo recibió…"></textarea>
              </mat-form-field>
              @if (errorDialogo()) { <p class="aviso-error" role="alert">{{ errorDialogo() }}</p> }
              <p class="ayuda">Al confirmar, el voucher suma a la pared de la web en menos de 30 segundos.</p>
            </div>
          </mat-dialog-content>
          <mat-dialog-actions align="end">
            <button matButton type="button" mat-dialog-close>Cancelar</button>
            <button matButton="filled" type="submit" [disabled]="guardando()">Confirmar pago</button>
          </mat-dialog-actions>
        </form>
      }
    </ng-template>

    <ng-template #dialogoAnular>
      @if (anulando(); as v) {
        <h2 mat-dialog-title>Anular {{ numero(v.numero) }}</h2>
        <form (ngSubmit)="anular()">
          <mat-dialog-content>
            <div class="pila">
              <p style="margin: 0">El voucher queda guardado pero no suma. Si estaba confirmado, el total de la web baja {{ usd(v.montoUsd) }}.</p>
              <mat-form-field>
                <mat-label>Motivo</mat-label>
                <textarea matInput name="motivo" rows="3" maxlength="300" [(ngModel)]="motivo" placeholder="Ej.: pedido duplicado"></textarea>
              </mat-form-field>
              @if (campos()['motivo']) { <p class="error">{{ campos()['motivo'] }}</p> }
              @if (errorDialogo()) { <p class="aviso-error" role="alert">{{ errorDialogo() }}</p> }
            </div>
          </mat-dialog-content>
          <mat-dialog-actions align="end">
            <button matButton type="button" mat-dialog-close>Cancelar</button>
            <button matButton="filled" type="submit" class="peligro-relleno" [disabled]="guardando()">Anular voucher</button>
          </mat-dialog-actions>
        </form>
      }
    </ng-template>

    <ng-template #dialogoDetalle let-v>
      <h2 mat-dialog-title>Voucher {{ numero(v.numero) }}</h2>
      <mat-dialog-content>
        <dl class="detalle">
          <dt>Estado</dt><dd><span class="etiqueta" [class]="estado(v.estado).severidad">{{ estado(v.estado).texto }}</span></dd>
          <dt>Monto</dt><dd>{{ usd(v.montoUsd) }}</dd>
          <dt>Nombre</dt><dd>{{ v.nombre }}</dd>
          <dt>En la web</dt><dd>{{ comoAparece(v) }}</dd>
          <dt>Contacto</dt><dd>{{ v.contacto }} ({{ v.contactoTipo === 'whatsapp' ? 'WhatsApp' : 'email' }})</dd>
          <dt>Forma de pago</dt><dd>{{ formaPagoTexto(v.formaPago) }}</dd>
          <dt>Pedido</dt><dd>{{ fecha(v.creado) }}</dd>
          @if (v.mensaje) { <dt>Mensaje</dt><dd>{{ v.mensaje }}</dd> }
          @if (v.confirmadoEn) {
            <dt>Recibido</dt><dd>{{ v.montoRecibido }} {{ v.monedaRecibida }}@if (v.tipoCambio) { · cambio {{ v.tipoCambio }} }</dd>
            <dt>Confirmó</dt><dd>{{ v.confirmadoPor }} · {{ fecha(v.confirmadoEn) }}</dd>
          }
          @if (v.nota) { <dt>Nota</dt><dd>{{ v.nota }}</dd> }
          @if (v.motivoAnulacion) { <dt>Motivo de anulación</dt><dd>{{ v.motivoAnulacion }}</dd> }
        </dl>
      </mat-dialog-content>
      <mat-dialog-actions align="end"><button matButton type="button" mat-dialog-close>Cerrar</button></mat-dialog-actions>
    </ng-template>
  `,
})
export class Vouchers {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  private readonly dialogo = inject(MatDialog);
  private readonly plantillaConfirmar = viewChild.required<TemplateRef<unknown>>('dialogoConfirmar');
  private readonly plantillaAnular = viewChild.required<TemplateRef<unknown>>('dialogoAnular');
  private readonly plantillaDetalle = viewChild.required<TemplateRef<unknown>>('dialogoDetalle');
  private abierto: MatDialogRef<unknown> | null = null;

  // Llega por query param desde el inicio (?estado=pendiente).
  readonly estadoInicial = input<Filtro | undefined>(undefined, { alias: 'estado' });

  protected readonly columnas = ['numero', 'creado', 'nombre', 'contacto', 'monto', 'pago', 'estado', 'acciones'];
  protected readonly porPagina = POR_PAGINA;
  protected readonly usd = usd;
  protected readonly fecha = fecha;
  protected readonly numero = numeroVoucher;
  protected readonly whatsapp = linkWhatsapp;
  protected readonly estado = (e: EstadoVoucher) => ESTADOS_VOUCHER[e];
  protected readonly formaPagoTexto = (f: FormaPago) => FORMAS_PAGO[f];
  protected readonly comoAparece = (v: VoucherAdmin) =>
    v.mostrarComo === 'nombre' ? 'Con su nombre' : v.mostrarComo === 'apodo' ? `Como "${v.apodo}"${v.apodoAprobado ? '' : ' (sin aprobar)'}` : 'Anónimo';

  protected readonly estados = [
    { valor: 'todos', texto: 'Todos' },
    { valor: 'pendiente', texto: 'Pendientes' },
    { valor: 'apodos', texto: 'Apodos por revisar' },
    { valor: 'confirmado', texto: 'Confirmados' },
    { valor: 'vencido', texto: 'Vencidos' },
    { valor: 'anulado', texto: 'Anulados' },
  ];
  protected readonly formasPago = (Object.keys(FORMAS_PAGO) as FormaPago[]).map((valor) => ({ valor, texto: FORMAS_PAGO[valor] }));

  protected filtro: Filtro = 'todos';
  protected formaPago: FormaPago | null = null;
  protected busqueda = '';

  protected readonly vouchers = signal<VoucherAdmin[]>([]);
  protected readonly total = signal(0);
  protected readonly pagina = signal(0);
  protected readonly cargando = signal(false);
  protected readonly guardando = signal(false);
  protected readonly errorDialogo = signal('');
  protected readonly campos = signal<Record<string, string>>({});
  protected readonly confirmando = signal<VoucherAdmin | null>(null);
  protected readonly anulando = signal<VoucherAdmin | null>(null);
  protected pago: ConfirmarVoucher = { montoRecibido: 0, monedaRecibida: 'USD' };
  protected motivo = '';

  ngOnInit() {
    const desdeInicio = this.estadoInicial();
    if (desdeInicio) this.filtro = desdeInicio;
    void this.cargar();
  }

  protected async cargar() {
    let params = new HttpParams().set('pagina', this.pagina() + 1);
    if (this.filtro !== 'todos') params = params.set('estado', this.filtro);
    if (this.formaPago) params = params.set('formaPago', this.formaPago);
    if (this.busqueda.trim()) params = params.set('q', this.busqueda.trim());
    this.cargando.set(true);
    try {
      const r = await firstValueFrom(this.http.get<Pagina<VoucherAdmin>>('/api/admin/vouchers', { params }));
      this.vouchers.set(r.items);
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

  protected verDetalle(v: VoucherAdmin) {
    this.dialogo.open(this.plantillaDetalle(), { data: v, width: '34rem', maxWidth: '95vw' });
  }

  protected abrirConfirmar(v: VoucherAdmin) {
    this.pago = { montoRecibido: v.montoUsd, monedaRecibida: 'USD' };
    this.limpiarErrores();
    this.confirmando.set(v);
    this.abrir(this.plantillaConfirmar(), () => this.confirmando.set(null));
  }

  /** En dólares se propone el monto del voucher; en pesos hay que escribirlo. */
  protected cambiarMoneda(v: VoucherAdmin) {
    this.pago.montoRecibido = this.pago.monedaRecibida === 'USD' ? v.montoUsd : (null as unknown as number);
  }

  protected abrirAnular(v: VoucherAdmin) {
    this.motivo = '';
    this.limpiarErrores();
    this.anulando.set(v);
    this.abrir(this.plantillaAnular(), () => this.anulando.set(null));
  }

  protected async confirmar() {
    const v = this.confirmando();
    if (!v) return;
    const cuerpo: ConfirmarVoucher = {
      montoRecibido: Number(this.pago.montoRecibido),
      monedaRecibida: this.pago.monedaRecibida,
      ...(this.pago.monedaRecibida === 'ARS' && this.pago.tipoCambio ? { tipoCambio: Number(this.pago.tipoCambio) } : {}),
      ...(this.pago.nota?.trim() ? { nota: this.pago.nota.trim() } : {}),
    };
    if (await this.accion(`/api/admin/vouchers/${v.numero}/confirmar`, cuerpo, `${numeroVoucher(v.numero)} confirmado. Ya suma a la pared.`)) {
      this.abierto?.close();
    }
  }

  protected async anular() {
    const v = this.anulando();
    if (!v) return;
    if (await this.accion(`/api/admin/vouchers/${v.numero}/anular`, { motivo: this.motivo.trim() }, `${numeroVoucher(v.numero)} anulado.`)) {
      this.abierto?.close();
    }
  }

  protected reactivar(v: VoucherAdmin) {
    void this.accion(`/api/admin/vouchers/${v.numero}/reactivar`, {}, `${numeroVoucher(v.numero)} volvió a pendiente.`);
  }

  protected revisarApodo(v: VoucherAdmin, aprobado: boolean) {
    void this.accion(
      `/api/admin/vouchers/${v.numero}/apodo`,
      { aprobado },
      aprobado ? `Se muestra "${v.apodo}" en la web.` : `${numeroVoucher(v.numero)} pasa a anónimo.`,
    );
  }

  private abrir(plantilla: TemplateRef<unknown>, alCerrar: () => void) {
    this.abierto = this.dialogo.open(plantilla, { width: '30rem', maxWidth: '95vw' });
    this.abierto.afterClosed().subscribe(alCerrar);
  }

  /** Ejecuta una acción y, si sale bien, reemplaza el voucher en la tabla. */
  private async accion(ruta: string, cuerpo: object, exito: string) {
    this.guardando.set(true);
    this.limpiarErrores();
    try {
      const actualizado = await firstValueFrom(this.http.post<VoucherAdmin>(ruta, cuerpo));
      this.vouchers.update((lista) => lista.map((x) => (x.id === actualizado.id ? actualizado : x)));
      this.avisos.exito(exito);
      return true;
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.campos.set(campos);
      if (this.confirmando() || this.anulando()) this.errorDialogo.set(Object.keys(campos).length ? '' : mensaje);
      else this.avisos.error(mensaje);
      return false;
    } finally {
      this.guardando.set(false);
    }
  }

  private limpiarErrores() {
    this.errorDialogo.set('');
    this.campos.set({});
  }
}
