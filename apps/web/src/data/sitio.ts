// Contenido del sitio mientras no exista el panel.
// Todo sale de la maqueta de la Propuesta 2 y es DE EJEMPLO: textos, nombres,
// horarios, montos y fotos (Unsplash). Cuando la API esté lista, cada bloque
// se reemplaza por su colección y este archivo desaparece.
import type { ImageMetadata } from 'astro';

import abuelaNieta from '../assets/fotos/abuela-nieta.jpg';
import alabanza from '../assets/fotos/alabanza.jpg';
import amigas from '../assets/fotos/amigas.jpg';
import amigosMesa from '../assets/fotos/amigos-mesa.jpg';
import atardecer from '../assets/fotos/atardecer.jpg';
import bautismo from '../assets/fotos/bautismo.jpg';
import biblia from '../assets/fotos/biblia.jpg';
import comidaFamilias from '../assets/fotos/comida-familias.jpg';
import grupoCiudad from '../assets/fotos/grupo-ciudad.jpg';
import jovenes from '../assets/fotos/jovenes.jpg';
import kidsVida from '../assets/fotos/kids-vida.jpg';
import manosEnAlto from '../assets/fotos/manos-en-alto.jpg';
import matrimonio from '../assets/fotos/matrimonio.jpg';
import pastor from '../assets/fotos/pastor.jpg';
import predicaDesierto from '../assets/fotos/predica-desierto.jpg';
import salonVacio from '../assets/fotos/salon-vacio.jpg';
import transmision from '../assets/fotos/transmision.jpg';
import type { EstadoProTemplo, FormaPago } from '@ccvida/shared';

export interface Foto {
  src: ImageMetadata;
  alt: string;
}

export const fotos = {
  alabanza: { src: alabanza, alt: 'Personas levantando las manos durante la alabanza' },
  amigas: { src: amigas, alt: 'Amigas riendo juntas' },
  kidsVida: { src: kidsVida, alt: 'Nenas pintando en Kids Vida' },
  abuelaNieta: { src: abuelaNieta, alt: 'Una abuela abrazando a su nieta' },
  salonVacio: { src: salonVacio, alt: 'Salón vacío con piso de madera y ventanales' },
  predicaDesierto: { src: predicaDesierto, alt: '' },
  grupoCiudad: { src: grupoCiudad, alt: 'Un grupo de personas abrazadas de espaldas mirando la ciudad' },
  amigosMesa: { src: amigosMesa, alt: 'Un grupo de amigos conversando alrededor de una mesa' },
  pastor: { src: pastor, alt: 'Pastor predicando en el escenario' },
  atardecer: { src: atardecer, alt: 'Amigos abrazados mirando el atardecer' },
  manosEnAlto: { src: manosEnAlto, alt: 'Congregación con las manos en alto' },
  comidaFamilias: { src: comidaFamilias, alt: 'Familias compartiendo una comida' },
  biblia: { src: biblia, alt: 'Manos sosteniendo una Biblia abierta' },
  transmision: { src: transmision, alt: '' },
} satisfies Record<string, Foto>;

// Equivale a la colección "configuracion".
export const config = {
  nombre: 'Centro Cristiano Vida Capital',
  nombreCorto: 'CCVida Capital',
  lema: 'La iglesia sos vos.',
  reunion: 'Domingos 10 h',
  horaReunion: '10 h',
  direccion: 'Camarones 2201',
  barrio: 'CABA',
  colectivos: '24, 53 y 109',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Camarones+2201+CABA',
  instagram: { usuario: '@ccvidacaba', url: 'https://www.instagram.com/ccvidacaba/' },
  // Pendiente: canal real de YouTube, Facebook y WhatsApp de la iglesia.
  youtube: { nombre: 'CCVida Capital', url: '', canalId: '' },
  facebook: { nombre: 'CCVida Capital', url: '' },
  whatsapp: { visible: '11 5555 1234', numero: '5491155551234' },
  comoLlegar: [
    { titulo: 'Colectivos', texto: '24, 53 y 109' },
    { titulo: 'Auto', texto: 'Estacionamiento en la calle' },
    { titulo: 'Accesibilidad', texto: 'Entrada sin escalones' },
  ],
};

