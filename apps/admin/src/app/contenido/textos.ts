import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import type { TextosSitio } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';

@Component({
  selector: 'app-textos',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  styles: `
    .dos { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0 16px; }
    .renglon { display: grid; grid-template-columns: 6rem minmax(0, 1fr) minmax(0, 2fr) auto; gap: 8px; align-items: start; }
    .renglon.sin-hora { grid-template-columns: minmax(0, 1fr) minmax(0, 2fr) auto; }
    .pregunta { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; align-items: start; border-bottom: 1px solid var(--linea); padding-bottom: 8px; }
    @media (max-width: 700px) { .renglon, .renglon.sin-hora { grid-template-columns: minmax(0, 1fr) auto; } }
    .barra { position: sticky; bottom: 0; background: var(--fondo); padding: 12px 0; border-top: 1px solid var(--linea); }
  `,
  template: `
    <div class="encabezado"><h1>Textos del sitio</h1></div>
    @if (t(); as t) {
      <form class="pila" (ngSubmit)="guardar()">
        <section class="tarjeta pila" aria-labelledby="t-inicio">
          <h2 id="t-inicio">Inicio y reunión</h2>
          <mat-form-field>
            <mat-label>Lema (título grande del inicio)</mat-label>
            <input matInput name="lema" maxlength="80" [(ngModel)]="t.lema" />
          </mat-form-field>
          <mat-form-field>
            <mat-label>Bajada del inicio</mat-label>
            <textarea matInput name="bajada" rows="2" maxlength="400" [(ngModel)]="t.bajadaInicio"></textarea>
          </mat-form-field>
          <div class="dos">
            <mat-form-field><mat-label>Día y hora de la reunión</mat-label><input matInput name="reunion" maxlength="60" [(ngModel)]="t.reunion" placeholder="Domingos 10 h" /></mat-form-field>
            <mat-form-field><mat-label>Dirección</mat-label><input matInput name="direccion" maxlength="120" [(ngModel)]="t.direccion" /></mat-form-field>
            <mat-form-field><mat-label>Barrio o ciudad</mat-label><input matInput name="barrio" maxlength="60" [(ngModel)]="t.barrio" /></mat-form-field>
            <mat-form-field><mat-label>Colectivos</mat-label><input matInput name="colectivos" maxlength="120" [(ngModel)]="t.colectivos" /></mat-form-field>
          </div>
        </section>

        <section class="tarjeta pila" aria-labelledby="t-domingo">
          <h2 id="t-domingo">Un domingo en CCVida</h2>
          @for (a of t.agendaDomingo; track $index; let i = $index) {
            <div class="renglon">
              <mat-form-field><mat-label>Hora</mat-label><input matInput [name]="'ah' + i" maxlength="10" [(ngModel)]="a.hora" /></mat-form-field>
              <mat-form-field><mat-label>Qué pasa</mat-label><input matInput [name]="'at' + i" maxlength="80" [(ngModel)]="a.titulo" /></mat-form-field>
              <mat-form-field><mat-label>Detalle</mat-label><input matInput [name]="'ax' + i" maxlength="400" [(ngModel)]="a.texto" /></mat-form-field>
              <button matIconButton type="button" (click)="quitar(t.agendaDomingo, i)" aria-label="Quitar este momento"><mat-icon svgIcon="delete" /></button>
            </div>
          }
          <button matButton type="button" (click)="t.agendaDomingo.push({ hora: '', titulo: '', texto: '' })" style="align-self: flex-start"><mat-icon svgIcon="add" />Agregar momento</button>
        </section>

        <section class="tarjeta pila" aria-labelledby="t-llegar">
          <h2 id="t-llegar">Cómo llegar</h2>
          @for (c of t.comoLlegar; track $index; let i = $index) {
            <div class="renglon sin-hora">
              <mat-form-field><mat-label>Título</mat-label><input matInput [name]="'ct' + i" maxlength="80" [(ngModel)]="c.titulo" placeholder="Ej.: Colectivos" /></mat-form-field>
              <mat-form-field><mat-label>Detalle</mat-label><input matInput [name]="'cx' + i" maxlength="400" [(ngModel)]="c.texto" /></mat-form-field>
              <button matIconButton type="button" (click)="quitar(t.comoLlegar, i)" aria-label="Quitar"><mat-icon svgIcon="delete" /></button>
            </div>
          }
          <button matButton type="button" (click)="t.comoLlegar.push({ titulo: '', texto: '' })" style="align-self: flex-start"><mat-icon svgIcon="add" />Agregar</button>
        </section>

        <section class="tarjeta pila" aria-labelledby="t-faqv">
          <h2 id="t-faqv">Preguntas de primera vez</h2>
          @for (p of t.faqVisita; track $index; let i = $index) {
            <div class="pregunta">
              <div class="pila" style="gap: 0">
                <mat-form-field><mat-label>Pregunta</mat-label><input matInput [name]="'vp' + i" maxlength="200" [(ngModel)]="p.pregunta" /></mat-form-field>
                <mat-form-field><mat-label>Respuesta</mat-label><textarea matInput [name]="'vr' + i" rows="2" maxlength="1000" [(ngModel)]="p.respuesta"></textarea></mat-form-field>
              </div>
              <button matIconButton type="button" (click)="quitar(t.faqVisita, i)" aria-label="Quitar esta pregunta"><mat-icon svgIcon="delete" /></button>
            </div>
          }
          <button matButton type="button" (click)="t.faqVisita.push({ pregunta: '', respuesta: '' })" style="align-self: flex-start"><mat-icon svgIcon="add" />Agregar pregunta</button>
        </section>

        <section class="tarjeta pila" aria-labelledby="t-faqp">
          <h2 id="t-faqp">Preguntas de Pro Templo</h2>
          @for (p of t.faqProTemplo; track $index; let i = $index) {
            <div class="pregunta">
              <div class="pila" style="gap: 0">
                <mat-form-field><mat-label>Pregunta</mat-label><input matInput [name]="'pp' + i" maxlength="200" [(ngModel)]="p.pregunta" /></mat-form-field>
                <mat-form-field><mat-label>Respuesta</mat-label><textarea matInput [name]="'pr' + i" rows="2" maxlength="1000" [(ngModel)]="p.respuesta"></textarea></mat-form-field>
              </div>
              <button matIconButton type="button" (click)="quitar(t.faqProTemplo, i)" aria-label="Quitar esta pregunta"><mat-icon svgIcon="delete" /></button>
            </div>
          }
          <button matButton type="button" (click)="t.faqProTemplo.push({ pregunta: '', respuesta: '' })" style="align-self: flex-start"><mat-icon svgIcon="add" />Agregar pregunta</button>
        </section>

        <section class="tarjeta pila" aria-labelledby="t-nosotros">
          <h2 id="t-nosotros">Nosotros</h2>
          <mat-form-field><mat-label>Datos de la iglesia</mat-label><input matInput name="datos" maxlength="200" [(ngModel)]="t.datosIglesia" placeholder="Más de 150 personas · Desde 2016 · Floresta, CABA" /></mat-form-field>
          <mat-form-field>
            <mat-label>Nuestra historia</mat-label>
            <textarea matInput name="historia" rows="6" maxlength="4000" [(ngModel)]="t.historia"></textarea>
            <mat-hint>Dejá una línea en blanco entre párrafos.</mat-hint>
          </mat-form-field>
          <mat-form-field><mat-label>Pastores</mat-label><input matInput name="pnombres" maxlength="120" [(ngModel)]="t.pastores.nombres" /></mat-form-field>
          <mat-form-field><mat-label>Sobre los pastores</mat-label><textarea matInput name="ptexto" rows="4" maxlength="1500" [(ngModel)]="t.pastores.texto"></textarea></mat-form-field>
          <mat-form-field><mat-label>Frase de los pastores</mat-label><input matInput name="pcita" maxlength="300" [(ngModel)]="t.pastores.cita" /></mat-form-field>
          <h3 style="font-size: 15px">Lo que creemos</h3>
          @for (c of t.creemos; track $index; let i = $index) {
            <div class="renglon sin-hora">
              <mat-form-field><mat-label>Título</mat-label><input matInput [name]="'kt' + i" maxlength="80" [(ngModel)]="c.titulo" /></mat-form-field>
              <mat-form-field><mat-label>Texto</mat-label><input matInput [name]="'kx' + i" maxlength="400" [(ngModel)]="c.texto" /></mat-form-field>
              <button matIconButton type="button" (click)="quitar(t.creemos, i)" aria-label="Quitar"><mat-icon svgIcon="delete" /></button>
            </div>
          }
          <button matButton type="button" (click)="t.creemos.push({ titulo: '', texto: '' })" style="align-self: flex-start"><mat-icon svgIcon="add" />Agregar</button>
        </section>

        <section class="tarjeta pila" aria-labelledby="t-contacto">
          <h2 id="t-contacto">Contacto y redes</h2>
          <div class="dos">
            <mat-form-field><mat-label>WhatsApp</mat-label><input matInput name="whatsapp" maxlength="40" [(ngModel)]="t.whatsapp" placeholder="11 5555 1234" /></mat-form-field>
            <mat-form-field><mat-label>Instagram</mat-label><input matInput name="instagram" maxlength="300" [(ngModel)]="t.instagram" placeholder="https://www.instagram.com/…" /></mat-form-field>
            <mat-form-field><mat-label>YouTube (canal)</mat-label><input matInput name="youtube" maxlength="300" [(ngModel)]="t.youtube" placeholder="https://www.youtube.com/@…" /></mat-form-field>
            <mat-form-field><mat-label>Facebook</mat-label><input matInput name="facebook" maxlength="300" [(ngModel)]="t.facebook" placeholder="https://www.facebook.com/…" /></mat-form-field>
          </div>
          @for (c of ['whatsapp', 'instagram', 'youtube', 'facebook']; track c) {
            @if (campos()[c]) { <p class="error">{{ campos()[c] }}</p> }
          }
          <mat-form-field>
            <mat-label>Datos para transferir (Pro Templo)</mat-label>
            <textarea matInput name="transferencia" rows="4" maxlength="1000" [(ngModel)]="t.datosTransferencia" placeholder="Banco, titular, CBU o alias, cuenta en dólares…"></textarea>
            <mat-hint>Se muestran a quien pide un voucher para pagar por transferencia.</mat-hint>
          </mat-form-field>
        </section>

        <div class="barra fila derecha">
          <button matButton="filled" type="submit" [disabled]="guardando()">Guardar textos</button>
        </div>
      </form>
    } @else {
      <p class="suave">Cargando…</p>
    }
  `,
})
export class Textos {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  protected readonly t = signal<TextosSitio | null>(null);
  protected readonly guardando = signal(false);
  protected readonly campos = signal<Record<string, string>>({});

  constructor() {
    firstValueFrom(this.http.get<TextosSitio>('/api/admin/textos'))
      .then((t) => this.t.set(t))
      .catch((e) => this.avisos.error(errorDe(e).mensaje));
  }

  protected quitar<T>(lista: T[], i: number) {
    lista.splice(i, 1);
  }

  protected async guardar() {
    const t = this.t();
    if (!t) return;
    this.guardando.set(true);
    this.campos.set({});
    try {
      this.t.set(await firstValueFrom(this.http.put<TextosSitio>('/api/admin/textos', t)));
      this.avisos.exito('Textos guardados.');
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.campos.set(campos);
      this.avisos.error(Object.keys(campos).length ? 'Revisá los campos marcados.' : mensaje);
    } finally {
      this.guardando.set(false);
    }
  }
}
