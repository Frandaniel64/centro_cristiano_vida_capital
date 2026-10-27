// Crea la primera cuenta de administración, o le reinicia la clave si ya existe.
// Uso: npm run crear-admin -w @ccvida/api -- email@iglesia.org "Nombre Apellido"
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashClave } from '../src/auth/cripto.js';
import { claveTemporal } from '../src/admin/usuarios.controller.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const [email, nombre] = process.argv.slice(2);
if (!email || !nombre) {
  console.error('Uso: npm run crear-admin -w @ccvida/api -- email@iglesia.org "Nombre Apellido"');
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const clave = claveTemporal();
const passwordHash = await hashClave(clave);
const usuario = await prisma.usuario.upsert({
  where: { email: email.toLowerCase() },
  update: { passwordHash, debeCambiarClave: true, activo: true, rol: 'administrador' },
  create: { email: email.toLowerCase(), nombre, rol: 'administrador', passwordHash, debeCambiarClave: true },
});
await prisma.sesion.deleteMany({ where: { usuarioId: usuario.id } });
await prisma.$disconnect();

console.log(`\nCuenta de administración: ${usuario.email}`);
console.log(`Clave temporal: ${clave}`);
console.log('Al ingresar va a pedir cambiar la clave y configurar la verificación en dos pasos.\n');
