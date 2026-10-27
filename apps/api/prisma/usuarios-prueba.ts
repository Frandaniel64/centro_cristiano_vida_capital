// Crea un usuario de prueba por rol en la base LOCAL (o les vuelve a poner la clave).
// Uso: npm run db:usuarios-prueba -w @ccvida/api
//
// Todos usan la clave de CLAVE_PRUEBA. Administración y tesorería piden configurar
// la verificación en dos pasos con el celular la primera vez que entran.
// Solo corre contra una base en localhost: nunca en producción.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashClave } from '../src/auth/cripto.js';
import { PrismaClient, type Rol } from '../src/generated/prisma/client.js';

export const CLAVE_PRUEBA = 'prueba-local-ccvida';

const USUARIOS: { email: string; nombre: string; rol: Rol }[] = [
  { email: 'admin@local.test', nombre: 'Admin Local', rol: 'administrador' },
  { email: 'editor@local.test', nombre: 'Editor Local', rol: 'editor' },
  { email: 'tesoreria@local.test', nombre: 'Tesorería Local', rol: 'tesoreria' },
  { email: 'recepcion@local.test', nombre: 'Recepción Local', rol: 'recepcion' },
];

const url = process.env.DATABASE_URL ?? '';
if (process.env.NODE_ENV === 'production' || !/@(localhost|127\.0\.0\.1|host\.docker\.internal)[:/]/.test(url)) {
  console.error('Este script solo corre contra una base local (DATABASE_URL en localhost).');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const passwordHash = await hashClave(CLAVE_PRUEBA);

for (const u of USUARIOS) {
  const guardado = await prisma.usuario.upsert({
    where: { email: u.email },
    update: { passwordHash, activo: true, rol: u.rol, debeCambiarClave: false },
    create: { ...u, passwordHash, debeCambiarClave: false },
  });
  await prisma.sesion.deleteMany({ where: { usuarioId: guardado.id } });
  console.log(`${u.rol.padEnd(13)} ${u.email}${guardado.totpActivo ? '  (2FA ya configurado)' : ''}`);
}
await prisma.$disconnect();
console.log('\nLa clave de todos está en apps/api/prisma/usuarios-prueba.ts (CLAVE_PRUEBA).');
