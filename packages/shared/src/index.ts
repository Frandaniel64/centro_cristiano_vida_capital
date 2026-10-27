// Tipos compartidos entre la API, el sitio y el panel.

export type Rol = 'administrador' | 'editor' | 'tesoreria' | 'recepcion';

export type EstadoVoucher = 'pendiente' | 'confirmado' | 'anulado' | 'vencido';

export type ContactoTipo = 'whatsapp' | 'email';

export type FormaPago = 'efectivo' | 'transferencia' | 'mercadopago';

export type MostrarComo = 'nombre' | 'apodo' | 'anonimo';

// GET /api/pro-templo/estado
export interface EstadoProTemplo {
  recaudadoUsd: number;
  metaUsd: number;
  porcentaje: number;
  ladrillos: number;
  personas: number;
  // montoUsd es null cuando la iglesia elige no mostrar montos.
  ultimosVouchers: { nombre: string; montoUsd: number | null }[];
}

// POST /api/vouchers
export interface CrearVoucher {
  montoUsd: number;
  nombre: string;
  mostrarComo: MostrarComo;
  apodo?: string;
  contactoTipo: ContactoTipo;
  contacto: string;
  formaPago: FormaPago;
  mensaje?: string;
  aceptaPrivacidad: true;
  turnstileToken?: string;
  // Campo trampa: las personas no lo ven; si llega con valor, es un bot.
  sitioWeb?: string;
}

export interface VoucherCreado {
  numero: number;
  montoUsd: number;
  formaPago: FormaPago;
  estado: EstadoVoucher;
  // Texto listo para mostrar: datos bancarios o cómo pagar en la mesa.
  instrucciones: string;
}

// POST /api/visitas
export interface CrearVisita {
  nombre: string;
  contactoTipo: ContactoTipo;
  contacto: string;
  intereses: string[];
  aceptaPrivacidad: true;
  turnstileToken?: string;
  sitioWeb?: string;
}

// Respuesta de error de la API para formularios.
export interface ErrorApi {
  mensaje: string;
  campos?: Record<string, string>;
}
