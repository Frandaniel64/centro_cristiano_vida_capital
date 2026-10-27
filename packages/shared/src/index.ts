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

// ── Contenido (panel, etapa 2) ──

export type EstadoContenido = 'borrador' | 'publicado';
export type Repeticion = 'ninguna' | 'semanal' | 'mensual';

export interface MedioAdmin {
  id: string;
  // Variante más grande; `tamanos` tiene todas por ancho en px.
  url: string;
  tamanos: Record<string, string>;
  textoAlternativo: string;
  credito: string | null;
  ancho: number | null;
  alto: number | null;
  creado: string;
}

/** Foto asociada a un contenido. */
export type FotoRef = Pick<MedioAdmin, 'id' | 'url' | 'tamanos' | 'textoAlternativo'> | null;

interface ContenidoBase {
  id: string;
  slug: string;
  estado: EstadoContenido;
  foto: FotoRef;
  actualizado: string;
}

export interface MinisterioAdmin extends ContenidoBase {
  nombre: string;
  edades: string | null;
  horario: string | null;
  resumen: string | null;
  descripcion: string | null;
  actividades: string[];
  color: string | null;
  orden: number;
}

export interface EventoAdmin extends ContenidoBase {
  titulo: string;
  inicio: string;
  fin: string | null;
  repeticion: Repeticion;
  lugar: string | null;
  resumen: string | null;
  descripcion: string | null;
  ministerioId: string | null;
  destacado: boolean;
  linkInscripcion: string | null;
}

export interface SerieAdmin extends ContenidoBase {
  nombre: string;
  descripcion: string | null;
  predicas: number;
}

export interface PredicaAdmin extends ContenidoBase {
  titulo: string;
  fecha: string; // AAAA-MM-DD
  predicador: string;
  serieId: string | null;
  urlVideo: string | null;
  duracionMin: number | null;
  resumen: string | null;
  versiculos: string[];
  destacada: boolean;
}

/** Lo que se manda al crear o editar: los mismos campos sin id ni fechas, con la foto por id. */
export type Guardar<T extends ContenidoBase> = Omit<T, 'id' | 'foto' | 'actualizado' | 'slug' | 'predicas'> & {
  fotoId: string | null;
  // Vacío: se arma a partir del título o nombre.
  slug?: string;
};

export interface PreguntaFrecuente {
  pregunta: string;
  respuesta: string;
}

/** Textos editables del sitio ("Textos del sitio" en el panel). */
export interface TextosSitio {
  lema: string;
  bajadaInicio: string;
  reunion: string; // "Domingos 10 h"
  direccion: string;
  barrio: string;
  colectivos: string;
  comoLlegar: { titulo: string; texto: string }[];
  agendaDomingo: { hora: string; titulo: string; texto: string }[];
  faqVisita: PreguntaFrecuente[];
  faqProTemplo: PreguntaFrecuente[];
  historia: string;
  datosIglesia: string; // "Más de 150 personas · Desde 2016 · Floresta, CABA"
  pastores: { nombres: string; texto: string; cita: string };
  creemos: { titulo: string; texto: string }[];
  whatsapp: string;
  instagram: string;
  youtube: string;
  facebook: string;
  datosTransferencia: string;
}

// Respuesta de error de la API para formularios.
export interface ErrorApi {
  mensaje: string;
  campos?: Record<string, string>;
}
