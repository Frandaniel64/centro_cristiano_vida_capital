import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import type { AjusteAdmin, CampanaAdmin, FormaPago } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { FORMAS_PAGO, fecha, usd } from '../formato';

@Component({
  selector: 'app-campana',
  imports: [FormsModule, MatButtonModule, MatCheckboxModule, MatFormFieldModule, MatInputModule, MatSlideToggleModule, MatTableModule],
  styles: `
    .columnas { display: grid; grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); gap: 20px; align-items: start; }
    .opciones { display: flex; flex-wrap: wrap; gap: 4px 16px; }
    .positivo { color: #2f6b12; }
    .negativo { color: #b42318; }
    fieldset { border: 0; padding: 0; margin: 0; }
    legend { font-weight: 600; margin-bottom: 4px; padding: 0; }
    .vacio { padding: 16px; margin: 0; }
  `,
  template: `
    <div class="encabezado"><h1>Campaña Pro Templo</h1></div>

    <div class="columnas">
      <section class="tarjeta pila" aria-labelledby="titulo-ajustes">
        <h2 id="titulo-ajustes">Ajustes manuales</h2>
        <p class="ayuda">
          Para la plata que entró sin voucher: lo juntado antes del sitio, donaciones en mano o correcciones. Suma (o resta, con signo menos) al
          total de la web y queda registrado quién lo cargó.
        </p>
        <form class="pila" (ngSubmit)="crearAjuste()">
          <mat-form-field>
            <mat-label>Monto en dólares</mat-label>
            <input matInput name="monto" type="number" step="1" [(ngModel)]="ajusteMonto" placeholder="Ej.: 1500 o -50" />
          </mat-form-field>
          @if (camposAjuste()['montoUsd']) { <p class="error">{{ camposAjuste()['montoUsd'] }}</p> }
          <mat-form-field>
            <mat-label>Motivo</mat-label>
            <input matInput name="motivo" maxlength="300" [(ngModel)]="ajusteMotivo" placeholder="Ej.: recaudado antes del lanzamiento del sitio" />
          </mat-form-field>
          @if (camposAjuste()['motivo']) { <p class="error">{{ camposAjuste()['motivo'] }}</p> }
          <button matButton="filled" type="submit" [disabled]="guardandoAjuste()">Cargar ajuste</button>
        </form>

        <div class="tabla-caja">
          <table mat-table [dataSource]="ajustes()">
            <ng-container matColumnDef="fecha">
              <th mat-header-cell *matHeaderCellDef>Fecha</th>
              <td mat-cell *matCellDef="let a">{{ fecha(a.creado) }}</td>
            </ng-container>
            <ng-container matColumnDef="monto">
              <th mat-header-cell *matHeaderCellDef>Monto</th>
              <td mat-cell *matCellDef="let a" class="numero" [class.positivo]="a.montoUsd > 0" [class.negativo]="a.montoUsd < 0">
                <strong>{{ a.montoUsd > 0 ? '+' : '−' }}{{ usd(abs(a.montoUsd)) }}</strong>
              </td>
            </ng-container>
            <ng-container matColumnDef="motivo">
              <th mat-header-cell *matHeaderCellDef>Motivo</th>
              <td mat-cell *matCellDef="let a">{{ a.motivo }}</td>
            </ng-container>
            <ng-container matColumnDef="cargo">
              <th mat-header-cell *matHeaderCellDef>Cargó</th>
              <td mat-cell *matCellDef="let a">{{ a.cargadoPor }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="columnas"></tr>
            <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
          </table>
          @if (ajustes().length === 0) { <p class="vacio suave">Todavía no hay ajustes.</p> }
        </div>
      </section>

      @if (campana(); as c) {
        <section class="tarjeta pila" aria-labelledby="titulo-config">
          <h2 id="titulo-config">Configuración</h2>
          <form class="pila" (ngSubmit)="guardarCampana()">
            <mat-form-field>
              <mat-label>Meta (USD)</mat-label>
              <input matInput name="meta" type="number" min="100" step="100" [(ngModel)]="c.metaUsd" />
              <mat-hint>Cada ladrillo vale la meta dividida 100: hoy {{ usd(c.metaUsd / 100) }}.</mat-hint>
            </mat-form-field>
            @if (camposCampana()['metaUsd']) { <p class="error">{{ camposCampana()['metaUsd'] }}</p> }
            <mat-form-field>
              <mat-label>Monto máximo por voucher (USD)</mat-label>
              <input matInput name="maximo" type="number" min="1" [(ngModel)]="c.montoMaximoUsd" />
            </mat-form-field>
            <mat-form-field>
              <mat-label>Botones de monto del formulario</mat-label>
              <input matInput name="montos" [(ngModel)]="montosTexto" placeholder="1, 5, 10, 20, 50, 100" />
              <mat-hint>Separados por coma, hasta 8.</mat-hint>
            </mat-form-field>
            <fieldset>
              <legend>Formas de pago activas</legend>
              <div class="opciones">
                @for (f of formas; track f.valor) {
                  <mat-checkbox [checked]="c.formasPagoActivas.includes(f.valor)" (change)="alternarForma(c, f.valor, $event.checked)">{{ f.texto }}</mat-checkbox>
                }
              </div>
              @if (camposCampana()['formasPagoActivas']) { <p class="error">{{ camposCampana()['formasPagoActivas'] }}</p> }
            </fieldset>
            <mat-form-field>
              <mat-label>Días para que venza un voucher sin pagar</mat-label>
              <input matInput name="dias" type="number" min="1" max="365" [(ngModel)]="c.diasVencimiento" />
            </mat-form-field>
            <mat-slide-toggle name="mostrarMontos" [(ngModel)]="c.mostrarMontos">Mostrar los montos en "Últimos vouchers" de la web</mat-slide-toggle>
            <mat-form-field>
              <mat-label>Mensaje al llegar a la meta</mat-label>
              <textarea matInput name="mensajeMeta" rows="3" maxlength="500" [(ngModel)]="c.mensajeMetaCumplida"></textarea>
            </mat-form-field>
            <button matButton="filled" type="submit" [disabled]="guardandoCampana()">Guardar configuración</button>
          </form>
        </section>
      }
    </div>
  `,
})
export class Campana {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  protected readonly usd = usd;
  protected readonly fecha = fecha;
  protected readonly abs = Math.abs;
  protected readonly columnas = ['fecha', 'monto', 'motivo', 'cargo'];
  protected readonly formas = (Object.keys(FORMAS_PAGO) as FormaPago[]).map((valor) => ({ valor, texto: FORMAS_PAGO[valor] }));

