// Carga el contenido de ejemplo de la maqueta (ministerios, eventos, series y
// prédicas) como si se hubiera publicado desde el panel. Para desarrollo y demos:
// NO correr en la base de producción.
// Uso: npm run db:seed-ejemplo -w @ccvida/api
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const publicado = 'publicado' as const;

const ministerios = [
  { slug: 'kids-vida', nombre: 'Kids Vida', edades: 'De 3 a 11 años', horario: 'Domingos 10 h, durante la reunión', resumen: 'Los más chicos conocen a Jesús jugando.', descripcion: 'Mientras los grandes están en la reunión, los chicos tienen su propio espacio: cantan, escuchan historias de la Biblia, juegan y hacen amigos, siempre con maestras capacitadas.', actividades: ['Grupos por edad: 3 a 5, 6 a 8 y 9 a 11', 'Registro de entrada y salida con tu nombre', 'Merienda y actividades cada domingo'], color: '#f5d547', orden: 1 },
  { slug: 'jovenes', nombre: 'Jóvenes', edades: 'De 15 a 30 años', horario: 'Sábados 19 h', resumen: 'Amistad, preguntas reales y fe para la semana.', descripcion: 'Nos juntamos a cantar, charlar sin vueltas sobre la vida y la fe, y comer algo rico. Si llegás sin conocer a nadie, en una hora ya tenés amigos.', actividades: ['Encuentro semanal con música y charla', 'Salidas y campamentos durante el año', 'Grupos chicos para acompañarnos'], color: '#0c74b8', orden: 2 },
  { slug: 'matrimonios', nombre: 'Matrimonios', edades: 'Parejas y matrimonios', horario: 'Último domingo del mes, 12 h', resumen: 'Jesús en el centro de cada hogar.', descripcion: 'Encuentros para fortalecer el amor y la comunicación en pareja, con una charla, un almuerzo compartido y tiempo para ustedes dos.', actividades: ['Charlas sobre comunicación, finanzas y familia', 'Almuerzo compartido después de la reunión', 'Acompañamiento para parejas que lo necesiten'], color: '#8cc63f', orden: 3 },
];

for (const m of ministerios) {
  await prisma.ministerio.upsert({ where: { slug: m.slug }, update: {}, create: { ...m, estado: publicado } });
}
const jovenes = await prisma.ministerio.findUniqueOrThrow({ where: { slug: 'jovenes' } });
const matrimonios = await prisma.ministerio.findUniqueOrThrow({ where: { slug: 'matrimonios' } });

const eventos = [
  { slug: 'jovenes-sabados', titulo: 'Encuentro de Jóvenes', inicio: new Date('2026-10-31T22:00:00Z'), fin: new Date('2026-11-01T00:30:00Z'), repeticion: 'semanal' as const, lugar: 'Camarones 2201, CABA', resumen: 'Música, charla sin vueltas y algo rico para comer.', descripcion: 'Nos juntamos a cantar, charlar sobre la vida y la fe, y comer algo rico.', ministerioId: jovenes.id, destacado: true },
  { slug: 'encuentro-de-matrimonios', titulo: 'Encuentro de matrimonios', inicio: new Date('2026-11-29T15:00:00Z'), fin: new Date('2026-11-29T18:00:00Z'), repeticion: 'ninguna' as const, lugar: 'Camarones 2201, CABA', resumen: 'Una charla para parejas y un almuerzo compartido.', descripcion: 'Después de la reunión del domingo nos quedamos a almorzar juntos.\n\nPueden venir parejas de novios y matrimonios.', ministerioId: matrimonios.id, destacado: true },
];
for (const e of eventos) {
  await prisma.evento.upsert({ where: { slug: e.slug }, update: {}, create: { ...e, estado: publicado } });
}

const serie = await prisma.serie.upsert({
  where: { slug: 'un-futuro-en-el-desierto' },
  update: {},
  create: { slug: 'un-futuro-en-el-desierto', nombre: 'Un futuro en el desierto', estado: publicado },
});
const predicas = [
  { slug: 'sin-datos-en-el-desierto', titulo: 'Sin datos en el desierto', fecha: new Date('2026-10-25T00:00:00Z'), predicador: 'Pastor Martín Ruiz', duracionMin: 42, resumen: 'Dios escucha tu voz, abre tus ojos y provee lo necesario para seguir.', destacada: true },
  { slug: 'dios-acompana', titulo: 'Dios acompaña', fecha: new Date('2026-10-18T00:00:00Z'), predicador: 'Pastora Carolina Ruiz', duracionMin: 38, resumen: 'Tu historia en el desierto apenas comienza, y Dios camina a tu lado.', destacada: false },
];
for (const p of predicas) {
  await prisma.predica.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, serieId: serie.id, versiculos: [], estado: publicado } });
}

await prisma.$disconnect();
console.log('Contenido de ejemplo cargado: 3 ministerios, 2 eventos, 1 serie y 2 prédicas.');
