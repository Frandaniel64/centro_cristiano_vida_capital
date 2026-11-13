# Cuestionario de textos para la web de CCVida Capital

Hoy todos los textos de la web son **de ejemplo** (`apps/web/src/data/ejemplo.ts`). Este cuestionario sirve para pedirle a cada responsable la información real. Cada pregunta indica entre `[corchetes]` el campo del panel que completa.

**Cómo usarlo**
1. Mandale a cada líder solo su sección. Que responda como si le hablara a alguien que nunca pisó una iglesia: con frases cortas y sin palabras de iglesia ("koinonía", "unción", "célula").
2. Con las respuestas, nosotros escribimos el texto final aplicando las reglas de SEO del final.
3. Pedí **2 o 3 fotos reales** por ministerio, con permiso de las personas que salen (y de los padres en el caso de chicos).

---

## 1. La iglesia (datos generales): responde el pastor o la secretaría

Estos datos aparecen en todas las páginas y son lo que más pesa en Google para las búsquedas locales ("iglesia evangélica cerca de mí", "iglesia cristiana en Floresta").

1. ¿Cuál es el nombre oficial completo de la iglesia y cómo la llama la gente? (¿"CCVida", "Vida Capital", otro?)
2. ¿En qué dirección exacta se reúnen? ¿Qué barrio es: Floresta, Flores, Vélez Sarsfield, Villa Santa Rita? ¿Es la misma que figura en Google Maps? `[direccion, barrio]`
3. ¿Qué días y horarios hay reuniones generales? ¿Hay alguna reunión además del domingo (oración, estudio bíblico entre semana)? `[reunion]`
4. ¿Qué colectivos, subte o tren dejan cerca? ¿Hay estacionamiento? ¿Se puede entrar sin escalones? `[comoLlegar, colectivos]`
5. ¿A qué denominación o red pertenecen, si pertenecen a alguna? (Ejemplo: Asambleas de Dios, bautista, independiente.) La gente lo busca así.
6. ¿Desde qué año existe la iglesia? ¿Cuántas personas vienen un domingo normal? `[datosIglesia]`
7. ¿Cómo empezó? Contá la historia en 4 o 5 frases: quiénes, dónde, qué pasó después. `[historia]`
8. ¿Cuáles son las 3 o 4 cosas que más creen y que querés que un visitante sepa? `[creemos]`
9. Si alguien te pregunta "¿por qué tendría que ir a CCVida y no a otra iglesia?", ¿qué le contestás? `[nosotrosIntro, pilares]`
10. ¿Qué pasa en un domingo, minuto a minuto? (Hora de llegada, alabanza, prédica, ofrenda, oración, despedida.) `[agendaDomingo]`
11. ¿Qué preguntas les hacen los que vienen por primera vez? Anotá las 5 más comunes y cómo las contestás. `[faqVisita]`
12. WhatsApp de contacto, Instagram, YouTube, Facebook. ¿La reunión se transmite en vivo? ¿Por dónde? `[whatsapp, instagram, youtube, facebook]`
13. ¿La iglesia tiene ficha en **Google Maps (Perfil de Empresa de Google)**? ¿Quién tiene acceso? Para aparecer en búsquedas locales es lo más importante, más que la web.

---

## 2. Personas

### 2.1 Pastores principales: responden ellos mismos

1. ¿Cómo quieren que aparezcan sus nombres? (¿"Pastores Martín y Carolina Ruiz"? ¿Con apellido?) `[pastores.nombres]`
2. ¿Desde cuándo pastorean CCVida? ¿Qué hacían antes? ¿Dónde se formaron?
3. ¿Qué hace cada uno en la iglesia? (Quién predica, quién coordina qué ministerio.)
4. Algo personal y cercano: familia, hijos, de dónde son, qué les gusta hacer un sábado.
5. ¿Por qué empezaron esta iglesia? ¿Qué sueñan para ella en 5 años?
6. Una frase de ustedes que resuma lo que quieren que sienta alguien que llega. `[pastores.cita]`
7. ¿Tienen una foto juntos, natural (no de estudio), en la que se los vea como son? `[fotosNosotros.pastores]`

Con 2 a 6 armamos `[pastores.texto]` (unas 60 a 80 palabras).

### 2.2 Líder de cada ministerio: una ficha por persona

> La web hoy no muestra a los líderes de ministerio. Si la respuesta es "sí, queremos mostrarlos", hay que agregar el campo en el panel. Igual conviene pedir los datos ahora.

1. Nombre como querés que aparezca.
2. ¿Qué ministerio liderás y desde cuándo?
3. ¿Por qué te importa este ministerio? (Una o dos frases, en primera persona.)
4. ¿Cómo te puede contactar alguien que quiere sumarse? (WhatsApp del ministerio, Instagram, "acercate el domingo".)
5. ¿Aceptás que aparezca tu foto y tu nombre en la web?

### 2.3 Predicadores (para las prédicas)

1. Nombre y cómo se presenta: "Pastor", "Pastora", "Invitado", nada. `[predicador]`
2. Si es invitado: ¿de qué iglesia o ciudad viene?
3. Por cada prédica: título, serie, fecha, duración, link de YouTube y **en una frase, qué se lleva quien la escucha**. `[titulo, serie, fecha, urlVideo, resumen]`
4. Versículos principales que usó. `[versiculos]`

---

## 3. Ministerios: un cuestionario por ministerio

### Preguntas comunes (para todos)

