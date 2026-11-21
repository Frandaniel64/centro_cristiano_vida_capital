import type { FormaPago } from '@ccvida/shared';
import { escapar } from '../email.service.js';
import { instruccionesDePago, numeroVoucher } from '../../pro-templo/reglas.js';
import { bloque, boton, marco, parrafo, titulo, versiculo } from './marco.js';

type Email = { asunto: string; html: string };

const DIRECCION_POR_DEFECTO = 'Camarones 2201';
const piePersona = (direccion?: string) => `Centro Cristiano Vida Capital &middot; ${escapar(direccion?.trim() || DIRECCION_POR_DEFECTO)}, CABA`;
const PIE_INTERNO = 'Aviso automático de la web de Centro Cristiano Vida Capital.';

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? '';
const e = escapar;
const FORMAS: Record<FormaPago, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago' };

/**
 * Link del mapa: el cargado en el panel si es http(s); si no (vacío o cualquier
 * otro esquema, como `javascript:`), una búsqueda de Google Maps.
 */
export function urlMapa(direccion: string, mapaUrl: string) {
  const cargado = mapaUrl.trim();
  if (/^https?:\/\//i.test(cargado)) return cargado;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion}, CABA`)}`;
}

export function bienvenidaVisita(d: {
  nombre: string;
  reunion: string;
  direccion: string;
  barrio?: string;
  mapaUrl: string;
  versiculo: { texto: string; cita: string };
  sitioUrl: string;
}): Email {
  const nombre = primerNombre(d.nombre);
  const lugar = d.barrio ? `${d.direccion}, ${d.barrio}` : d.direccion;
  const contenido =
    titulo(`¡Te esperamos, ${e(nombre)}!`, `${e(d.reunion)} &middot; ${e(lugar)}`) +
    versiculo(d.versiculo) +
    parrafo('Vas a encontrar a alguien en la puerta para recibirte. Si vienes con chicos, hay espacio para ellos en Vida Kids.') +
    boton('📍 Cómo llegar', urlMapa(d.direccion, d.mapaUrl));
  return { asunto: `¡Te esperamos, ${nombre}!`, html: marco(contenido, { sitioUrl: d.sitioUrl, pie: piePersona(d.direccion) }) };
}

/** Lo que hay que hacer para pagar: la misma fuente que la web (versión email), con los datos bancarios en un recuadro. */
function pasosDePago(forma: FormaPago, numero: number, datosTransferencia: string) {
  const { texto, datos } = instruccionesDePago(forma, numero, datosTransferencia, 'email');
  return parrafo(e(texto)) + (datos ? bloque(datos.split(/\r?\n/).map(e).join('<br>')) : '');
}

export function voucherRegistrado(d: {
  nombre: string;
  numero: number;
  montoUsd: number;
  formaPago: FormaPago;
  datosTransferencia: string;
  sitioUrl: string;
  direccion?: string;
}): Email {
  const n = numeroVoucher(d.numero);
  const contenido =
    titulo(`¡Gracias, ${e(primerNombre(d.nombre))}!`, 'Registramos tu aporte al Pro Templo.') +
    bloque(
      `<div style="font-size:13px;color:#a3a3a3">Voucher</div><div style="font-size:28px;font-weight:900;color:#a0d062">Nº ${n}</div>` +
        `<div style="margin-top:8px">USD ${d.montoUsd} &middot; ${FORMAS[d.formaPago]}</div>`,
    ) +
    pasosDePago(d.formaPago, d.numero, d.datosTransferencia) +
    parrafo('Tu ladrillo aparece en la pared cuando tesorería confirma el pago.') +
    boton('Ver el estado de mi voucher', `${d.sitioUrl}/pro-templo/voucher/${n}`);
  return { asunto: `Tu voucher Pro Templo Nº ${n}`, html: marco(contenido, { sitioUrl: d.sitioUrl, pie: piePersona(d.direccion) }) };
}

const contactoPersona = (email: string, whatsapp: string | null) =>
  `<div>Email: ${e(email)}</div>${whatsapp ? `<div>WhatsApp: ${e(whatsapp)}</div>` : ''}`;

export function avisoTesoreria(d: {
  nombre: string;
  numero: number;
  montoUsd: number;
  formaPago: FormaPago;
  email: string;
  whatsapp: string | null;
  panelUrl: string;
  sitioUrl: string;
}): Email {
  const n = numeroVoucher(d.numero);
  const contenido =
    titulo(`Voucher nuevo Nº ${n}`) +
    bloque(
      `<div><strong>${e(d.nombre)}</strong></div><div>USD ${d.montoUsd} &middot; ${FORMAS[d.formaPago]}</div>${contactoPersona(d.email, d.whatsapp)}`,
    ) +
    boton('Revisar en el panel', `${d.panelUrl}/vouchers`);
  return { asunto: `Voucher nuevo Nº ${n}`, html: marco(contenido, { sitioUrl: d.sitioUrl, pie: PIE_INTERNO }) };
}

export function avisoRecepcion(d: {
  nombre: string;
  email: string;
  whatsapp: string | null;
  intereses: string[];
  panelUrl: string;
  sitioUrl: string;
}): Email {
  const intereses = d.intereses.length ? `<div>Le interesa: ${d.intereses.map(e).join(', ')}</div>` : '';
  const contenido =
    titulo('Alguien avisó que viene el domingo') +
    bloque(`<div><strong>${e(d.nombre)}</strong></div>${contactoPersona(d.email, d.whatsapp)}${intereses}`) +
    boton('Ver las visitas', `${d.panelUrl}/visitas`);
  return { asunto: 'Alguien avisó que viene el domingo', html: marco(contenido, { sitioUrl: d.sitioUrl, pie: PIE_INTERNO }) };
}

/** Lo pide un administrador desde el panel para comprobar que Resend y el dominio andan. */
export function emailDePrueba(d: { nombre: string; remitente: string; sitioUrl: string; panelUrl: string }): Email {
  const contenido =
    titulo(`¡Funciona, ${e(primerNombre(d.nombre))}!`, 'Este es un mail de prueba pedido desde el panel.') +
    parrafo('Si lo estás leyendo, la web ya puede mandar emails: las confirmaciones de visitas, los vouchers y los avisos internos.') +
    bloque(`<div style="font-size:13px;color:#a3a3a3">Remitente</div><div>${e(d.remitente)}</div>`) +
    parrafo('Si llegó a spam, marcalo como "no es spam" y revisá que el dominio esté verificado en Resend.') +
    boton('Ir al panel', d.panelUrl);
  return { asunto: 'Mail de prueba de la web', html: marco(contenido, { sitioUrl: d.sitioUrl, pie: PIE_INTERNO }) };
}

export function ladrilloConfirmado(d: { nombre: string; numero: number; sitioUrl: string; direccion?: string }): Email {
  const n = numeroVoucher(d.numero);
  const contenido =
    titulo(`¡Gracias, ${e(primerNombre(d.nombre))}!`, `Tesorería confirmó tu voucher Nº ${n}.`) +
    parrafo('Tu ladrillo ya está en la pared. Gracias por ser parte de lo que Dios está construyendo en nuestra casa.') +
    boton('Ver la pared', `${d.sitioUrl}/pro-templo`);
  return { asunto: '¡Tu ladrillo ya está en la pared!', html: marco(contenido, { sitioUrl: d.sitioUrl, pie: piePersona(d.direccion) }) };
}
