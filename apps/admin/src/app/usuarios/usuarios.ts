import { HttpClient } from '@angular/common/http';
import { Component, TemplateRef, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import type { ClaveTemporal, Rol, UsuarioAdmin } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { Avisos } from '../avisos';
import { ROLES, fecha } from '../formato';
import { SesionService } from '../sesion';

const QUE_PUEDE: Record<Rol, string> = {
  administrador: 'Todo, incluido crear usuarios. Usa verificación en dos pasos.',
  editor: 'Publicaciones, eventos, prédicas, ministerios, textos y fotos. No ve vouchers ni visitas.',
  tesoreria: 'Ver y confirmar vouchers, ajustes y la campaña. Usa verificación en dos pasos.',
  recepcion: 'Ver las primeras visitas, marcarlas y dejar notas.',
};

@Component({
  selector: 'app-usuarios',
  imports: [FormsModule, MatTableModule, MatProgressBarModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  styles: `
    .acciones { display: flex; flex-wrap: wrap; gap: 4px; padding: 6px 0; }
    .rol { width: 11rem; padding-top: 8px; }
    .clave { font-family: ui-monospace, monospace; font-size: 24px; font-weight: 700; letter-spacing: 0.05em; padding: 12px 16px; background: var(--fondo); border-radius: 10px; text-align: center; user-select: all; }
  `,
  template: `
    <div class="encabezado">
      <h1>Usuarios</h1>
      <button matButton="filled" type="button" (click)="abrirNuevo()"><mat-icon svgIcon="person_add" />Agregar persona</button>
    </div>

    <div class="tabla-caja">
      @if (cargando()) { <mat-progress-bar mode="indeterminate" aria-label="Cargando usuarios" /> }
      <table mat-table [dataSource]="usuarios()" style="min-width: 50rem">
        <ng-container matColumnDef="nombre">
          <th mat-header-cell *matHeaderCellDef>Nombre</th>
          <td mat-cell *matCellDef="let u"><strong>{{ u.nombre }}</strong><br /><span class="suave">{{ u.email }}</span></td>
        </ng-container>
        <ng-container matColumnDef="rol">
          <th mat-header-cell *matHeaderCellDef>Rol</th>
          <td mat-cell *matCellDef="let u">
            <mat-form-field class="rol">
              <mat-select [value]="u.rol" (selectionChange)="editar(u, { rol: $event.value })" [disabled]="esYo(u)" [attr.aria-label]="'Rol de ' + u.nombre">
                @for (r of roles; track r.valor) { <mat-option [value]="r.valor">{{ r.texto }}</mat-option> }
              </mat-select>
            </mat-form-field>
          </td>
        </ng-container>
        <ng-container matColumnDef="totp">
          <th mat-header-cell *matHeaderCellDef>2FA</th>
          <td mat-cell *matCellDef="let u">
            @if (u.totpActivo) { <span class="etiqueta success">Activo</span> } @else { <span class="etiqueta secondary">Sin configurar</span> }
          </td>
        </ng-container>
        <ng-container matColumnDef="ingreso">
          <th mat-header-cell *matHeaderCellDef>Último ingreso</th>
          <td mat-cell *matCellDef="let u">{{ u.ultimoIngreso ? fecha(u.ultimoIngreso) : 'Nunca' }}</td>
        </ng-container>
        <ng-container matColumnDef="estado">
          <th mat-header-cell *matHeaderCellDef>Estado</th>
          <td mat-cell *matCellDef="let u">
            @if (u.activo) { <span class="etiqueta success">Activa</span> } @else { <span class="etiqueta danger">Dada de baja</span> }
            @if (u.debeCambiarClave) { <div class="ayuda">Con clave temporal</div> }
          </td>
        </ng-container>
        <ng-container matColumnDef="acciones">
          <th mat-header-cell *matHeaderCellDef>Acciones</th>
          <td mat-cell *matCellDef="let u">
            <div class="acciones">
              <button matButton="outlined" type="button" (click)="reiniciarClave(u)">Nueva clave</button>
              @if (u.totpActivo) {
                <button matButton="outlined" type="button" (click)="reiniciar2fa(u)">Reiniciar 2FA</button>
              }
              @if (!esYo(u)) {
                @if (u.activo) {
                  <button matButton type="button" class="peligro" (click)="editar(u, { activo: false })">Dar de baja</button>
                } @else {
                  <button matButton type="button" (click)="editar(u, { activo: true })">Reactivar</button>
                }
              }
            </div>
          </td>
        </ng-container>
        <tr mat-header-row *matHeaderRowDef="columnas"></tr>
        <tr mat-row *matRowDef="let fila; columns: columnas"></tr>
      </table>
    </div>

    <ng-template #dialogoNuevo>
      <h2 mat-dialog-title>Agregar persona</h2>
      <form (ngSubmit)="crear()">
        <mat-dialog-content>
          <div class="pila">
            <mat-form-field>
              <mat-label>Nombre y apellido</mat-label>
              <input matInput name="nombre" autocomplete="off" [(ngModel)]="nuevo.nombre" />
            </mat-form-field>
            @if (campos()['nombre']) { <p class="error">{{ campos()['nombre'] }}</p> }
            <mat-form-field>
              <mat-label>Email</mat-label>
              <input matInput name="email" type="email" autocomplete="off" [(ngModel)]="nuevo.email" />
            </mat-form-field>
            @if (campos()['email']) { <p class="error">{{ campos()['email'] }}</p> }
            <mat-form-field>
              <mat-label>Rol</mat-label>
              <mat-select name="rol" [(ngModel)]="nuevo.rol">
                @for (r of roles; track r.valor) { <mat-option [value]="r.valor">{{ r.texto }}</mat-option> }
              </mat-select>
              <mat-hint>{{ quePuede(nuevo.rol) }}</mat-hint>
            </mat-form-field>
          </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
          <button matButton type="button" mat-dialog-close>Cancelar</button>
          <button matButton="filled" type="submit" [disabled]="guardando()">Crear</button>
        </mat-dialog-actions>
      </form>
    </ng-template>

    <ng-template #dialogoClave let-c>
      <h2 mat-dialog-title>Clave temporal</h2>
      <mat-dialog-content>
        <div class="pila">
          <p style="margin: 0">Pasale esta clave a <strong>{{ c.usuario.nombre }}</strong> por un canal privado. Se muestra <strong>una sola vez</strong>.</p>
          <div class="clave">{{ c.claveTemporal }}</div>
          <p class="ayuda">
            Al entrar al panel con {{ c.usuario.email }} va a tener que elegir su propia contraseña@if (c.usuario.rol === 'administrador' || c.usuario.rol === 'tesoreria') { y configurar la verificación en dos pasos}.
          </p>
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end"><button matButton="filled" type="button" mat-dialog-close>Ya la copié</button></mat-dialog-actions>
    </ng-template>
  `,
})
export class Usuarios {
  private readonly http = inject(HttpClient);
  private readonly avisos = inject(Avisos);
  private readonly sesion = inject(SesionService);
  private readonly dialogo = inject(MatDialog);
  private readonly plantillaNuevo = viewChild.required<TemplateRef<unknown>>('dialogoNuevo');
  private readonly plantillaClave = viewChild.required<TemplateRef<unknown>>('dialogoClave');
  private abierto: MatDialogRef<unknown> | null = null;

  protected readonly columnas = ['nombre', 'rol', 'totp', 'ingreso', 'estado', 'acciones'];
  protected readonly fecha = fecha;
  protected readonly roles = (Object.keys(ROLES) as Rol[]).map((valor) => ({ valor, texto: ROLES[valor] }));
  protected readonly quePuede = (rol: Rol) => QUE_PUEDE[rol];
  protected readonly esYo = (u: UsuarioAdmin) => u.id === this.sesion.usuario()?.id;

  protected readonly usuarios = signal<UsuarioAdmin[]>([]);
  protected readonly cargando = signal(true);
  protected readonly guardando = signal(false);
  protected readonly campos = signal<Record<string, string>>({});
  protected nuevo: { nombre: string; email: string; rol: Rol } = { nombre: '', email: '', rol: 'editor' };

  constructor() {
    void this.cargar();
  }

  private async cargar() {
    try {
      this.usuarios.set(await firstValueFrom(this.http.get<UsuarioAdmin[]>('/api/admin/usuarios')));
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    } finally {
      this.cargando.set(false);
    }
  }

  protected abrirNuevo() {
    this.nuevo = { nombre: '', email: '', rol: 'editor' };
    this.campos.set({});
    this.abierto = this.dialogo.open(this.plantillaNuevo(), { width: '30rem', maxWidth: '95vw' });
  }

  protected async crear() {
    this.guardando.set(true);
    this.campos.set({});
    try {
      const r = await firstValueFrom(this.http.post<ClaveTemporal>('/api/admin/usuarios', { ...this.nuevo, nombre: this.nuevo.nombre.trim() }));
      this.usuarios.update((lista) => [...lista, r.usuario]);
      this.abierto?.close();
      this.mostrarClave(r);
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.campos.set(campos);
      if (!Object.keys(campos).length) this.avisos.error(mensaje);
    } finally {
      this.guardando.set(false);
    }
  }

  protected async editar(u: UsuarioAdmin, cambios: Partial<Pick<UsuarioAdmin, 'rol' | 'activo'>>) {
    try {
      this.reemplazar(await firstValueFrom(this.http.patch<UsuarioAdmin>(`/api/admin/usuarios/${u.id}`, cambios)));
      this.avisos.exito(cambios.activo === false ? `${u.nombre} ya no puede entrar al panel.` : `${u.nombre} actualizado. Si tenía el panel abierto, va a tener que volver a entrar.`);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
      await this.cargar();
    }
  }

  protected async reiniciarClave(u: UsuarioAdmin) {
    try {
      const r = await firstValueFrom(this.http.post<ClaveTemporal>(`/api/admin/usuarios/${u.id}/clave`, {}));
      this.reemplazar(r.usuario);
      this.mostrarClave(r);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  protected async reiniciar2fa(u: UsuarioAdmin) {
    try {
      this.reemplazar(await firstValueFrom(this.http.post<UsuarioAdmin>(`/api/admin/usuarios/${u.id}/2fa/reiniciar`, {})));
      this.avisos.exito(`${u.nombre} va a configurar la verificación en dos pasos de nuevo al entrar.`);
    } catch (e) {
      this.avisos.error(errorDe(e).mensaje);
    }
  }

  private mostrarClave(c: ClaveTemporal) {
    // Se cierra solo con el botón: la clave no se vuelve a mostrar.
    this.dialogo.open(this.plantillaClave(), { data: c, width: '28rem', maxWidth: '95vw', disableClose: true });
  }

  private reemplazar(u: UsuarioAdmin) {
    this.usuarios.update((lista) => lista.map((x) => (x.id === u.id ? u : x)));
  }
}
