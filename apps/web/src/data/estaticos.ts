// Contenido de diseño que no se edita desde el panel (todavía). Los montos del
// desglose de Pro Templo son una decisión pendiente de pastores y tesorería.
import type { EstadoProTemplo } from '@ccvida/shared';
import { fotoDiseno } from '../lib/fotos';

export const fotos = {
  alabanza: fotoDiseno('alabanza', 'Personas levantando las manos durante la alabanza'),
  amigas: fotoDiseno('amigas', 'Amigas riendo juntas'),
  kidsVida: fotoDiseno('kids-vida', 'Nenas pintando en Kids Vida'),
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
  { titulo: 'Kids Vida', texto: 'Mientras vos estás en la reunión, los chicos aprenden y juegan.' },
  { titulo: 'Vení como estés', texto: 'No hay código de vestimenta. Alguien te va a recibir en la puerta con un café.' },
];

export const proTemploDestinos = [
  { monto: 'USD 4.000', titulo: 'Depósito y garantía', texto: 'Para firmar el contrato del local.', bg: '#0c74b8', fg: '#ffffff' },
  { monto: 'USD 3.500', titulo: 'Primeros tres meses', texto: 'El alquiler cubierto mientras nos acomodamos.', bg: '#8cc63f', fg: '#000000' },
  { monto: 'USD 2.500', titulo: 'Acondicionamiento', texto: 'Sillas, sonido, luces y la sala de Kids Vida.', bg: '#f5d547', fg: '#000000' },
];

export const proTemploPasos = [
  { n: '1', titulo: 'Elegí tu monto', texto: 'Desde USD 1. No hay mínimo ni máximo.', bg: '#0c74b8', fg: '#ffffff' },
  { n: '2', titulo: 'Recibí tu voucher', texto: 'Lo pagás el domingo o por transferencia y te damos tu voucher numerado.', bg: '#8cc63f', fg: '#000000' },
  { n: '3', titulo: 'Mirá cómo sube la pared', texto: 'Cada USD 100 levanta un ladrillo. Lo ves acá en tiempo real.', bg: '#f5d547', fg: '#000000' },
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

export const navCompleta = [...nav, { href: '/visitanos', label: 'Visitanos' }];
