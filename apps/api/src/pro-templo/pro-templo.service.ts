import { Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { EstadoProTemplo, VoucherCreado } from '@ccvida/shared';
import { EmailService } from '../comun/email.service.js';
import { ContenidoService } from '../contenido/contenido.service.js';
import { avisoTesoreria, voucherRegistrado } from '../comun/emails/plantillas.js';
import { ErrorDeFormulario } from '../comun/validacion.js';
import { config } from '../config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CrearVoucherDto } from './crear-voucher.dto.js';
import { calcularEstado, estadoVisible, instruccionesDePago, instruccionesEnTexto, nombrePublico, numeroVoucher } from './reglas.js';

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
    private readonly contenido: ContenidoService,
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
        // El email es el contacto principal; el WhatsApp, opcional, va aparte.
        contactoTipo: 'email',
        contacto: datos.email,
        whatsapp: datos.whatsapp || null,
        formaPago: datos.formaPago,
        mensaje: datos.mensaje || null,
      },
    });

    const configuracion = await this.prisma.configuracion.findUnique({ where: { id: 1 } });
    const datosTransferencia = configuracion?.datosTransferencia ?? '';
    void this.avisar(voucher.numero, datos, datosTransferencia);

    return {
      numero: voucher.numero,
      montoUsd: voucher.montoUsd,
      formaPago: voucher.formaPago,
      estado: voucher.estado,
      instrucciones: instruccionesEnTexto(instruccionesDePago(voucher.formaPago, voucher.numero, datosTransferencia)),
    };
  }

  // Los emails salen en segundo plano: el voucher ya quedó guardado. Las
  // direcciones de tesorería se leen en cada envío.
  private async avisar(numero: number, datos: CrearVoucherDto, datosTransferencia: string) {
    try {
      const { direccion } = await this.contenido.textos();
      const tesoreria = config.emailTesoreria.trim();
      const persona = voucherRegistrado({
        nombre: datos.nombre,
        numero,
        montoUsd: datos.montoUsd,
        formaPago: datos.formaPago,
        datosTransferencia,
        sitioUrl: config.sitioUrl,
        direccion,
      });
      // Si la persona responde (comprobante, dudas), le llega a tesorería.
      void this.email.enviar(datos.email, persona.asunto, persona.html, tesoreria ? { responderA: tesoreria } : {});
      if (tesoreria) {
        const aviso = avisoTesoreria({
          nombre: datos.nombre,
          numero,
          montoUsd: datos.montoUsd,
          formaPago: datos.formaPago,
          email: datos.email,
          whatsapp: datos.whatsapp || null,
          panelUrl: config.panelUrl,
          sitioUrl: config.sitioUrl,
        });
        void this.email.enviar(tesoreria, aviso.asunto, aviso.html);
      }
      this.log.log(`Voucher Nº ${numeroVoucher(numero)} creado por USD ${datos.montoUsd}`);
    } catch (e) {
      this.log.error(`No se pudieron armar los emails del voucher Nº ${numeroVoucher(numero)}`, e as Error);
    }
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
      instrucciones:
        estado === 'pendiente' ? instruccionesEnTexto(instruccionesDePago(v.formaPago, v.numero, configuracion?.datosTransferencia ?? '')) : null,
    };
  }
}
