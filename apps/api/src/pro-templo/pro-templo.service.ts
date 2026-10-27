import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { EstadoProTemplo, VoucherCreado } from '@ccvida/shared';
import { EmailService, escapar, plantilla } from '../comun/email.service.js';
import { ErrorDeFormulario } from '../comun/validacion.js';
import { config } from '../config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CrearVoucherDto } from './crear-voucher.dto.js';
import { calcularEstado, estadoVisible, instruccionesDePago, nombrePublico, numeroVoucher } from './reglas.js';

const SLUG_CAMPANA = 'pro-templo';
const CACHE_MS = 10_000;
const ULTIMOS = 5;

@Injectable()
export class ProTemploService {
  private readonly log = new Logger(ProTemploService.name);
  private cache: { hasta: number; estado: EstadoProTemplo } | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
  ) {}

  private async campana() {
    const campana = await this.prisma.campana.findUnique({ where: { slug: SLUG_CAMPANA } });
    if (!campana || !campana.activa) throw new ServiceUnavailableException({ mensaje: 'La campaña Pro Templo no está activa.' });
    return campana;
  }

  async estado(): Promise<EstadoProTemplo> {
    if (this.cache && this.cache.hasta > Date.now()) return this.cache.estado;

    const campana = await this.campana();
    const confirmados = { campanaId: campana.id, estado: 'confirmado' as const };
    const [suma, ajustes, personas, ultimos] = await Promise.all([
      this.prisma.voucher.aggregate({ where: confirmados, _sum: { montoUsd: true } }),
      this.prisma.ajusteCampana.aggregate({ where: { campanaId: campana.id }, _sum: { montoUsd: true } }),
      this.prisma.voucher.count({ where: confirmados }),
      this.prisma.voucher.findMany({
        where: confirmados,
        orderBy: { confirmadoEn: 'desc' },
        take: ULTIMOS,
        select: { nombre: true, mostrarComo: true, apodo: true, apodoAprobado: true, montoUsd: true },
      }),
    ]);

    const estado = calcularEstado(campana, {
      confirmadoUsd: suma._sum.montoUsd ?? 0,
      ajustesUsd: ajustes._sum.montoUsd ?? 0,
      personas,
      ultimos: ultimos.map((v) => ({ nombre: nombrePublico(v), montoUsd: v.montoUsd })),
    });
    this.cache = { hasta: Date.now() + CACHE_MS, estado };
    return estado;
  }

  /** Lo llama el panel cuando tesorería confirma, anula o ajusta. */
  invalidarEstado() {
    this.cache = null;
  }

  async crearVoucher(datos: CrearVoucherDto): Promise<VoucherCreado> {
    const campana = await this.campana();
    if (datos.montoUsd > campana.montoMaximoUsd) {
      throw new ErrorDeFormulario({ montoUsd: `El monto máximo por voucher es USD ${campana.montoMaximoUsd.toLocaleString('es-AR')}.` });
    }
    if (!campana.formasPagoActivas.includes(datos.formaPago)) {
      throw new ErrorDeFormulario({ formaPago: 'Esa forma de pago no está disponible por ahora.' });
    }

    const voucher = await this.prisma.voucher.create({
      data: {
        campanaId: campana.id,
        montoUsd: datos.montoUsd,
        nombre: datos.nombre,
        mostrarComo: datos.mostrarComo,
        apodo: datos.mostrarComo === 'apodo' ? datos.apodo : null,
        contactoTipo: datos.contactoTipo,
        contacto: datos.contacto,
        formaPago: datos.formaPago,
        mensaje: datos.mensaje || null,
      },
    });

    const configuracion = await this.prisma.configuracion.findUnique({ where: { id: 1 } });
    const instrucciones = instruccionesDePago(voucher.formaPago, voucher.numero, configuracion?.datosTransferencia ?? '');
    this.avisar(voucher.numero, datos, instrucciones);

    return {
      numero: voucher.numero,
      montoUsd: voucher.montoUsd,
      formaPago: voucher.formaPago,
      estado: voucher.estado,
      instrucciones,
    };
  }

  // Los emails salen en segundo plano: el voucher ya quedó guardado.
  private avisar(numero: number, datos: CrearVoucherDto, instrucciones: string) {
    const n = numeroVoucher(numero);
    const link = `${config.sitioUrl}/pro-templo/voucher/${n}`;
    if (datos.contactoTipo === 'email') {
      void this.email.enviar(
        datos.contacto,
        `Tu voucher Pro Templo Nº ${n}`,
        plantilla(`¡Gracias, ${datos.nombre.split(' ')[0]}!`, [
          `Registramos tu voucher <strong>Nº ${n}</strong> de <strong>USD ${datos.montoUsd.toLocaleString('es-AR')}</strong>. Está pendiente de pago y suma a la pared cuando tesorería lo confirme.`,
          escapar(instrucciones).replace(/\n/g, '<br>'),
          `Podés ver el estado de tu voucher acá: <a href="${link}">${link}</a>`,
        ]),
      );
    }
    void this.email.enviar(
      config.emailTesoreria,
      `Voucher nuevo Nº ${n} · USD ${datos.montoUsd}`,
      plantilla(`Voucher nuevo Nº ${n}`, [
        `${escapar(datos.nombre)} pidió un voucher de USD ${datos.montoUsd} para pagar por ${datos.formaPago}.`,
        `Contacto (${datos.contactoTipo}): ${escapar(datos.contacto)}`,
        datos.mensaje ? `Mensaje: ${escapar(datos.mensaje)}` : 'Sin mensaje.',
      ]),
    );
    this.log.log(`Voucher Nº ${n} creado por USD ${datos.montoUsd}`);
  }

  /** Estado público de un voucher: sin nombre ni contacto. */
  async consultarVoucher(numero: number) {
    const campana = await this.campana();
    const v = await this.prisma.voucher.findUnique({
      where: { numero },
      select: { numero: true, montoUsd: true, estado: true, formaPago: true, creado: true, reactivadoEn: true },
    });
    if (!v) throw new NotFoundException({ mensaje: 'No encontramos un voucher con ese número.' });
    const configuracion = await this.prisma.configuracion.findUnique({ where: { id: 1 } });
    const estado = estadoVisible(v, campana.diasVencimiento);
    return {
      numero: v.numero,
      montoUsd: v.montoUsd,
      estado,
      formaPago: v.formaPago,
      creado: v.creado.toISOString(),
      instrucciones: estado === 'pendiente' ? instruccionesDePago(v.formaPago, v.numero, configuracion?.datosTransferencia ?? '') : null,
    };
  }
}
