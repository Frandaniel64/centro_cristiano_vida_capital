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

// GET /api/vouchers/:numero (sin nombre ni contacto)
export interface VoucherPublico {
  numero: number;
  montoUsd: number;
  estado: EstadoVoucher;
  formaPago: FormaPago;
  creado: string;
  // Solo mientras está pendiente.
  instrucciones: string | null;
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

// ── Panel ──

export interface UsuarioPanel {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  totpActivo: boolean;
  debeCambiarClave: boolean;
}

// Respuesta de POST /api/auth/ingresar y /api/auth/codigo.
// "codigo": falta el código 2FA. "configurar-2fa": el rol lo exige y todavía no lo activó.
export type PasoIngreso =
  | { paso: 'listo'; usuario: UsuarioPanel }
  | { paso: 'codigo' }
  | { paso: 'configurar-2fa' };

export interface Configuracion2fa {
  secreto: string;
  // Imagen del código QR como data URL.
  qr: string;
}

export interface Pagina<T> {
  items: T[];
  total: number;
}

// GET /api/admin/resumen: cada bloque viene solo si el rol lo puede ver.
export interface ResumenPanel {
  proTemplo?: EstadoProTemplo & { pendientes: number; apodosPorRevisar: number };
  visitas?: { nuevas: number; ultimaSemana: number };
}

export interface VoucherAdmin {
  id: string;
  numero: number;
  montoUsd: number;
  nombre: string;
  mostrarComo: MostrarComo;
  apodo: string | null;
  apodoAprobado: boolean;
  contactoTipo: ContactoTipo;
  contacto: string;
  formaPago: FormaPago;
  mensaje: string | null;
  // Estado guardado, salvo los pendientes fuera de plazo, que vienen como "vencido".
  estado: EstadoVoucher;
  montoRecibido: string | null;
  monedaRecibida: 'USD' | 'ARS' | null;
  tipoCambio: string | null;
  nota: string | null;
  confirmadoPor: string | null;
  confirmadoEn: string | null;
  motivoAnulacion: string | null;
  creado: string;
}

export interface ConfirmarVoucher {
  montoRecibido: number;
  monedaRecibida: 'USD' | 'ARS';
  tipoCambio?: number;
  nota?: string;
}

export interface AjusteAdmin {
  id: string;
  montoUsd: number;
  motivo: string;
  cargadoPor: string;
  creado: string;
}

export interface CampanaAdmin {
  metaUsd: number;
  montoMaximoUsd: number;
  mostrarMontos: boolean;
  mensajeMetaCumplida: string | null;
  montosSugeridos: number[];
  formasPagoActivas: FormaPago[];
  diasVencimiento: number;
}

export type EstadoVisita = 'nueva' | 'contactada' | 'vino';

export interface VisitaAdmin {
  id: string;
  nombre: string;
  contactoTipo: ContactoTipo;
  contacto: string;
  intereses: string[];
  estado: EstadoVisita;
  notas: string | null;
  atendidoPor: string | null;
  creado: string;
}

export interface UsuarioAdmin extends UsuarioPanel {
  activo: boolean;
  ultimoIngreso: string | null;
  creado: string;
}

// Respuesta al crear un usuario o reiniciar su clave: la temporal se muestra una sola vez.
export interface ClaveTemporal {
  usuario: UsuarioAdmin;
  claveTemporal: string;
}

// Respuesta de error de la API para formularios.
export interface ErrorApi {
  mensaje: string;
  campos?: Record<string, string>;
}
