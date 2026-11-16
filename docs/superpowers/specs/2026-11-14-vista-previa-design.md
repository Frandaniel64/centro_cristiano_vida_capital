# Vista previa de borradores desde el panel

Fecha: 2026-11-14 · Rama: `feat/vista-previa`

## Para qué

Quien carga contenido en el panel quiere ver **cómo va a quedar un borrador en la web real** antes
de publicarlo: la página de un ministerio, un evento o una prédica con su texto, foto y colores.
Hoy no hay forma: la web solo muestra lo publicado y, además, con `EN_CONSTRUCCION=true` no se ve
nada.

## Objetivos

- Botón **"Vista previa"** en el panel, en ministerios, eventos y prédicas, que abre la página real
  de la web mostrando los borradores junto con lo publicado.
- La vista previa se ve **igual** que la web final, porque es la misma web.
- Funciona aunque la web esté en modo "en construcción".
- Solo pueden verla usuarios del panel con rol administración o edición.

## Fuera de alcance

- **Previsualizar cambios sobre algo ya publicado.** Cada ministerio, evento o prédica existe una
  sola vez; si está publicado, al guardar el cambio sale en la web. Para previsualizarlo habría que
  guardar dos versiones de cada cosa. Queda para más adelante.
- Textos generales y Nosotros: no tienen borrador (se guardan directo). Sí se ven en la vista
  previa, como cualquier otra parte del sitio.
- Vista previa embebida dentro del panel (iframe) o selector de celular/escritorio.

## Lo que no puede pasar

- Que un borrador se vea en la web pública, quede en una caché compartida o lo indexe Google.
- Que la vista previa "ensucie" la caché de contenido de la web pública.

## Enfoques considerados

1. **La web real en modo vista previa con permiso firmado (elegido).** Se ve exactamente igual
   que la web final, sin servicios nuevos.
2. Una segunda web (`preview.`) protegida con contraseña: casi sin cambios de código, pero suma un
   quinto servicio en Coolify y otro acceso que administrar.
3. Dibujar la página en Angular dentro del panel: duplica el diseño y con el tiempo deja de
   parecerse a la web. Descartado.

## Diseño

### Flujo

1. En el formulario de un ministerio, evento o prédica **ya guardado**, el editor toca
   **"Vista previa"**. Si hay cambios sin guardar, el botón está deshabilitado con el aviso
   "Guardá para ver la vista previa".
2. El panel pide `POST /api/admin/vista-previa` con la ruta de la web a mostrar
   (`/ministerios/vida-kids`). La API responde `{ url }`, una dirección de la web con un permiso
   firmado, y el panel la abre en una pestaña nueva.
3. La web recibe `/vista-previa?permiso=…&ir=/ministerios/vida-kids`, guarda el permiso en una
   cookie propia y redirige a `ir`.
4. Mientras la cookie exista, la web pide el contenido a `GET /api/contenido/vista-previa` (con el
   permiso) en vez de `/api/contenido`, y muestra un aviso fijo arriba: **"Vista previa: estás
   viendo borradores. Salir"**. "Salir" borra la cookie y vuelve a la portada.

### API (`apps/api`)

- **Permiso:** token firmado con HMAC-SHA256 con una clave nueva `VISTA_PREVIA_SECRETO` (solo en
  la API). Lleva el id del usuario y el vencimiento: **1 hora**. Se valida la firma (comparación de
  tiempo constante) y el vencimiento; no se guarda en la base.
- `POST /api/admin/vista-previa` (roles administrador y editor). Recibe `{ ruta }`, valida que sea
  una ruta interna (empieza con `/`, sin `//` ni protocolo) y devuelve
  `{ url: SITE_URL + '/vista-previa?permiso=…&ir=' + ruta }`. Así el panel no necesita conocer la
  URL de la web.
- `GET /api/contenido/vista-previa` con `Authorization: Bearer <permiso>`. Devuelve el mismo
  `ContenidoPublico` que `/api/contenido`, pero con ministerios, eventos, prédicas y series en
  **borrador y publicado**. Sin el caché interno del servicio y con `Cache-Control: no-store`.
  Permiso inválido o vencido: 401.
- `ContenidoService.publico()` pasa a recibir el filtro de estados; la versión pública sigue
  igual (solo publicado y con caché).
- Variable nueva en `apps/api/.env.example` y en `.env.produccion`. Sin la clave, la vista previa
  queda desactivada (el endpoint responde 503) y el resto funciona igual.

### Web (`apps/web`)

- Página `src/pages/vista-previa.ts` (endpoint): guarda la cookie `ccvida_vista_previa`
  (httpOnly, Secure, SameSite=Lax, 1 hora) y redirige a `ir`, validando que sea ruta interna. Con
  `?salir` borra la cookie y redirige a `/`.
- `middleware.ts`: con la cookie, **saltea el modo en construcción**, pone
  `X-Robots-Tag: noindex` y `Cache-Control: private, no-store`, y marca el pedido como vista previa
  (`context.locals`).
- `lib/contenido.ts`: en vista previa usa `/api/contenido/vista-previa` con el permiso y **no**
  lee ni escribe la caché `ultimo`. Si la API responde 401, borra la cookie y muestra la web
  normal (o la de construcción).
- Layout: aviso fijo de vista previa con el link "Salir".
- `sitemap.xml` y el `.ics` de eventos no cambian (siempre solo lo publicado).

### Panel (`apps/admin`)

- Botón "Vista previa" en los formularios de ministerios, eventos y prédicas, con la ruta según
  el tipo: `/ministerios/<slug>`, `/eventos/<slug>`, `/predicas/<slug>`.
- Llama al endpoint nuevo y abre la `url` con `window.open`. Si responde 503, avisa "La vista
  previa no está configurada".

## Pruebas

- API: firma y vencimiento del permiso (unitarias); e2e: `/api/contenido/vista-previa` devuelve
  borradores con permiso, 401 sin permiso o vencido, y `/api/contenido` sigue sin borradores.
- Web: con la cookie se ve un borrador aunque `EN_CONSTRUCCION=true`; sin la cookie, no; la
  respuesta lleva `noindex` y `no-store`.

## Decisiones tomadas por Claude (revisables)

- Permiso de 1 hora, sin guardarlo en la base.
- La URL de la web la arma la API con `SITE_URL`: no hace falta configurar nada nuevo en el panel.
- El botón solo funciona con el formulario guardado.
- Un evento o prédica en vista previa enlaza también a ministerios y series en borrador.
