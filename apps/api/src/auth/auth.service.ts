import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { PasoIngreso, Rol, UsuarioPanel } from '@ccvida/shared';
import type { Usuario } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { hashToken, nuevoToken, verificarClave, verificarTotp } from './cripto.js';

const DURACION_SESION_MS = 12 * 60 * 60 * 1000;
// Tiempo para completar el segundo paso (código 2FA) después de la contraseña.
const DURACION_PASO_2FA_MS = 10 * 60 * 1000;
export const ROLES_CON_2FA: Rol[] = ['administrador', 'tesoreria'];

const CREDENCIALES_INVALIDAS = 'Email o contraseña incorrectos.';
// Hash del mismo largo que uno real: si el email no existe, verificar tarda lo mismo.
const HASH_FALSO = `scrypt$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(64).toString('base64')}`;

export const usuarioPanel = (u: Usuario): UsuarioPanel => ({
  id: u.id,
  nombre: u.nombre,
  email: u.email,
  rol: u.rol,
  totpActivo: u.totpActivo,
  debeCambiarClave: u.debeCambiarClave,
});

export interface SesionActual {
  sesionId: string;
  completa: boolean;
  usuario: Usuario;
}

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  /** Paso 1: email y contraseña. Devuelve el token de la cookie y qué falta. */
  async ingresar(email: string, clave: string, ip: string): Promise<{ token: string; paso: PasoIngreso }> {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
    const valida = await verificarClave(clave, usuario?.passwordHash ?? HASH_FALSO);
    if (!usuario || !usuario.activo || !valida) throw new UnauthorizedException({ mensaje: CREDENCIALES_INVALIDAS });

    const pide2fa = ROLES_CON_2FA.includes(usuario.rol) || usuario.totpActivo;
    const token = await this.crearSesion(usuario.id, !pide2fa, ip);
    if (!pide2fa) {
      await this.marcarIngreso(usuario.id);
      return { token, paso: { paso: 'listo', usuario: usuarioPanel(usuario) } };
    }
    return { token, paso: { paso: usuario.totpActivo ? 'codigo' : 'configurar-2fa' } };
  }

  /** Paso 2: el código de la app de autenticación completa la sesión. */
  async verificarCodigo(sesion: SesionActual, codigo: string): Promise<PasoIngreso> {
    const { usuario } = sesion;
    if (!usuario.totpSecreto || !usuario.totpActivo || !verificarTotp(usuario.totpSecreto, codigo)) {
      throw new UnauthorizedException({ mensaje: 'El código no es válido o ya venció. Probá con el que muestra ahora la app.' });
    }
    await this.completarSesion(sesion);
    return { paso: 'listo', usuario: usuarioPanel(usuario) };
  }

  async completarSesion(sesion: SesionActual) {
    await this.prisma.sesion.update({
      where: { id: sesion.sesionId },
      data: { completa: true, expira: new Date(Date.now() + DURACION_SESION_MS) },
    });
    await this.marcarIngreso(sesion.usuario.id);
  }

  async sesionDesdeToken(token: string | undefined): Promise<SesionActual | null> {
    if (!token) return null;
    const sesion = await this.prisma.sesion.findUnique({ where: { tokenHash: hashToken(token) }, include: { usuario: true } });
    if (!sesion || sesion.expira < new Date() || !sesion.usuario.activo) return null;
    return { sesionId: sesion.id, completa: sesion.completa, usuario: sesion.usuario };
  }

  async salir(token: string | undefined) {
    if (token) await this.prisma.sesion.deleteMany({ where: { tokenHash: hashToken(token) } });
  }

  /** Cierra todas las sesiones de alguien: al darle de baja o cambiarle el rol o la clave. */
  async cerrarSesionesDe(usuarioId: string) {
    await this.prisma.sesion.deleteMany({ where: { usuarioId } });
  }

  private async crearSesion(usuarioId: string, completa: boolean, ip: string) {
    const token = nuevoToken();
    await this.prisma.sesion.create({
      data: {
        tokenHash: hashToken(token),
        usuarioId,
        completa,
        ip,
        expira: new Date(Date.now() + (completa ? DURACION_SESION_MS : DURACION_PASO_2FA_MS)),
      },
    });
    // Limpieza de sesiones vencidas de la misma persona.
    await this.prisma.sesion.deleteMany({ where: { usuarioId, expira: { lt: new Date() } } });
    return token;
  }

  private marcarIngreso(usuarioId: string) {
    return this.prisma.usuario.update({ where: { id: usuarioId }, data: { ultimoIngreso: new Date() } });
  }
}
