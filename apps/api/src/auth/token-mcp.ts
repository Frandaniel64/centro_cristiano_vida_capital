// Token del MCP de contenido: sesión larga del usuario "MCP (Claude)".
// Crear uno nuevo anula los anteriores.
import type { PrismaClient } from '../generated/prisma/client.js';
import { hashClave, hashToken, nuevoToken } from './cripto.js';

export const EMAIL_MCP = 'mcp@ccvidacapital.org';
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
