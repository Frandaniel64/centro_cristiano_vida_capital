import { HttpClient } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import type { Configuracion2fa, PasoIngreso } from '@ccvida/shared';
import { firstValueFrom } from 'rxjs';
import { errorDe } from '../api';
import { SesionService } from '../sesion';

type Paso = 'credenciales' | 'codigo' | 'configurar-2fa';

@Component({
  selector: 'app-ingreso',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule],
  styleUrl: './ingreso.css',
  template: `
    <main class="contenedor">
      <div class="tarjeta pila caja">
        <div class="marca">
          <img src="logo.png" alt="" width="48" height="48" />
          <div>
            <h1>Panel CCVida</h1>
            <p class="suave">Centro Cristiano Vida Capital</p>
          </div>
        </div>

        @if (error()) {
          <p class="aviso-error" role="alert">{{ error() }}</p>
        }

        @switch (paso()) {
          @case ('credenciales') {
            <form class="pila" (ngSubmit)="ingresar()">
              <mat-form-field>
                <mat-label>Email</mat-label>
                <input matInput name="email" type="email" autocomplete="username" [(ngModel)]="email" required />
              </mat-form-field>
              <mat-form-field>
                <mat-label>Contraseña</mat-label>
                <input matInput name="clave" [type]="verClave() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="clave" required />
                <button matIconButton matSuffix type="button" (click)="verClave.set(!verClave())" [attr.aria-label]="verClave() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <mat-icon [svgIcon]="verClave() ? 'visibility_off' : 'visibility'" />
                </button>
              </mat-form-field>
              <button matButton="filled" type="submit" [disabled]="cargando()">{{ cargando() ? 'Ingresando…' : 'Ingresar' }}</button>
            </form>
          }
          @case ('codigo') {
            <form class="pila" (ngSubmit)="enviarCodigo('/api/auth/codigo')">
              <p class="ayuda">Abrí la app de autenticación de tu celular y escribí los 6 números que muestra para CCVida Capital.</p>
              <mat-form-field>
                <mat-label>Código de verificación</mat-label>
                <input matInput name="codigo" class="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" [(ngModel)]="codigo" required />
              </mat-form-field>
              <button matButton="filled" type="submit" [disabled]="cargando()">{{ cargando() ? 'Verificando…' : 'Verificar' }}</button>
              <button matButton type="button" (click)="volver()">Volver</button>
            </form>
          }
          @case ('configurar-2fa') {
            <form class="pila" (ngSubmit)="enviarCodigo('/api/auth/2fa/activar')">
              <h2>Activá la verificación en dos pasos</h2>
              <p class="ayuda">Tu rol maneja datos sensibles, así que además de la contraseña vas a usar un código del celular.</p>
              <ol class="pasos">
                <li>Instalá <strong>Google Authenticator</strong> o <strong>Microsoft Authenticator</strong> en tu celular.</li>
                <li>En la app, tocá <strong>Agregar</strong> y escaneá este código.</li>
                <li>Escribí abajo los 6 números que aparecen.</li>
              </ol>
              @if (config2fa(); as c) {
                <img class="qr" [src]="c.qr" alt="Código QR para la app de autenticación" width="200" height="200" />
                <p class="ayuda">¿No podés escanear? Cargá esta clave a mano: <code>{{ c.secreto }}</code></p>
              }
              <mat-form-field>
                <mat-label>Código de 6 números</mat-label>
                <input matInput name="codigo" class="codigo" inputmode="numeric" autocomplete="one-time-code" maxlength="6" [(ngModel)]="codigo" required />
              </mat-form-field>
              <button matButton="filled" type="submit" [disabled]="cargando()">{{ cargando() ? 'Activando…' : 'Activar y entrar' }}</button>
            </form>
          }
        }
      </div>
    </main>
  `,
})
export class Ingreso {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly sesion = inject(SesionService);

  protected readonly paso = signal<Paso>('credenciales');
  protected readonly cargando = signal(false);
  protected readonly error = signal('');
  protected readonly verClave = signal(false);
  protected readonly config2fa = signal<Configuracion2fa | null>(null);
  protected email = '';
  protected clave = '';
  protected codigo = '';

  protected async ingresar() {
    if (!this.email || !this.clave) {
      this.error.set('Escribí tu email y tu contraseña.');
      return;
    }
    await this.pedir('/api/auth/ingresar', { email: this.email.trim(), clave: this.clave });
  }

  protected async enviarCodigo(ruta: string) {
    const codigo = this.codigo.replace(/\s/g, '');
    if (!/^\d{6}$/.test(codigo)) {
      this.error.set('El código tiene 6 números.');
      return;
    }
    await this.pedir(ruta, { codigo });
  }

  protected volver() {
    this.paso.set('credenciales');
    this.codigo = '';
    this.error.set('');
  }

  private async pedir(ruta: string, cuerpo: object) {
    this.cargando.set(true);
    this.error.set('');
    try {
      const r = await firstValueFrom(this.http.post<PasoIngreso>(ruta, cuerpo));
      this.codigo = '';
      if (r.paso === 'listo') {
        this.sesion.usuario.set(r.usuario);
        await this.router.navigateByUrl(r.usuario.debeCambiarClave ? '/cambiar-clave' : '/');
        return;
      }
      if (r.paso === 'configurar-2fa') {
        this.config2fa.set(await firstValueFrom(this.http.post<Configuracion2fa>('/api/auth/2fa/iniciar', {})));
      }
      this.paso.set(r.paso);
    } catch (e) {
      this.error.set(errorDe(e).mensaje);
      this.codigo = '';
    } finally {
      this.cargando.set(false);
    }
  }
}
