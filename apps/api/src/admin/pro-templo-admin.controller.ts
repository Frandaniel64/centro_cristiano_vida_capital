import { BadRequestException, Body, Controller, Get, HttpCode, NotFoundException, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import type { AjusteAdmin, CampanaAdmin, EstadoVoucher, FormaPago, Pagina, VoucherAdmin } from '@ccvida/shared';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Length, Max, MaxLength, Min, NotEquals } from 'class-validator';
import type { SesionActual } from '../auth/auth.service.js';
import { Roles, Sesion, SesionGuard } from '../auth/sesion.guard.js';
import type { Prisma, Voucher } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProTemploService } from '../pro-templo/pro-templo.service.js';
import { estadoVisible } from '../pro-templo/reglas.js';
import { apodosPorRevisar, fueraDePlazo, pendientesEnPlazo } from './filtros.js';

const SLUG_CAMPANA = 'pro-templo';
const POR_PAGINA = 25;

class FiltroVouchers {
  @IsOptional() @IsIn(['pendiente', 'confirmado', 'anulado', 'vencido', 'apodos']) estado?: EstadoVoucher | 'apodos';
  @IsOptional() @IsIn(['efectivo', 'transferencia', 'mercadopago']) formaPago?: FormaPago;
  // Busca por número, nombre o contacto.
  @IsOptional() @IsString() @MaxLength(100) q?: string;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) pagina?: number;
}

class ConfirmarDto {
  @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Escribí el monto recibido.' }) @IsPositive({ message: 'El monto tiene que ser mayor a cero.' }) montoRecibido!: number;
  @IsIn(['USD', 'ARS'], { message: 'Elegí la moneda.' }) monedaRecibida!: 'USD' | 'ARS';
  @IsOptional() @Type(() => Number) @IsNumber({ maxDecimalPlaces: 2 }) @IsPositive({ message: 'El tipo de cambio tiene que ser mayor a cero.' }) tipoCambio?: number;
  @IsOptional() @IsString() @MaxLength(500) nota?: string;
}

class AnularDto {
  @IsString() @Length(3, 300, { message: 'Contá brevemente por qué se anula.' }) motivo!: string;
}

class ApodoDto {
  @IsBoolean() aprobado!: boolean;
}

class AjusteDto {
  @Type(() => Number) @IsInt({ message: 'El ajuste va en dólares, sin centavos.' }) @NotEquals(0, { message: 'El ajuste no puede ser cero.' }) @Min(-100_000) @Max(100_000) montoUsd!: number;
  @IsString() @Length(3, 300, { message: 'Contá de dónde sale este ajuste.' }) motivo!: string;
}

class CampanaDto implements Partial<CampanaAdmin> {
  @IsOptional() @IsInt() @Min(100, { message: 'La meta mínima es USD 100.' }) metaUsd?: number;
  @IsOptional() @IsInt() @Min(1) montoMaximoUsd?: number;
  @IsOptional() @IsBoolean() mostrarMontos?: boolean;
  @IsOptional() @IsString() @MaxLength(500) mensajeMetaCumplida?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(8) @IsInt({ each: true }) @Min(1, { each: true }) montosSugeridos?: number[];
  @IsOptional() @IsArray() @IsIn(['efectivo', 'transferencia', 'mercadopago'], { each: true }) formasPagoActivas?: FormaPago[];
  @IsOptional() @IsInt() @Min(1) @Max(365) diasVencimiento?: number;
}

