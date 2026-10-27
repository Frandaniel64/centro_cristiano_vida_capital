// Variables de entorno de la API. Las opcionales tienen un comportamiento de
// desarrollo: sin Resend los emails se escriben en el log y sin Turnstile no
// se verifica el anti-spam.
export const config = {
  puerto: Number(process.env.PORT ?? 3000),
  origenes: (process.env.CORS_ORIGINS ?? 'http://localhost:4321,http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  sitioUrl: (process.env.SITE_URL ?? 'http://localhost:4321').replace(/\/$/, ''),
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  emailDe: process.env.EMAIL_FROM ?? 'CCVida Capital <hola@ccvida.com.ar>',
  // Quién recibe los avisos internos. Vacío: no se avisa.
  emailRecepcion: process.env.RECEPCION_EMAIL ?? '',
  emailTesoreria: process.env.TESORERIA_EMAIL ?? '',
  turnstileSecreto: process.env.TURNSTILE_SECRET_KEY ?? '',
  // Cookie de sesión del panel. Con panel y API en subdominios del mismo
  // dominio alcanza "lax"; si están en dominios distintos (demo), "none".
  cookie: {
    nombre: 'ccvida_sesion',
    segura: (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true',
    sameSite: (process.env.COOKIE_SAMESITE ?? 'lax') as 'lax' | 'strict' | 'none',
    dominio: process.env.COOKIE_DOMAIN || undefined,
  },
};