export interface Ministerio {
  slug: string;
  nombre: string;
  edad: string;
  horario: string;
  corto: string;
  texto: string;
  actividades: string[];
  foto: Foto;
  color: string;
  colorTexto: string;
}

export const ministerios: Ministerio[] = [
  {
    slug: 'kids-vida',
    nombre: 'Kids Vida',
    edad: 'De 3 a 11 años',
    horario: 'Domingos 10 h, durante la reunión',
    corto: 'Los más chicos conocen a Jesús jugando.',
    texto:
      'Mientras los grandes están en la reunión, los chicos tienen su propio espacio: cantan, escuchan historias de la Biblia, juegan y hacen amigos, siempre con maestras capacitadas.',
    actividades: [
      'Grupos por edad: 3 a 5, 6 a 8 y 9 a 11',
      'Registro de entrada y salida con tu nombre',
      'Merienda y actividades cada domingo',
    ],
    foto: { src: kidsVida, alt: 'Dos nenas pintando con marcadores' },
    color: '#f5d547',
    colorTexto: '#000000',
  },
  {
    slug: 'jovenes',
    nombre: 'Jóvenes',
    edad: 'De 15 a 30 años',
    horario: 'Sábados 19 h',
    corto: 'Amistad, preguntas reales y fe para la semana.',
    texto:
      'Nos juntamos a cantar, charlar sin vueltas sobre la vida y la fe, y comer algo rico. Si llegás sin conocer a nadie, en una hora ya tenés amigos.',
    actividades: [
      'Encuentro semanal con música y charla',
      'Salidas y campamentos durante el año',
      'Grupos chicos para acompañarnos',
    ],
    foto: { src: jovenes, alt: 'Jóvenes riendo al aire libre' },
    color: '#0c74b8',
    colorTexto: '#ffffff',
  },
  {
    slug: 'matrimonios',
    nombre: 'Matrimonios',
    edad: 'Parejas y matrimonios',
    horario: 'Último domingo del mes, 12 h',
    corto: 'Jesús en el centro de cada hogar.',
    texto:
      'Encuentros para fortalecer el amor y la comunicación en pareja, con una charla, un almuerzo compartido y tiempo para ustedes dos.',
    actividades: [
      'Charlas sobre comunicación, finanzas y familia',
      'Almuerzo compartido después de la reunión',
      'Acompañamiento para parejas que lo necesiten',
    ],
    foto: { src: matrimonio, alt: 'Una pareja abrazada sonriendo' },
    color: '#8cc63f',
    colorTexto: '#000000',
  },
  {
    slug: 'bautismo',
    nombre: 'Bautismo',
    edad: 'Para quienes decidieron seguir a Jesús',
    horario: 'Próximo: domingo 13 de diciembre',
    corto: 'Una decisión puede cambiar tu historia.',
    texto:
      'El bautismo es una forma de contar en público que decidiste seguir a Jesús. Antes hacemos un encuentro para responder tus preguntas y acompañarte en este paso.',
    actividades: [
      'Encuentro previo de preparación',
      'Podés invitar a tu familia y amigos',
      'Te acompañamos antes, durante y después',
    ],
    foto: { src: bautismo, alt: 'Personas celebrando un bautismo en el agua' },
    color: '#f5f5f0',
    colorTexto: '#000000',
  },
];

export const primeraVez = [
  { titulo: 'Kids Vida', texto: 'Mientras vos estás en la reunión, los chicos aprenden y juegan.' },
  { titulo: 'Vení como estés', texto: 'No hay código de vestimenta. Alguien te va a recibir en la puerta con un café.' },
];

