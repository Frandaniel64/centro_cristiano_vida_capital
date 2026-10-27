// Datos mínimos para arrancar: la campaña Pro Templo y la configuración del sitio.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

await prisma.campana.upsert({
  where: { slug: 'pro-templo' },
  update: {},
  create: {
    nombre: 'Pro Templo',
    slug: 'pro-templo',
    metaUsd: 10_000,
    montosSugeridos: [1, 5, 10, 20, 50, 100],
    formasPagoActivas: ['efectivo', 'transferencia'],
  },
});

await prisma.configuracion.upsert({
  where: { id: 1 },
  update: {},
  create: { id: 1, direccion: 'Camarones 2201' },
});

await prisma.$disconnect();
