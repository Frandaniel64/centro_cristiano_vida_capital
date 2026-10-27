import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, NotFoundException, Param, Patch, Post, UseGuards } from '@nestjs/common';
import type { ClaveTemporal, Rol, UsuarioAdmin } from '@ccvida/shared';
import { randomBytes } from 'node:crypto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, Length } from 'class-validator';
import { AuthService, usuarioPanel, type SesionActual } from '../auth/auth.service.js';
import { hashClave } from '../auth/cripto.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import type { Usuario } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';

const ROLES: Rol[] = ['administrador', 'editor', 'tesoreria', 'recepcion'];
const minusculas = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

class CrearUsuarioDto {
  @IsString() @Length(2, 100, { message: 'Escribí el nombre.' }) nombre!: string;
  @Transform(minusculas) @IsEmail({}, { message: 'Escribí un email válido.' }) email!: string;
  @IsIn(ROLES, { message: 'Elegí un rol.' }) rol!: Rol;
}

class EditarUsuarioDto {
  @IsOptional() @IsString() @Length(2, 100) nombre?: string;
  @IsOptional() @IsIn(ROLES) rol?: Rol;
  @IsOptional() @IsBoolean() activo?: boolean;
}

/** Clave temporal legible: 3 bloques de 4 caracteres. */
export const claveTemporal = () =>
  randomBytes(9)
    .toString('base64url')
    .replace(/[-_]/g, 'x')
    .match(/.{4}/g)!
    .join('-');

const aVista = (u: Usuario): UsuarioAdmin => ({
  ...usuarioPanel(u),
  activo: u.activo,
  ultimoIngreso: u.ultimoIngreso?.toISOString() ?? null,
  creado: u.creado.toISOString(),
});

@Controller('admin/usuarios')
@UseGuards(SesionGuard)
@Roles('administrador')
export class UsuariosController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Get()
  async listar(): Promise<UsuarioAdmin[]> {
    const usuarios = await this.prisma.usuario.findMany({ orderBy: [{ activo: 'desc' }, { nombre: 'asc' }] });
    return usuarios.map(aVista);
  }

  @Post()
  async crear(@Body() d: CrearUsuarioDto): Promise<ClaveTemporal> {
    if (await this.prisma.usuario.findUnique({ where: { email: d.email } })) {
      throw new ConflictException({ mensaje: 'Revisá los datos marcados.', campos: { email: 'Ya hay una persona con ese email.' } });
    }
    const clave = claveTemporal();
    const u = await this.prisma.usuario.create({ data: { ...d, passwordHash: await hashClave(clave), debeCambiarClave: true } });
    return { usuario: aVista(u), claveTemporal: clave };
  }

  @Patch(':id')
  async editar(@Param('id') id: string, @Body() d: EditarUsuarioDto, @Sesion() s: SesionActual): Promise<UsuarioAdmin> {
    const u = await this.usuario(id);
    if (u.id === s.usuario.id && (d.activo === false || (d.rol && d.rol !== 'administrador'))) {
      throw new BadRequestException({ mensaje: 'No podés darte de baja ni sacarte el rol de administrador a vos mismo.' });
    }
    const actualizado = await this.prisma.usuario.update({ where: { id }, data: d });
    // Cambios de acceso: las sesiones abiertas se cierran para que valgan ya.
    if ((d.rol && d.rol !== u.rol) || d.activo === false) await this.auth.cerrarSesionesDe(id);
    return aVista(actualizado);
  }

  @Post(':id/clave')
  @HttpCode(200)
  async reiniciarClave(@Param('id') id: string): Promise<ClaveTemporal> {
    await this.usuario(id);
    const clave = claveTemporal();
    const u = await this.prisma.usuario.update({ where: { id }, data: { passwordHash: await hashClave(clave), debeCambiarClave: true } });
    await this.auth.cerrarSesionesDe(id);
    return { usuario: aVista(u), claveTemporal: clave };
  }

  /** Para quien perdió el celular: vuelve a configurar el 2FA en el próximo ingreso. */
  @Post(':id/2fa/reiniciar')
  @HttpCode(200)
  async reiniciar2fa(@Param('id') id: string): Promise<UsuarioAdmin> {
    await this.usuario(id);
    const u = await this.prisma.usuario.update({ where: { id }, data: { totpActivo: false, totpSecreto: null } });
    await this.auth.cerrarSesionesDe(id);
    return aVista(u);
  }

  private async usuario(id: string) {
    const u = await this.prisma.usuario.findUnique({ where: { id } });
    if (!u) throw new NotFoundException({ mensaje: 'No encontramos a esa persona.' });
    return u;
  }
}