export const nosotros = {
  intro:
    'Centro Cristiano Vida Capital es una iglesia cristiana evangélica en el corazón de Buenos Aires. Creemos que la iglesia no es un edificio:',
  datos: 'Más de 150 personas · Desde 2016 · Floresta, CABA',
  historia: [
    'Empezamos como un puñado de familias que se juntaban a orar en un living de Floresta. Con los años el living quedó chico y nos mudamos al teatro donde hoy nos encontramos cada domingo.',
    'Hoy somos más de 150 personas de todas las edades. Seguimos siendo lo mismo que al principio:',
  ],
  historiaDestacado: 'una familia que se recibe, se acompaña y comparte la mesa.',
  pastores: {
    nombres: 'Martín y Carolina Ruiz',
    texto:
      'Pastorean CCVida desde 2016. Martín predica casi todos los domingos; Carolina coordina Kids Vida y los encuentros de matrimonios. Tienen tres hijos y una mesa donde siempre entra uno más.',
    cita: '“Queremos que cada persona que entra sienta que llegó a casa.”',
  },
  pilares: [
    { titulo: 'Somos familia', texto: 'La comunidad es el corazón: nos recibimos por nombre y compartimos la mesa.', bg: '#0c74b8', fg: '#ffffff' },
    { titulo: 'Dios te acompaña', texto: 'En el desierto y en la fiesta, nadie camina solo.', bg: '#f5d547', fg: '#000000' },
    { titulo: 'Tu lugar está acá', texto: 'Cada persona suma. Tu presencia marca la diferencia.', bg: '#8cc63f', fg: '#000000' },
    { titulo: 'Crecemos juntos', texto: 'Hay un espacio para cada etapa: chicos, jóvenes, parejas y familias.', bg: '#0a0a0a', fg: '#f5f5f0' },
  ],
  creemos: [
    { titulo: 'Jesús es el centro', texto: 'Creemos que Jesús murió y resucitó, y que en él encontramos vida nueva.' },
    { titulo: 'La Biblia nos guía', texto: 'Es la Palabra de Dios y la leemos juntos para vivirla en lo cotidiano.' },
    { titulo: 'Todo es gracia', texto: 'No se trata de ganarse el lugar: Dios nos ama tal como somos.' },
    { titulo: 'La iglesia somos todos', texto: 'No es un edificio ni un show: es una familia que se cuida.' },
  ],
  galeria: [fotos.atardecer, fotos.manosEnAlto, fotos.comidaFamilias, fotos.biblia],
};

// Equivale a la colección "campanas" (Pro Templo).
export const proTemplo = {
  metaUsd: 10_000,
  montoMaximoUsd: 10_000,
  montosSugeridos: [1, 5, 10, 20, 50, 100],
  formasPago: ['efectivo', 'transferencia'] satisfies FormaPago[],
  destinos: [
    { monto: 'USD 4.000', titulo: 'Depósito y garantía', texto: 'Para firmar el contrato del local.', bg: '#0c74b8', fg: '#ffffff' },
    { monto: 'USD 3.500', titulo: 'Primeros tres meses', texto: 'El alquiler cubierto mientras nos acomodamos.', bg: '#8cc63f', fg: '#000000' },
    { monto: 'USD 2.500', titulo: 'Acondicionamiento', texto: 'Sillas, sonido, luces y la sala de Kids Vida.', bg: '#f5d547', fg: '#000000' },
  ],
  pasos: [
    { n: '1', titulo: 'Elegí tu monto', texto: 'Desde USD 1. No hay mínimo ni máximo.', bg: '#0c74b8', fg: '#ffffff' },
    { n: '2', titulo: 'Recibí tu voucher', texto: 'Lo pagás el domingo o por transferencia y te damos tu voucher numerado.', bg: '#8cc63f', fg: '#000000' },
    { n: '3', titulo: 'Mirá cómo sube la pared', texto: 'Cada USD 100 levanta un ladrillo. Lo ves acá en tiempo real.', bg: '#f5d547', fg: '#000000' },
  ],
  faq: [
    { q: '¿Qué es un voucher?', a: 'Es tu aporte en dólares para el proyecto Pro Templo. Elegís el monto, lo pagás y recibís un voucher con tu número.' },
    { q: '¿Cómo lo pago?', a: 'En efectivo en la mesa Pro Templo los domingos después de la reunión, o por transferencia. Te pasamos los datos por WhatsApp.' },
    { q: '¿Puedo dar más de un voucher?', a: 'Sí, cuantos quieras y cuando quieras. Cada uno suma a la pared.' },
    { q: '¿Qué pasa si superamos la meta?', a: 'Lo que sobre se usa para equipar el local y sostener el alquiler de los meses siguientes.' },
  ],
};

