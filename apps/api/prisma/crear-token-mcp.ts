// Crea el token del MCP de contenido (sesión larga del usuario "MCP (Claude)").
// Uso: npm run crear-token-mcp -w @ccvida/api -- [--dias 90]
// Crear uno nuevo anula los anteriores. El token se muestra una sola vez.
import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { PrismaPg } from '@prisma/adapter-pg';
import { hashClave, hashToken, nuevoToken } from '../src/auth/cripto.js';
import { PrismaClient } from '../src/generated/prisma/client.js';

const EMAIL_MCP = 'mcp@ccvidacapital.org';
const DIA_MS = 86_400_000;

export async function crearTokenMcp(prisma: PrismaClient, dias = 90, ahora = Date.now()): Promise<{ token: string; expira: Date }> {
  const passwordHash = await hashClave(nuevoToken());
  const usuario = await prisma.usuario.upsert({
    where: { email: EMAIL_MCP },
    update: { activo: true, rol: 'editor', passwordHash, debeCambiarClave: false },
    create: { email: EMAIL_MCP, nombre: 'MCP (Claude)', rol: 'editor', passwordHash, debeCambiarClave: false },
  });
  await prisma.sesion.deleteMany({ where: { usuarioId: usuario.id } });
  const token = nuevoToken();
  const expira = new Date(ahora + dias * DIA_MS);
  await prisma.sesion.create({ data: { tokenHash: hashToken(token), usuarioId: usuario.id, completa: true, expira } });
  return { token, expira };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const i = process.argv.indexOf('--dias');
  const dias = i >= 0 ? Number(process.argv[i + 1]) : 90;
  if (!Number.isInteger(dias) || dias < 1) {
    console.error('Uso: npm run crear-token-mcp -w @ccvida/api -- [--dias 90]');
    process.exit(1);
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const { token, expira } = await crearTokenMcp(prisma, dias);
  await prisma.$disconnect();
  console.log(`\nToken del MCP (se muestra una sola vez):\n${token}`);
  console.log(`Vence: ${expira.toISOString().slice(0, 10)}`);
  console.log(`Guardalo en ${String.raw`C:\Users\frand\.secrets\ccvida-mcp.env`} con esta línea:`);
  console.log(`CCVIDA_MCP_TOKEN=${token}\n`);
}
