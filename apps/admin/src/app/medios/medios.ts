import { Component } from '@angular/core';
import { Galeria } from './galeria';

@Component({
  selector: 'app-medios',
  imports: [Galeria],
  template: `
    <div class="encabezado"><h1>Fotos</h1></div>
    <p class="ayuda" style="margin-bottom: 16px">
      Las fotos se achican y se convierten solas para que la web cargue rápido. También se les borran los datos de la cámara, como la ubicación.
    </p>
    <app-galeria modo="gestionar" />
  `,
})
export class Medios {}