  protected readonly ajustes = signal<AjusteAdmin[]>([]);
  protected readonly campana = signal<CampanaAdmin | null>(null);
  protected readonly guardandoAjuste = signal(false);
  protected readonly guardandoCampana = signal(false);
  protected readonly camposAjuste = signal<Record<string, string>>({});
  protected readonly camposCampana = signal<Record<string, string>>({});
  protected ajusteMonto: number | null = null;
  protected ajusteMotivo = '';
  protected montosTexto = '';

  constructor() {
    void this.cargar();
  }

  private async cargar() {
    try {
      const [ajustes, campana] = await Promise.all([
        firstValueFrom(this.http.get<AjusteAdmin[]>('/api/admin/ajustes')),
        firstValueFrom(this.http.get<CampanaAdmin>('/api/admin/campana')),
      ]);
      this.ajustes.set(ajustes);
      this.campana.set(campana);
      this.montosTexto = campana.montosSugeridos.join(', ');
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected alternarForma(c: CampanaAdmin, forma: FormaPago, activa: boolean) {
    c.formasPagoActivas = activa ? [...c.formasPagoActivas, forma] : c.formasPagoActivas.filter((f) => f !== forma);
  }

  protected async crearAjuste() {
    this.camposAjuste.set({});
    this.guardandoAjuste.set(true);
    try {
      const a = await firstValueFrom(
        this.http.post<AjusteAdmin>('/api/admin/ajustes', { montoUsd: Number(this.ajusteMonto), motivo: this.ajusteMotivo.trim() }),
      );
      this.ajustes.update((lista) => [a, ...lista]);
      this.ajusteMonto = null;
      this.ajusteMotivo = '';
      this.avisos.exito(`Ajuste de ${a.montoUsd > 0 ? '+' : '−'}${usd(Math.abs(a.montoUsd))} cargado.`);
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.camposAjuste.set(campos);
      if (!Object.keys(campos).length) this.avisos.error(mensaje);
    } finally {
      this.guardandoAjuste.set(false);
    }
  }

  protected async guardarCampana() {
    const c = this.campana();
    if (!c) return;
    const montos = this.montosTexto
      .split(',')
      .map((m) => Number(m.trim()))
      .filter((m) => Number.isInteger(m) && m > 0);
    this.camposCampana.set({});
    this.guardandoCampana.set(true);
    try {
      const guardada = await firstValueFrom(
        this.http.patch<CampanaAdmin>('/api/admin/campana', {
          metaUsd: Number(c.metaUsd),
          montoMaximoUsd: Number(c.montoMaximoUsd),
          montosSugeridos: montos,
          formasPagoActivas: c.formasPagoActivas,
          diasVencimiento: Number(c.diasVencimiento),
          mostrarMontos: c.mostrarMontos,
          mensajeMetaCumplida: c.mensajeMetaCumplida ?? '',
        }),
      );
      this.campana.set(guardada);
      this.montosTexto = guardada.montosSugeridos.join(', ');
      this.avisos.exito('Configuración guardada.');
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.camposCampana.set(campos);
      if (!Object.keys(campos).length) this.avisos.error(mensaje);
    } finally {
      this.guardandoCampana.set(false);
    }
  }
}