@Controller('admin')
@UseGuards(SesionGuard)
@Roles('administrador', 'tesoreria')
export class ProTemploAdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly proTemplo: ProTemploService,
  ) {}

  private async campana() {
    const campana = await this.prisma.campana.findUnique({ where: { slug: SLUG_CAMPANA } });
    if (!campana) throw new NotFoundException({ mensaje: 'No existe la campaña Pro Templo. Corré el seed.' });
    return campana;
  }

  private aVista(v: Voucher & { confirmadoPor: { nombre: string } | null }, diasVencimiento: number): VoucherAdmin {
    return {
      id: v.id,
      numero: v.numero,
      montoUsd: v.montoUsd,
      nombre: v.nombre,
      mostrarComo: v.mostrarComo,
      apodo: v.apodo,
      apodoAprobado: v.apodoAprobado,
      contactoTipo: v.contactoTipo,
      contacto: v.contacto,
      formaPago: v.formaPago,
      mensaje: v.mensaje,
      estado: estadoVisible(v, diasVencimiento),
      montoRecibido: v.montoRecibido?.toString() ?? null,
      monedaRecibida: v.monedaRecibida,
      tipoCambio: v.tipoCambio?.toString() ?? null,
      nota: v.nota,
      confirmadoPor: v.confirmadoPor?.nombre ?? null,
      confirmadoEn: v.confirmadoEn?.toISOString() ?? null,
      motivoAnulacion: v.motivoAnulacion,
      creado: v.creado.toISOString(),
    };
  }

  @Get('vouchers')
  async listar(@Query() f: FiltroVouchers): Promise<Pagina<VoucherAdmin>> {
    const campana = await this.campana();
    const porEstado: Record<string, Prisma.VoucherWhereInput> = {
      pendiente: pendientesEnPlazo(campana.diasVencimiento),
      vencido: { estado: 'pendiente', ...fueraDePlazo(campana.diasVencimiento) },
      confirmado: { estado: 'confirmado' },
      anulado: { estado: 'anulado' },
      apodos: apodosPorRevisar,
    };
    const q = f.q?.trim();
    const numero = q && /^\d+$/.test(q) ? Number(q) : undefined;
    // Cada filtro va en su propio elemento de AND: varios usan OR y no se pueden mezclar en un objeto.
    const where: Prisma.VoucherWhereInput = {
      AND: [
        { campanaId: campana.id },
        f.estado ? porEstado[f.estado] : {},
        f.formaPago ? { formaPago: f.formaPago } : {},
        q
          ? { OR: [...(numero ? [{ numero }] : []), { nombre: { contains: q, mode: 'insensitive' } }, { contacto: { contains: q, mode: 'insensitive' } }] }
          : {},
      ],
    };
    const pagina = f.pagina ?? 1;
    const [items, total] = await Promise.all([
      this.prisma.voucher.findMany({
        where,
        orderBy: { numero: 'desc' },
        skip: (pagina - 1) * POR_PAGINA,
        take: POR_PAGINA,
        include: { confirmadoPor: { select: { nombre: true } } },
      }),
      this.prisma.voucher.count({ where }),
    ]);
    return { items: items.map((v) => this.aVista(v, campana.diasVencimiento)), total };
  }

  private async voucher(numero: number) {
    const v = await this.prisma.voucher.findUnique({ where: { numero } });
    if (!v) throw new NotFoundException({ mensaje: `No existe el voucher Nº ${numero}.` });
    return v;
  }

  private async devolver(numero: number) {
    const campana = await this.campana();
    this.proTemplo.invalidarEstado();
    const v = await this.prisma.voucher.findUniqueOrThrow({ where: { numero }, include: { confirmadoPor: { select: { nombre: true } } } });
    return this.aVista(v, campana.diasVencimiento);
  }

  /** Tesorería registra que entró la plata: el voucher pasa a sumar en el contador. */
  @Post('vouchers/:numero/confirmar')
  @HttpCode(200)
  async confirmar(@Param('numero', ParseIntPipe) numero: number, @Body() d: ConfirmarDto, @Sesion() s: SesionActual) {
    const v = await this.voucher(numero);
    if (v.estado === 'confirmado') throw new BadRequestException({ mensaje: 'Este voucher ya está confirmado.' });
    if (v.estado === 'anulado') throw new BadRequestException({ mensaje: 'Un voucher anulado no se puede confirmar. Reactivalo primero.' });
    if (d.monedaRecibida === 'ARS' && !d.tipoCambio) {
      throw new BadRequestException({ mensaje: 'Revisá los datos marcados.', campos: { tipoCambio: 'Si se pagó en pesos, cargá el tipo de cambio.' } });
    }
    await this.prisma.voucher.update({
      where: { numero },
      data: {
        estado: 'confirmado',
        montoRecibido: d.montoRecibido,
        monedaRecibida: d.monedaRecibida,
        tipoCambio: d.monedaRecibida === 'ARS' ? d.tipoCambio : null,
        nota: d.nota || null,
        confirmadoPorId: s.usuario.id,
        confirmadoEn: new Date(),
        actualizadoPorId: s.usuario.id,
      },
    });
    return this.devolver(numero);
  }

  @Post('vouchers/:numero/anular')
  @HttpCode(200)
  async anular(@Param('numero', ParseIntPipe) numero: number, @Body() d: AnularDto, @Sesion() s: SesionActual) {
    const v = await this.voucher(numero);
    if (v.estado === 'anulado') throw new BadRequestException({ mensaje: 'Este voucher ya está anulado.' });
    await this.prisma.voucher.update({
      where: { numero },
      data: { estado: 'anulado', motivoAnulacion: d.motivo, actualizadoPorId: s.usuario.id },
    });
    return this.devolver(numero);
  }

  /** Vuelve a pendiente un vencido o anulado; el plazo arranca de nuevo. */
  @Post('vouchers/:numero/reactivar')
  @HttpCode(200)
  async reactivar(@Param('numero', ParseIntPipe) numero: number, @Sesion() s: SesionActual) {
    const v = await this.voucher(numero);
    if (v.estado === 'confirmado') throw new BadRequestException({ mensaje: 'Un voucher confirmado no se reactiva.' });
    await this.prisma.voucher.update({
      where: { numero },
      data: { estado: 'pendiente', reactivadoEn: new Date(), motivoAnulacion: null, actualizadoPorId: s.usuario.id },
    });
    return this.devolver(numero);
  }

  /** Aprobar muestra el apodo en la web; rechazar lo pasa a anónimo. */
  @Post('vouchers/:numero/apodo')
  @HttpCode(200)
  async revisarApodo(@Param('numero', ParseIntPipe) numero: number, @Body() d: ApodoDto, @Sesion() s: SesionActual) {
    const v = await this.voucher(numero);
    if (v.mostrarComo !== 'apodo') throw new BadRequestException({ mensaje: 'Este voucher no pidió aparecer con apodo.' });
    await this.prisma.voucher.update({
      where: { numero },
      data: d.aprobado ? { apodoAprobado: true, actualizadoPorId: s.usuario.id } : { mostrarComo: 'anonimo', apodoAprobado: false, actualizadoPorId: s.usuario.id },
    });
    return this.devolver(numero);
  }

  @Get('ajustes')
  async ajustes(): Promise<AjusteAdmin[]> {
    const campana = await this.campana();
    const ajustes = await this.prisma.ajusteCampana.findMany({
      where: { campanaId: campana.id },
      orderBy: { creado: 'desc' },
      include: { cargadoPor: { select: { nombre: true } } },
    });
    return ajustes.map((a) => ({ id: a.id, montoUsd: a.montoUsd, motivo: a.motivo, cargadoPor: a.cargadoPor.nombre, creado: a.creado.toISOString() }));
  }

  /** Plata que entró sin voucher (por ejemplo, lo juntado antes del sitio). Queda registrado quién y por qué. */
  @Post('ajustes')
  async crearAjuste(@Body() d: AjusteDto, @Sesion() s: SesionActual): Promise<AjusteAdmin> {
    const campana = await this.campana();
    const a = await this.prisma.ajusteCampana.create({
      data: { campanaId: campana.id, montoUsd: d.montoUsd, motivo: d.motivo, cargadoPorId: s.usuario.id },
    });
    this.proTemplo.invalidarEstado();
    return { id: a.id, montoUsd: a.montoUsd, motivo: a.motivo, cargadoPor: s.usuario.nombre, creado: a.creado.toISOString() };
  }

  @Get('campana')
  async verCampana(): Promise<CampanaAdmin> {
    const c = await this.campana();
    return {
      metaUsd: c.metaUsd,
      montoMaximoUsd: c.montoMaximoUsd,
      mostrarMontos: c.mostrarMontos,
      mensajeMetaCumplida: c.mensajeMetaCumplida,
      montosSugeridos: c.montosSugeridos,
      formasPagoActivas: c.formasPagoActivas,
      diasVencimiento: c.diasVencimiento,
    };
  }

  @Patch('campana')
  async editarCampana(@Body() d: CampanaDto, @Sesion() s: SesionActual): Promise<CampanaAdmin> {
    if (d.formasPagoActivas && d.formasPagoActivas.length === 0) {
      throw new BadRequestException({ mensaje: 'Revisá los datos marcados.', campos: { formasPagoActivas: 'Dejá al menos una forma de pago activa.' } });
    }
    await this.prisma.campana.update({ where: { slug: SLUG_CAMPANA }, data: { ...d, actualizadoPorId: s.usuario.id } });
    this.proTemplo.invalidarEstado();
    return this.verCampana();
  }
}
