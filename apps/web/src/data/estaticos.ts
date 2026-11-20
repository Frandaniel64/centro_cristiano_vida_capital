// Contenido de diseño que no se edita desde el panel (todavía). Los montos del
// desglose de Pro Templo son una decisión pendiente de pastores y tesorería.
import type { EstadoProTemplo } from '@ccvida/shared';
import { fotoDiseno } from '../lib/fotos';

export const fotos = {
  alabanza: fotoDiseno('alabanza', 'El pastor Carlos Fuenmayor predicando un domingo'),
  amigas: fotoDiseno('amigas', 'Amigas riendo juntas'),
  kidsVida: fotoDiseno('kids-vida', 'Nenas pintando en Vida Kids'),
  abuelaNieta: fotoDiseno('abuela-nieta', 'Una abuela abrazando a su nieta'),
  salonVacio: fotoDiseno('salon-vacio', 'Salón vacío con piso de madera y ventanales'),
  grupoCiudad: fotoDiseno('grupo-ciudad', 'Un grupo de personas abrazadas de espaldas mirando la ciudad'),
  amigosMesa: fotoDiseno('amigos-mesa', 'Un grupo de amigos conversando alrededor de una mesa'),
  pastor: fotoDiseno('pastor', 'Pastor predicando en el escenario'),
  comidaFamilias: fotoDiseno('comida-familias', 'Gente conversando y riendo alrededor de una mesa'),
  transmision: fotoDiseno('transmision', ''),
  logo: fotoDiseno('logo', ''),
  galeria: [
    fotoDiseno('atardecer', 'Amigos abrazados mirando el atardecer'),
    fotoDiseno('manos-en-alto', 'Congregación con las manos en alto'),
    fotoDiseno('comida-familias', 'Familias compartiendo una comida'),
    fotoDiseno('biblia', 'Manos sosteniendo una Biblia abierta'),
  ],
};

export const primeraVez = [
  { titulo: 'Vida Kids', texto: 'Mientras tú estás en la reunión, los chicos aprenden y juegan.' },
  { titulo: 'Ven como estés', texto: 'No hay código de vestimenta. Alguien te va a recibir en la puerta con un café.' },
];

export const proTemploDestinos = [
  { monto: 'USD 4.000', titulo: 'Depósito y garantía', texto: 'Para firmar el contrato del local.', bg: '#0a6cac', fg: '#ffffff' },
  { monto: 'USD 3.500', titulo: 'Primeros tres meses', texto: 'El alquiler cubierto mientras nos acomodamos.', bg: '#a0d062', fg: '#0d1f2d' },
  { monto: 'USD 2.500', titulo: 'Acondicionamiento', texto: 'Sillas, sonido, luces y la sala de Vida Kids.', bg: '#b1d9e1', fg: '#0d1f2d' },
];

export const proTemploPasos = [
  { n: '1', titulo: 'Elige tu monto', texto: 'Desde USD 1. No hay mínimo ni máximo.', bg: '#0a6cac', fg: '#ffffff' },
  { n: '2', titulo: 'Recibe tu voucher', texto: 'Lo pagas el domingo o por transferencia y te damos tu voucher numerado.', bg: '#a0d062', fg: '#0d1f2d' },
  { n: '3', titulo: 'Mira cómo sube la pared', texto: 'Cada USD 100 levanta un ladrillo. Lo ves aquí en tiempo real.', bg: '#b1d9e1', fg: '#0d1f2d' },
];

// Valores de ejemplo del contador para el modo muestra.
export const estadoProTemploEjemplo: EstadoProTemplo = {
  recaudadoUsd: 3240,
  metaUsd: 10_000,
  porcentaje: 32,
  ladrillos: 32,
  personas: 86,
  ultimosVouchers: [
    { nombre: 'Familia Gómez', montoUsd: 50 },
    { nombre: 'Lucía', montoUsd: 20 },
    { nombre: 'Grupo de jóvenes', montoUsd: 100 },
    { nombre: 'Alguien de la familia', montoUsd: 10 },
  ],
};

export const nav = [
  { href: '/', label: 'Inicio' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/ministerios', label: 'Ministerios' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/pro-templo', label: 'Pro Templo' },
  { href: '/en-vivo', label: 'En vivo' },
];

export const navCompleta = [...nav, { href: '/visitanos', label: 'Visítanos' }];