// Se muestra hasta que responde GET /api/pro-templo/estado. Valores de ejemplo.
export const estadoProTemploInicial: EstadoProTemplo = {
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

export interface Predica {
  slug: string;
  titulo: string;
  serie: string;
  fecha: string; // ISO
  predicador: string;
  duracion: string;
  resumen: string;
  versiculos: string[];
  urlVideo: string;
  foto: Foto;
}

export const predicas: Predica[] = [
  { slug: 'sin-datos-en-el-desierto', titulo: 'Sin datos en el desierto', serie: 'Un futuro en el desierto', fecha: '2026-10-25', predicador: 'Pastor Martín Ruiz', duracion: '42 min', resumen: 'Dios escucha tu voz, abre tus ojos y provee lo necesario para seguir.', versiculos: [], urlVideo: '', foto: { src: predicaDesierto, alt: '' } },
  { slug: 'dios-acompana', titulo: 'Dios acompaña', serie: 'Un futuro en el desierto', fecha: '2026-10-18', predicador: 'Pastora Carolina Ruiz', duracion: '38 min', resumen: 'Tu historia en el desierto apenas comienza, y Dios camina a tu lado.', versiculos: [], urlVideo: '', foto: { src: alabanza, alt: '' } },
  { slug: 'el-no-podia-orar-yo-puedo', titulo: 'Él no podía orar, yo puedo', serie: 'Un futuro en el desierto', fecha: '2026-10-11', predicador: 'Pastor Martín Ruiz', duracion: '45 min', resumen: 'Cuando otros no pueden, nosotros podemos orar por ellos.', versiculos: [], urlVideo: '', foto: { src: pastor, alt: '' } },
  { slug: 'dialogo-sin-fin', titulo: 'Diálogo sin fin', serie: 'Vida de oración', fecha: '2026-10-04', predicador: 'Pastor Martín Ruiz', duracion: '40 min', resumen: 'La oración no es un trámite: es una conversación que nunca se corta.', versiculos: [], urlVideo: '', foto: { src: biblia, alt: '' } },
  { slug: 'el-poder-que-sostiene-tu-vida', titulo: 'El poder que sostiene tu vida', serie: 'Vida de oración', fecha: '2026-09-27', predicador: 'Invitado: Pastor Diego Paz', duracion: '47 min', resumen: 'Lo que te sostiene en los días de angustia no es tu fuerza.', versiculos: [], urlVideo: '', foto: { src: transmision, alt: '' } },
  { slug: 'bienaventurado', titulo: 'Bienaventurado', serie: 'Salmos', fecha: '2026-09-20', predicador: 'Pastora Carolina Ruiz', duracion: '36 min', resumen: 'El Salmo 1 y la vida que da fruto a su tiempo.', versiculos: [], urlVideo: '', foto: { src: manosEnAlto, alt: '' } },
];

export const series = [...new Set(predicas.map((p) => p.serie))];

export const visita = {
  agenda: [
    { hora: '9:45', titulo: 'Café de bienvenida', texto: 'Te recibimos en la puerta.', acento: '#f5f5f0' },
    { hora: '10:00', titulo: 'Alabanza', texto: 'Cantamos juntos, sin presión.', acento: '#4fa3e0' },
    { hora: '10:30', titulo: 'Prédica', texto: 'Un mensaje para la semana.', acento: '#f5d547' },
    { hora: '11:15', titulo: 'Oración', texto: 'Si querés, oramos por vos.', acento: '#8cc63f' },
    { hora: '11:45', titulo: 'Charla y despedida', texto: 'Nadie se va corriendo.', acento: '#f5f5f0' },
  ],
  faq: [
    { q: '¿Cómo me tengo que vestir?', a: 'Como estés cómodo. Vas a ver gente de jean y zapatillas, y también algunos más arreglados.' },
    { q: '¿Puedo ir solo?', a: 'Claro. Avisanos con el formulario y alguien te espera en la puerta para que no entres solo.' },
    { q: '¿Qué hago con mis hijos?', a: 'Pueden ir a Kids Vida durante la reunión. Los registrás en la entrada y los retirás al final.' },
    { q: '¿Me van a pedir plata?', a: 'No. Hay un momento de ofrenda para quienes quieran dar, pero nadie espera que lo hagas en tu primera visita.' },
  ],
  intereses: ['Kids Vida', 'Jóvenes', 'Matrimonios', 'Bautismo', 'Pro Templo'],
};

// Equivale a la colección "eventos". Horarios en Buenos Aires (UTC-3).
export interface Evento {
  slug: string;
  titulo: string;
  inicio: string; // ISO con zona horaria
  fin: string;
  repeticion: 'ninguna' | 'semanal' | 'mensual';
  lugar: string;
  resumen: string;
  descripcion: string[];
  ministerio?: string; // slug de un ministerio
  foto: Foto;
  destacado: boolean;
  linkInscripcion?: string;
}

export const eventos: Evento[] = [
  {
    slug: 'encuentro-de-matrimonios-noviembre',
    titulo: 'Encuentro de matrimonios',
    inicio: '2026-11-29T12:00:00-03:00',
    fin: '2026-11-29T15:00:00-03:00',
    repeticion: 'ninguna',
    lugar: 'Camarones 2201, CABA',
    resumen: 'Una charla para parejas y un almuerzo compartido después de la reunión.',
    descripcion: [
      'Después de la reunión del domingo nos quedamos a almorzar juntos y a charlar sobre cómo cuidar el matrimonio en lo cotidiano.',
      'Pueden venir parejas de novios y matrimonios, sean o no de la iglesia. Los chicos quedan en Kids Vida.',
    ],
    ministerio: 'matrimonios',
    foto: { src: matrimonio, alt: 'Una pareja abrazada sonriendo' },
    destacado: true,
  },
  {
    slug: 'bautismo-diciembre',
    titulo: 'Bautismo de fin de año',
    inicio: '2026-12-13T10:00:00-03:00',
    fin: '2026-12-13T13:00:00-03:00',
    repeticion: 'ninguna',
    lugar: 'Camarones 2201, CABA',
    resumen: 'Celebramos juntos a quienes decidieron seguir a Jesús.',
    descripcion: [
      'Durante la reunión del domingo celebramos los bautismos del año. Podés invitar a tu familia y a tus amigos.',
      'Si te querés bautizar, antes hacemos un encuentro de preparación para responder tus preguntas y acompañarte en este paso.',
    ],
    ministerio: 'bautismo',
    foto: { src: bautismo, alt: 'Personas celebrando un bautismo en el agua' },
    destacado: true,
    linkInscripcion: '/visitanos',
  },
  {
    slug: 'jovenes-sabados',
    titulo: 'Encuentro de Jóvenes',
    inicio: '2026-10-31T19:00:00-03:00',
    fin: '2026-10-31T21:30:00-03:00',
    repeticion: 'semanal',
    lugar: 'Camarones 2201, CABA',
    resumen: 'Música, charla sin vueltas y algo rico para comer. De 15 a 30 años.',
    descripcion: [
      'Nos juntamos a cantar, charlar sobre la vida y la fe, y comer algo rico. Si llegás sin conocer a nadie, en una hora ya tenés amigos.',
    ],
    ministerio: 'jovenes',
    foto: { src: jovenes, alt: 'Jóvenes riendo al aire libre' },
    destacado: true,
  },
];

export const nav = [
  { href: '/', label: 'Inicio' },
  { href: '/nosotros', label: 'Nosotros' },
  { href: '/ministerios', label: 'Ministerios' },
  { href: '/eventos', label: 'Eventos' },
  { href: '/pro-templo', label: 'Pro Templo' },
  { href: '/en-vivo', label: 'En vivo' },
];

export const navCompleta = [...nav, { href: '/visitanos', label: 'Visitanos' }];