| # | Pregunta | Campo |
|---|----------|-------|
| 1 | ¿Cómo se llama el ministerio? ¿La gente lo busca con otro nombre? (Ej.: "Kids Vida" = "escuela dominical", "actividades para chicos".) | `nombre` |
| 2 | ¿Para quién es? Edades, estado civil, etapa de la vida. | `edades` |
| 3 | ¿Qué día, a qué hora y dónde se juntan? ¿Es semanal, mensual, una vez al año? | `horario` |
| 4 | En una sola frase: ¿qué gana alguien que viene? | `resumen` |
| 5 | Contale a alguien que nunca vino qué pasa en un encuentro, paso a paso. | `descripcion` |
| 6 | Tres cosas concretas que hacen (actividades, salidas, grupos). | `actividades` |
| 7 | ¿Qué tiene que hacer alguien para sumarse? ¿Necesita inscribirse, traer algo, pagar algo? | `descripcion` / evento |
| 8 | ¿Tiene que ser de la iglesia para venir? | `descripcion` |
| 9 | ¿Hay algún evento fijo en el año (campamento, retiro, cena)? Fecha aproximada. | eventos |
| 10 | ¿Qué miedo o duda tiene alguien antes de venir por primera vez? ¿Cómo se lo sacás? | `descripcion` |

### Preguntas específicas

**Kids Vida (niños)**
- ¿Cómo se dividen las edades? ¿Hay espacio para bebés o menores de 3?
- ¿Quiénes cuidan a los chicos? ¿Qué preparación tienen? ¿Cuántos adultos hay por grupo?
- ¿Cómo es el registro de entrada y salida? ¿Quién puede retirar al chico?
- ¿Qué hacen si un chico llora o necesita a sus padres?
- ¿Dan merienda? ¿Cómo manejan las alergias?
- ¿Usan algún material o currículo?

> Lo que más tranquiliza a los padres (y lo que más buscan) es **seguridad**: dejalo bien claro.

**Jóvenes**
- ¿Qué rango de edad real viene? ¿Hay un grupo de adolescentes aparte?
- ¿Cómo es un sábado típico? ¿Se come? ¿Hay que llevar algo?
- ¿Qué temas se charlan? ¿Se puede preguntar cualquier cosa?
- ¿Tienen Instagram propio?
- ¿Qué salidas o campamentos hicieron este año?

**Matrimonios**
- ¿Pueden venir parejas de novios? ¿Parejas que no están casadas? ¿Parejas en crisis?
- ¿Qué temas trataron en los últimos encuentros?
- ¿Ofrecen acompañamiento o consejería privada? ¿Cómo se pide?
- ¿Qué hacen con los chicos durante el encuentro?

**Bautismo**
- ¿Qué significa bautizarse para ustedes, en palabras simples?
- ¿Cuáles son los requisitos? ¿Hay una edad mínima?
- ¿Cómo es la preparación? ¿Cuántos encuentros son?
- ¿Dónde se hace el bautismo (pileta, río, en el salón)? ¿Qué hay que traer (ropa, toalla)?
- ¿Cuándo es el próximo? ¿Cómo me anoto?

**Otros ministerios que existan y no estén en la web** (alabanza, oración, mujeres, hombres, grupos en casas, ayuda social, adolescentes): ¿cuáles hay? Cada uno usa las preguntas comunes.

---

## 4. Pro Templo: responde tesorería

1. ¿Cuál es la meta real en dólares? ¿Para qué se usa cada parte? (Hoy el desglose de USD 4.000 / 3.500 / 2.500 es inventado.)
2. ¿Cómo se paga? Datos de transferencia exactos.
3. ¿Hay fecha límite?
4. ¿Qué pasa con el dinero si no se llega a la meta o si se supera?
5. ¿Se puede aportar de forma anónima?

---

## 5. Reglas de SEO para escribir los textos

**Palabras clave a cubrir** (con naturalidad, nunca repetidas a la fuerza):
- Generales: *iglesia cristiana*, *iglesia evangélica*, + el barrio (**Floresta**, **CABA**, **Buenos Aires**).
- Kids Vida: *actividades para chicos los domingos*, *escuela dominical en CABA*.
- Jóvenes: *grupo de jóvenes cristianos en Buenos Aires*.
- Matrimonios: *encuentro de parejas*, *consejería matrimonial cristiana*.
- Bautismo: *bautismo evangélico en CABA*, *cómo bautizarme*.

**Por campo**

| Campo | Largo | Regla |
|-------|-------|-------|
| `resumen` de ministerio | 80 a 110 caracteres | Se usa como meta description junto con el horario (máx. ~155 en total). Que diga **para quién es y qué gana**. |
| `descripcion` de ministerio | 120 a 250 palabras | Nombrá el barrio o "Buenos Aires" una vez. Respondé las dudas reales. |
| `actividades` | 3 a 5 ítems | Concretas, con números si se puede ("Grupos de 3 a 5, 6 a 8 y 9 a 11 años"). |
| `resumen` de evento y prédica | 1 frase, menos de 140 caracteres | Qué es y para quién. |
| Título de prédica | menos de 60 caracteres | Que se entienda solo, sin la serie. |
| `faqVisita` | 5 a 8 preguntas | Escritas como las tipea la gente en Google ("¿Puedo ir solo a una iglesia evangélica?"). |
| Texto alternativo de fotos | 1 frase | Describí lo que se ve: "Chicos pintando en Kids Vida, CCVida Floresta". |

**Tono**: voseo, frases cortas, sin jerga. Hablale a una persona, no a "los hermanos".

---

## 6. Ajustes de código pendientes (para hacer cuando estén los textos)

- Los títulos de los ministerios son solo el nombre ("Kids Vida · CCVida Capital"). Conviene agregar un campo opcional de **título SEO** o sumar la palabra clave en el título.
- Las páginas de ministerio y de prédica no tienen datos estructurados (JSON-LD). Los eventos y la portada sí.
- No hay forma de mostrar líderes de ministerio (ver 2.2).
- Confirmar que el barrio del panel coincida con la ficha de Google Maps.
