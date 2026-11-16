// Crea el token del MCP de contenido. El token se muestra una sola vez.
// En local:      npm run crear-token-mcp -w @ccvida/api -- [--dias 90]
// En producción: npm run crear-token-mcp:prod -w @ccvida/api -- [--dias 90]
//   (desde la terminal del contenedor de la API; usa el dist compilado).
// dotenv carga apps/api/.env si existe; en el contenedor las variables ya están.
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { crearTokenMcp } from '../auth/token-mcp.js';
import { PrismaClient } from '../generated/prisma/client.js';

const i = process.argv.indexOf('--dias');
const dias = i >= 0 ? Number(process.argv[i + 1]) : 90;
if (!Number.isInteger(dias) || dias < 1) {
  console.error('Uso: npm run crear-token-mcp -w @ccvida/api -- [--dias 90]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL.');
  process.exit(1);
}
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
try {
  const { token, expira } = await crearTokenMcp(prisma, dias);
  console.log(`\nToken del MCP (se muestra una sola vez):\n${token}`);
  console.log(`Vence: ${expira.toISOString().slice(0, 10)}`);
  console.log(`Guardalo en ${String.raw`C:\Users\frand\.secrets\ccvida-mcp.env`} con esta línea:`);
  console.log(`CCVIDA_MCP_TOKEN=${token}\n`);
} finally {
  await prisma.$disconnect();
}
