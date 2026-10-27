import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import type { UsuarioPanel } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { SesionService } from '../sesion';

@Component({
  selector: 'app-cambiar-clave',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  styleUrl: './ingreso.css',
  template: `
    <main class="contenedor">
      <form class="tarjeta pila caja" (ngSubmit)="guardar()">
        <h1>Elegí tu contraseña</h1>
        <p class="ayuda">
          @if (sesion.usuario()?.debeCambiarClave) {
            Entraste con una contraseña temporal. Elegí una propia para seguir.
          } @else {
            Cambiá tu contraseña.
          }
          Usá al menos 10 caracteres; una frase corta es más fácil de recordar.
        </p>
        @if (error()) {
          <p class="aviso-error" role="alert">{{ error() }}</p>
        }
        <mat-form-field>
          <mat-label>Contraseña actual</mat-label>
          <input matInput name="actual" type="password" autocomplete="current-password" [(ngModel)]="actual" />
        </mat-form-field>
        @if (campos()['actual']) { <p class="error">{{ campos()['actual'] }}</p> }
        <mat-form-field>
          <mat-label>Contraseña nueva</mat-label>
          <input matInput name="nueva" type="password" autocomplete="new-password" [(ngModel)]="nueva" />
          <mat-hint>Al menos 10 caracteres</mat-hint>
        </mat-form-field>
        @if (campos()['nueva']) { <p class="error">{{ campos()['nueva'] }}</p> }
        <mat-form-field>
          <mat-label>Repetila</mat-label>
          <input matInput name="repetir" type="password" autocomplete="new-password" [(ngModel)]="repetir" />
        </mat-form-field>
        <button matButton="filled" type="submit" [disabled]="cargando()">{{ cargando() ? 'Guardando…' : 'Guardar contraseña' }}</button>
      </form>
    </main>
  `,
})
export class CambiarClave {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  protected readonly sesion = inject(SesionService);

  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly campos = signal<Record<string, string>>({});
  protected actual = '';
  protected nueva = '';
  protected repetir = '';

  protected async guardar() {
    this.error.set('');
    this.campos.set({});
    if (this.nueva.length < 10) {
      this.campos.set({ nueva: 'Usá al menos 10 caracteres.' });
      return;
    }
    if (this.nueva !== this.repetir) {
      this.error.set('Las dos contraseñas nuevas no coinciden.');
      return;
    }
    this.cargando.set(true);
    try {
      const usuario = await firstValueFrom(this.http.post<UsuarioPanel>('/api/auth/clave', { actual: this.actual, nueva: this.nueva }));
      this.sesion.usuario.set(usuario);
      await this.router.navigateByUrl('/');
    } catch (e) {
      const { mensaje, campos } = errorDe(e);
      this.campos.set(campos);
      if (!Object.keys(campos).length) this.error.set(mensaje);
    } finally {
      this.cargando.set(false);
    }
  }
}
