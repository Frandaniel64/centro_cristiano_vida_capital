// Escribe un HTML de ejemplo por plantilla en apps/api/emails-muestra/ para mirarlos en el navegador.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  avisoRecepcion,
  avisoTesoreria,
  bienvenidaVisita,
  ladrilloConfirmado,
  voucherRegistrado,
} from '../src/comun/emails/plantillas.js';

const sitioUrl = process.env.SITE_URL ?? 'http://localhost:4321';
const panelUrl = process.env.PANEL_URL ?? 'http://localhost:4200';

const muestras = {
  'bienvenida-visita': bienvenidaVisita({
    nombre: 'Lucía Pérez',
    reunion: 'Domingo 10 h',
    direccion: 'Camarones 2201',
    barrio: 'Floresta',
    mapaUrl: '',
    versiculo: {
      texto: 'Vengan a mí todos ustedes que están cansados y agobiados, y yo les daré descanso.',
      cita: 'Mateo 11:28',
    },
    sitioUrl,
  }),
  'voucher-registrado': voucherRegistrado({
    nombre: 'Lucía Pérez',
    numero: 348,
    montoUsd: 150,
    formaPago: 'transferencia',
    datosTransferencia: 'Banco Ejemplo\nCBU 0000000000000000000000\nAlias CCVIDA.PROTEMPLO',
    sitioUrl,
  }),
  'aviso-tesoreria': avisoTesoreria({
    nombre: 'Lucía Pérez',
    numero: 348,
    montoUsd: 150,
    formaPago: 'transferencia',
    email: 'lucia@ejemplo.com',
    whatsapp: '1155551234',
    panelUrl,
  }),
  'aviso-recepcion': avisoRecepcion({
    nombre: 'Lucía Pérez',
    email: 'lucia@ejemplo.com',
    whatsapp: null,
    intereses: ['Vida Kids', 'Jóvenes'],
    panelUrl,
  }),
  'ladrillo-confirmado': ladrilloConfirmado({ nombre: 'Lucía Pérez', numero: 348, sitioUrl }),
};

const carpeta = join(dirname(fileURLToPath(import.meta.url)), '..', 'emails-muestra');
mkdirSync(carpeta, { recursive: true });
for (const [nombre, { asunto, html }] of Object.entries(muestras)) {
  writeFileSync(join(carpeta, `${nombre}.html`), html);
  console.log(`${nombre}.html  ·  ${asunto}`);
}
