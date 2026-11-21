# Probar mails desde el panel — diseño

Fecha: 2026-11-21 · Estado: aprobado por Franyer

## Por qué

Hoy los errores de envío (Resend rechaza, falta `RESEND_API_KEY`) solo quedan en el log
del contenedor de la API: los formularios de la web responden "listo" igual. No hay forma
fácil de saber si los mails salen ni de ver cómo le llega cada uno a la gente.

## Objetivos

- Comprobar desde el panel que la configuración de mails funciona y, si falla, ver el error exacto.
- Mandarse cualquiera de los 5 mails reales para ver cómo se ven en una casilla de verdad.

## No objetivos

- Editar las plantillas desde el panel.
- Historial de envíos o métricas de entrega.
- Cambiar cómo envían los formularios de la web (siguen sin frenarse si el mail falla).

## Anti-objetivos

- Que el endpoint sirva para mandar mails masivos o a cualquiera sin control.
- Mostrar secretos (la clave de Resend nunca sale de la API).

## Enfoques considerados

1. **Pantalla con selector de mail + destinatario (elegido).** Cubre las dos necesidades.
2. Solo un mail genérico de prueba: no deja ver los 5 mails reales.
3. Vista previa del HTML en el panel sin enviar: no prueba que salga ni que llegue.

## Diseño

**Panel (Angular):** ruta `probar-mails`, solo rol `administrador`, entrada en el menú del marco.
- Bloque "Configuración": Resend conectado o no, remitente (`EMAIL_FROM`), emails de
  recepción y tesorería (o "sin cargar").
- Formulario: selector con los 5 mails (bienvenida a una visita, aviso a recepción,
  voucher registrado, aviso a tesorería, ladrillo confirmado) y destinatario, que viene
  con el email del usuario logueado.
- Botón "Mandar prueba" y resultado en el momento: enviado (con id de Resend) o el error
  exacto.

**API (NestJS):**
- `GET admin/emails/prueba`: estado de la configuración (sin la clave).
- `POST admin/emails/prueba` `{ plantilla, para }`: arma el mail con los textos reales
  del sitio (dirección, versículo, datos de transferencia, URLs) y datos de ejemplo
  ("María Prueba", voucher Nº 0000); asunto con prefijo "[Prueba] "; envía esperando el
  resultado. Solo `administrador`, un destinatario válido, límite de pocos envíos por minuto.
- `EmailService` gana un método que devuelve el resultado (`{ ok, id }` o
  `{ ok: false, error }`); `enviar` sigue igual para los formularios (lo usa por dentro).

## Lo que queda al implementador

- Nombre exacto de los DTO/tipos compartidos en `@ccvida/shared`.
- Cifra del límite de envíos (propuesta: 5 por minuto por usuario).
- Ubicación del ítem en el menú del panel.
