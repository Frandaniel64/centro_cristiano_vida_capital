import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UnauthorizedException, createParamDecorator } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Rol } from '@ccvida/shared';
import type { Request } from 'express';
import { config } from '../config.js';
import { AuthService, type SesionActual } from './auth.service.js';

const CLAVE_ROLES = 'roles';
const CLAVE_PASO_INCOMPLETO = 'pasoIncompleto';

/** Roles que pueden usar el endpoint. Sin @Roles alcanza con tener sesión. */
export const Roles = (...roles: Rol[]) => SetMetadata(CLAVE_ROLES, roles);

/** Endpoints del segundo paso del ingreso: aceptan una sesión a la que le falta el 2FA. */
export const PermitePasoIncompleto = () => SetMetadata(CLAVE_PASO_INCOMPLETO, true);

type RequestConSesion = Request & { sesion?: SesionActual };

export const tokenDe = (req: Request): string | undefined => req.cookies?.[config.cookie.nombre];

export const Sesion = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<RequestConSesion>().sesion!);

@Injectable()
export class SesionGuard implements CanActivate {
  constructor(
    private readonly auth: AuthService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<RequestConSesion>();
    const sesion = await this.auth.sesionDesdeToken(tokenDe(req));
    if (!sesion) throw new UnauthorizedException({ mensaje: 'Tu sesión venció. Ingresá de nuevo.' });

    const objetivos = [ctx.getHandler(), ctx.getClass()];
    if (!sesion.completa && !this.reflector.getAllAndOverride<boolean>(CLAVE_PASO_INCOMPLETO, objetivos)) {
      throw new UnauthorizedException({ mensaje: 'Falta el código de verificación.' });
    }
    const roles = this.reflector.getAllAndOverride<Rol[] | undefined>(CLAVE_ROLES, objetivos);
    if (roles && !roles.includes(sesion.usuario.rol)) {
      throw new ForbiddenException({ mensaje: 'Tu rol no tiene acceso a esta sección.' });
    }
    req.sesion = sesion;
    return true;
  }
}
