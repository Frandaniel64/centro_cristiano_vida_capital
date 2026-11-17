import type { FormaPago } from '@ccvida/shared';
import { config } from '../../config.js';
import { escapar } from '../email.service.js';
import { numeroVoucher } from '../../pro-templo/reglas.js';
import { bloque, boton, marco, parrafo, titulo, versiculo } from './marco.js';

type Email = { asunto: string; html: string };

const PIE_PERSONA = 'Centro Cristiano Vida Capital &middot; Camarones 2201, CABA';
const PIE_INTERNO = 'Aviso automático de la web de Centro Cristiano Vida Capital.';

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? '';
const e = escapar;
const FORMAS: Record<FormaPago, string> = { efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago' };

/** Link del mapa: el cargado en el panel o, si está vacío, una búsqueda de Google Maps. */
export function urlMapa(direccion: string, mapaUrl: string) {
  return mapaUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${direccion}, CABA`)}`;
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
    parrafo('Vas a encontrar a alguien en la puerta para recibirte. Si venís con chicos, hay espacio para ellos en Vida Kids.') +
    boton('Cómo llegar', urlMapa(d.direccion, d.mapaUrl));
  return { asunto: `¡Te esperamos, ${nombre}!`, html: marco(contenido, { sitioUrl: d.sitioUrl, pie: PIE_PERSONA }) };
}

function pasosDePago(forma: FormaPago, n: string, datos: string) {
  if (forma === 'efectivo') {
    return parrafo(`Acercate a la mesa Pro Templo el domingo después de la reunión y decí tu número: <strong>Nº ${n}</strong>.`);
  }
  if (forma === 'mercadopago') {
    return parrafo(
      `Tesorería te responde este email con el link de pago de Mercado Pago. Tu número es <strong>Nº ${n}</strong>.`,
    );
  }
  const comprobante = parrafo(`Respondé este email con la foto del comprobante y tu número (Nº ${n}).`);
  if (!datos.trim()) {
    return parrafo('Tesorería te responde este email con los datos para transferir.') + comprobante;
  }
  return (
    parrafo('Transferí a esta cuenta:') +
    bloque(`<div style="white-space:pre-line">${e(datos)}</div>`) +
    comprobante
  );
}

export function voucherRegistrado(d: {
  nombre: string;
  numero: number;
  montoUsd: number;
  formaPago: FormaPago;
  datosTransferencia: string;
  sitioUrl: string;
}): Email {
  const n = numeroVoucher(d.numero);
  const contenido =
    titulo(`¡Gracias, ${e(primerNombre(d.nombre))}!`, 'Registramos tu aporte al Pro Templo.') +
    bloque(
      `<div style="font-size:13px;color:#a3a3a3">Voucher</div><div style="font-size:28px;font-weight:900;color:#a0d062">Nº ${n}</div>` +
        `<div style="margin-top:8px">USD ${d.montoUsd} &middot; ${FORMAS[d.formaPago]}</div>`,
    ) +
    pasosDePago(d.formaPago, n, d.datosTransferencia) +
    parrafo('Tu ladrillo aparece en la pared cuando tesorería confirma el pago.') +
    boton('Ver el estado de mi voucher', `${d.sitioUrl}/pro-templo/voucher/${n}`);
  return { asunto: `Tu voucher Pro Templo Nº ${n}`, html: marco(contenido, { sitioUrl: d.sitioUrl, pie: PIE_PERSONA }) };
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
}): Email {
  const n = numeroVoucher(d.numero);
  const contenido =
    titulo(`Voucher nuevo Nº ${n}`) +
    bloque(
      `<div><strong>${e(d.nombre)}</strong></div><div>USD ${d.montoUsd} &middot; ${FORMAS[d.formaPago]}</div>${contactoPersona(d.email, d.whatsapp)}`,
    ) +
    boton('Revisar en el panel', `${d.panelUrl}/vouchers`);
  return { asunto: `Voucher nuevo Nº ${n}`, html: marco(contenido, { sitioUrl: config.sitioUrl, pie: PIE_INTERNO }) };
}

export function avisoRecepcion(d: {
  nombre: string;
  email: string;
  whatsapp: string | null;
  intereses: string[];
  panelUrl: string;
}): Email {
  const intereses = d.intereses.length ? `<div>Le interesa: ${d.intereses.map(e).join(', ')}</div>` : '';
  const contenido =
    titulo('Alguien avisó que viene el domingo') +
    bloque(`<div><strong>${e(d.nombre)}</strong></div>${contactoPersona(d.email, d.whatsapp)}${intereses}`) +
    boton('Ver las visitas', `${d.panelUrl}/visitas`);
  return { asunto: 'Alguien avisó que viene el domingo', html: marco(contenido, { sitioUrl: config.sitioUrl, pie: PIE_INTERNO }) };
}

export function ladrilloConfirmado(d: { nombre: string; numero: number; sitioUrl: string }): Email {
  const n = numeroVoucher(d.numero);
  const contenido =
    titulo(`¡Gracias, ${e(primerNombre(d.nombre))}!`, `Tesorería confirmó tu voucher Nº ${n}.`) +
    parrafo('Tu ladrillo ya está en la pared. Gracias por ser parte de lo que Dios está construyendo en nuestra casa.') +
    boton('Ver la pared', `${d.sitioUrl}/pro-templo`);
  return { asunto: '¡Tu ladrillo ya está en la pared!', html: marco(contenido, { sitioUrl: d.sitioUrl, pie: PIE_PERSONA }) };
}
