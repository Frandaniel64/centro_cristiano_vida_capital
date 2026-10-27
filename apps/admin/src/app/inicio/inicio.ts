import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import type { ResumenPanel } from '@ccvida/shared';
import { catchError, of } from 'rxjs';
import { usd } from '../formato';
import { SesionService } from '../sesion';

@Component({
  selector: 'app-inicio',
  imports: [RouterLink, MatProgressBarModule],
  styles: `
    .grilla { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .dato { font-size: 32px; font-weight: 800; margin: 4px 0 0; }
    .tarjeta a { font-weight: 700; }
    .alerta { border-color: #e0a800; background: #fffbe8; }
    .meta { font-size: 16px; font-weight: 600; }
  `,
  template: `
    <div class="pila">
      <h1>Hola, {{ nombre() }}</h1>

      @if (resumen(); as r) {
        @if (r.proTemplo; as pt) {
          <section class="pila" aria-labelledby="titulo-pt">
            <h2 id="titulo-pt">Pro Templo</h2>
            <div class="tarjeta pila">
              <div class="fila" style="justify-content: space-between">
                <p class="dato numero">{{ usd(pt.recaudadoUsd) }} <span class="suave meta">de {{ usd(pt.metaUsd) }}</span></p>
                <strong class="numero">{{ pt.porcentaje }}%</strong>
              </div>
              <mat-progress-bar mode="determinate" [value]="pt.porcentaje" aria-label="Avance de la meta" />
              <p class="suave" style="margin: 0">{{ pt.ladrillos }} de 100 ladrillos · {{ pt.personas }} {{ pt.personas === 1 ? 'persona dio' : 'personas dieron' }}</p>
            </div>
            <div class="grilla">
              <div class="tarjeta" [class.alerta]="pt.pendientes > 0">
                <span class="suave">Vouchers pendientes de pago</span>
                <p class="dato numero">{{ pt.pendientes }}</p>
                <a routerLink="/vouchers" [queryParams]="{ estado: 'pendiente' }">Ver pendientes</a>
              </div>
              <div class="tarjeta" [class.alerta]="pt.apodosPorRevisar > 0">
                <span class="suave">Apodos por revisar</span>
                <p class="dato numero">{{ pt.apodosPorRevisar }}</p>
                <a routerLink="/vouchers" [queryParams]="{ estado: 'apodos' }">Revisar apodos</a>
              </div>
            </div>
          </section>
        }

        @if (r.visitas; as v) {
          <section class="pila" aria-labelledby="titulo-visitas">
            <h2 id="titulo-visitas">Primeras visitas</h2>
            <div class="grilla">
              <div class="tarjeta" [class.alerta]="v.nuevas > 0">
                <span class="suave">Sin contactar</span>
                <p class="dato numero">{{ v.nuevas }}</p>
                <a routerLink="/visitas" [queryParams]="{ estado: 'nueva' }">Ver visitas nuevas</a>
              </div>
              <div class="tarjeta">
                <span class="suave">Pedidos en los últimos 7 días</span>
                <p class="dato numero">{{ v.ultimaSemana }}</p>
              </div>
            </div>
          </section>
        }

        @if (!r.proTemplo && !r.visitas) {
          <div class="tarjeta">
            <p style="margin: 0">Las secciones de contenido (eventos, prédicas, ministerios y textos del sitio) llegan en la próxima etapa del panel.</p>
          </div>
        }
      } @else if (fallo()) {
        <p class="aviso-error" role="alert">No pudimos cargar el resumen. Recargá la página.</p>
      } @else {
        <p class="suave">Cargando…</p>
      }
    </div>
  `,
})
export class Inicio {
  private readonly http = inject(HttpClient);
  private readonly sesion = inject(SesionService);
  protected readonly usd = usd;
  protected readonly nombre = () => this.sesion.usuario()?.nombre.split(' ')[0] ?? '';

  protected readonly fallo = signal(false);
  protected readonly resumen = toSignal(
    this.http.get<ResumenPanel>('/api/admin/resumen').pipe(
      catchError(() => {
        this.fallo.set(true);
        return of(null);
      }),
    ),
  );
}
