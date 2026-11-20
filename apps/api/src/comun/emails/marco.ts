// Marco y piezas visuales de los emails: tablas con estilos inline, una columna
// de 560 px como máximo, sin CSS externo ni SVG (los clientes de correo no los respetan).
import { escapar } from '../email.service.js';

// Paleta oficial del Manual de Identidad Visual (azul noche en lugar de negro).
export const COLOR = {
  fondo: '#0d1f2d',
  texto: '#ffffff',
  gris: '#c9d3dc',
  verde: '#a0d062',
  bloque: '#18324a',
  azul: '#0a6cac',
} as const;

const FUENTE = 'Arial,Helvetica,sans-serif';

/** Envuelve el contenido con el logo, el pie y la franja final. `pie` ya viene escapado. */
export function marco(contenido: string, d: { sitioUrl: string; pie: string }) {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"></head>
<body style="margin:0;padding:0;background:#faf7f0">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#faf7f0"><tr><td align="center" style="padding:20px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.fondo}" style="max-width:560px;background:${COLOR.fondo};border-radius:20px;overflow:hidden;font-family:${FUENTE};color:${COLOR.texto}">
<tr><td align="center" style="padding:32px 28px 8px">
<img src="${d.sitioUrl}/logo-email.png" width="64" height="64" alt="Centro Cristiano Vida Capital" style="display:block;margin:0 auto 14px;border:0">
<div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${COLOR.gris}">Centro Cristiano Vida Capital</div>
</td></tr>
${contenido}
<tr><td align="center" style="padding:8px 28px 24px;font-size:12px;line-height:1.5;color:${COLOR.gris}">${d.pie}</td></tr>
<tr><td align="center" bgcolor="${COLOR.azul}" style="background:${COLOR.azul};padding:14px;font-size:15px;font-weight:700;color:${COLOR.texto}">Hay lugar para ti.</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

/** Título grande con una bajada opcional. Ambos ya vienen escapados. */
export const titulo = (texto: string, bajada = '') =>
  `<tr><td align="center" style="padding:4px 28px 16px">
<div style="font-size:26px;line-height:1.2;font-weight:900;margin:8px 0 4px;color:${COLOR.texto}">${texto}</div>${
    bajada ? `<div style="font-size:15px;line-height:1.4;color:${COLOR.gris}">${bajada}</div>` : ''
  }
</td></tr>`;

/** Párrafo de texto. Ya viene escapado. */
export const parrafo = (html: string) =>
  `<tr><td style="padding:0 28px 16px;font-size:15px;line-height:1.55;color:${COLOR.texto}">${html}</td></tr>`;

/** Recuadro oscuro para datos que hay que destacar. Ya viene escapado. */
export const bloque = (html: string) =>
  `<tr><td style="padding:4px 28px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td bgcolor="${COLOR.bloque}" style="background:${COLOR.bloque};border-radius:12px;padding:18px 20px;font-size:15px;line-height:1.6;color:${COLOR.texto}">${html}</td></tr></table></td></tr>`;

/** Versículo centrado con comillas grandes verdes y sin borde lateral. */
export const versiculo = (v: { texto: string; cita: string }) =>
  `<tr><td style="padding:4px 28px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" bgcolor="${COLOR.bloque}" style="background:${COLOR.bloque};border-radius:12px;padding:20px">
<div style="font-size:44px;line-height:44px;font-weight:900;color:${COLOR.verde}">&ldquo;</div>
<div style="font-size:18px;line-height:1.45;font-style:italic;color:${COLOR.texto}">${escapar(v.texto)}</div>
<div style="margin-top:10px;font-size:15px;font-weight:700;color:${COLOR.verde}">${escapar(v.cita)}</div>
</td></tr></table></td></tr>`;

/** Botón redondeado verde con texto azul noche. La celda lleva `bgcolor` para los clientes que ignoran el CSS. */
export const boton = (texto: string, url: string) =>
  `<tr><td align="center" style="padding:4px 28px 24px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td align="center" bgcolor="${COLOR.verde}" style="background:${COLOR.verde};border-radius:999px"><a href="${escapar(url)}" style="display:inline-block;background:${COLOR.verde};color:#0d1f2d;font-weight:700;font-size:15px;text-decoration:none;padding:12px 24px;border-radius:999px">${escapar(texto)}</a></td></tr></table></td></tr>`;
