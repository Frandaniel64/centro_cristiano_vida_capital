import { BadRequestException, Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Configuracion2fa, PasoIngreso } from '@ccvida/shared';
import { IsEmail, IsString, Length, Matches } from 'class-validator';
import type { Request, Response } from 'express';
import QRCode from 'qrcode';
import { IpThrottlerGuard, ipDe } from '../comun/ip-throttler.guard.js';
import { config } from '../config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AuthService, usuarioPanel, type SesionActual } from './auth.service.js';
import { ErrorDeFormulario } from '../comun/validacion.js';
import { generarSecretoTotp, hashClave, urlTotp, verificarClave, verificarTotp } from './cripto.js';
import { PermitePasoIncompleto, Sesion, SesionGuard, tokenDe } from './sesion.guard.js';

class IngresarDto {
  @IsEmail({}, { message: 'Escribí un email válido.' })
  email!: string;

  @IsString()
  @Length(1, 200, { message: 'Escribí tu contraseña.' })
  clave!: string;
}

class CambiarClaveDto {
  @IsString()
  @Length(1, 200, { message: 'Escribí tu contraseña actual.' })
  actual!: string;

  @IsString()
  @Length(10, 200, { message: 'La contraseña nueva tiene que tener al menos 10 caracteres.' })
  nueva!: string;
}

class CodigoDto {
  @Matches(/^\d{6}$/, { message: 'El código tiene 6 números.' })
  codigo!: string;
}

// Límite de intentos de ingreso (spec): 5 cada 15 minutos por conexión.
const INTENTOS = { default: { limit: 5, ttl: 15 * 60 * 1000 } };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('ingresar')
  @HttpCode(200)
  @UseGuards(IpThrottlerGuard)
  @Throttle(INTENTOS)
  async ingresar(@Body() datos: IngresarDto, @Req() req: Request, @Res({ passthrough: true }) res: Response): Promise<PasoIngreso> {
    const { token, paso } = await this.auth.ingresar(datos.email, datos.clave, ipDe(req));
    res.cookie(config.cookie.nombre, token, {
      httpOnly: true,
      secure: config.cookie.segura,
      sameSite: config.cookie.sameSite,
      domain: config.cookie.dominio,
      path: '/',
      maxAge: 12 * 60 * 60 * 1000,
    });
    return paso;
  }

  @Post('codigo')
  @HttpCode(200)
  @UseGuards(IpThrottlerGuard, SesionGuard)
  @Throttle(INTENTOS)
  @PermitePasoIncompleto()
  codigo(@Body() datos: CodigoDto, @Sesion() sesion: SesionActual) {
    return this.auth.verificarCodigo(sesion, datos.codigo);
  }

  /** Genera un secreto nuevo y su QR. Vale recién cuando se confirma con /2fa/activar. */
  @Post('2fa/iniciar')
  @HttpCode(200)
  @UseGuards(SesionGuard)
  @PermitePasoIncompleto()
  async iniciar2fa(@Sesion() sesion: SesionActual): Promise<Configuracion2fa> {
    if (sesion.usuario.totpActivo) throw new BadRequestException({ mensaje: 'La verificación en dos pasos ya está activa.' });
    const secreto = generarSecretoTotp();
    await this.prisma.usuario.update({ where: { id: sesion.usuario.id }, data: { totpSecreto: secreto } });
    return { secreto, qr: await QRCode.toDataURL(urlTotp(secreto, sesion.usuario.email), { margin: 1, width: 240 }) };
  }

  @Post('2fa/activar')
  @HttpCode(200)
  @UseGuards(IpThrottlerGuard, SesionGuard)
  @Throttle(INTENTOS)
  @PermitePasoIncompleto()
  async activar2fa(@Body() datos: CodigoDto, @Sesion() sesion: SesionActual): Promise<PasoIngreso> {
    const { usuario } = sesion;
    if (!usuario.totpSecreto || !verificarTotp(usuario.totpSecreto, datos.codigo)) {
      throw new BadRequestException({ mensaje: 'El código no coincide. Revisá que la hora del celular esté bien y probá con el código actual.' });
    }
    const actualizado = await this.prisma.usuario.update({ where: { id: usuario.id }, data: { totpActivo: true } });
    await this.auth.completarSesion(sesion);
    return { paso: 'listo', usuario: usuarioPanel(actualizado) };
  }

  @Post('clave')
  @HttpCode(200)
  @UseGuards(IpThrottlerGuard, SesionGuard)
  @Throttle(INTENTOS)
  async cambiarClave(@Body() datos: CambiarClaveDto, @Sesion() sesion: SesionActual) {
    if (!(await verificarClave(datos.actual, sesion.usuario.passwordHash))) {
      throw new ErrorDeFormulario({ actual: 'La contraseña actual no es correcta.' });
    }
    if (datos.nueva === datos.actual) {
      throw new ErrorDeFormulario({ nueva: 'Elegí una contraseña distinta de la actual.' });
    }
    const usuario = await this.prisma.usuario.update({
      where: { id: sesion.usuario.id },
      data: { passwordHash: await hashClave(datos.nueva), debeCambiarClave: false },
    });
    // Cierra las demás sesiones abiertas con la clave anterior.
    await this.prisma.sesion.deleteMany({ where: { usuarioId: usuario.id, id: { not: sesion.sesionId } } });
    return usuarioPanel(usuario);
  }

  @Get('yo')
  @UseGuards(SesionGuard)
  yo(@Sesion() sesion: SesionActual) {
    return usuarioPanel(sesion.usuario);
  }

  @Post('salir')
  @HttpCode(204)
  async salir(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await this.auth.salir(tokenDe(req));
    res.clearCookie(config.cookie.nombre, { path: '/', domain: config.cookie.dominio, sameSite: config.cookie.sameSite, secure: config.cookie.segura });
  }
}
