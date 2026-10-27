// Contenido de la maqueta (Propuesta 2), con la misma forma que GET /api/contenido.
// Se usa en el modo muestra (PUBLIC_DEMO=true). Todo es DE EJEMPLO.
// Los textos son los mismos que apps/api/src/contenido/textos-iniciales.ts.
import type { ContenidoPublico } from '@ccvida/shared';
import { fotoDiseno } from '../lib/fotos';

export const CONTENIDO_EJEMPLO: ContenidoPublico = {
  textos: {
    lema: 'La iglesia sos vos.',
    bajadaInicio: 'Una familia en Buenos Aires que se apoya, ora unida y camina junta en la fe. Vení como estés.',
    reunion: 'Domingos 10 h',
    direccion: 'Camarones 2201',
    barrio: 'CABA',
    colectivos: '24, 53 y 109',
    comoLlegar: [
      { titulo: 'Colectivos', texto: '24, 53 y 109' },
      { titulo: 'Auto', texto: 'Estacionamiento en la calle' },
      { titulo: 'Accesibilidad', texto: 'Entrada sin escalones' },
    ],
    agendaDomingo: [
      { hora: '9:45', titulo: 'Café de bienvenida', texto: 'Te recibimos en la puerta.' },
      { hora: '10:00', titulo: 'Alabanza', texto: 'Cantamos juntos, sin presión.' },
      { hora: '10:30', titulo: 'Prédica', texto: 'Un mensaje para la semana.' },
      { hora: '11:15', titulo: 'Oración', texto: 'Si querés, oramos por vos.' },
      { hora: '11:45', titulo: 'Charla y despedida', texto: 'Nadie se va corriendo.' },
    ],
    faqVisita: [
      { pregunta: '¿Cómo me tengo que vestir?', respuesta: 'Como estés cómodo. Vas a ver gente de jean y zapatillas, y también algunos más arreglados.' },
      { pregunta: '¿Puedo ir solo?', respuesta: 'Claro. Avisanos con el formulario y alguien te espera en la puerta para que no entres solo.' },
      { pregunta: '¿Qué hago con mis hijos?', respuesta: 'Pueden ir a Kids Vida durante la reunión. Los registrás en la entrada y los retirás al final.' },
      { pregunta: '¿Me van a pedir plata?', respuesta: 'No. Hay un momento de ofrenda para quienes quieran dar, pero nadie espera que lo hagas en tu primera visita.' },
    ],
    faqProTemplo: [
      { pregunta: '¿Qué es un voucher?', respuesta: 'Es tu aporte en dólares para el proyecto Pro Templo. Elegís el monto, lo pagás y recibís un voucher con tu número.' },
      { pregunta: '¿Cómo lo pago?', respuesta: 'En efectivo en la mesa Pro Templo los domingos después de la reunión, o por transferencia. Te pasamos los datos por WhatsApp.' },
      { pregunta: '¿Puedo dar más de un voucher?', respuesta: 'Sí, cuantos quieras y cuando quieras. Cada uno suma a la pared.' },
      { pregunta: '¿Qué pasa si superamos la meta?', respuesta: 'Lo que sobre se usa para equipar el local y sostener el alquiler de los meses siguientes.' },
    ],
    historia:
      'Empezamos como un puñado de familias que se juntaban a orar en un living de Floresta. Con los años el living quedó chico y nos mudamos al teatro donde hoy nos encontramos cada domingo.\n\nHoy somos más de 150 personas de todas las edades. Seguimos siendo lo mismo que al principio: una familia que se recibe, se acompaña y comparte la mesa.',
    datosIglesia: 'Más de 150 personas · Desde 2016 · Floresta, CABA',
    pastores: {
      nombres: 'Martín y Carolina Ruiz',
      texto:
        'Pastorean CCVida desde 2016. Martín predica casi todos los domingos; Carolina coordina Kids Vida y los encuentros de matrimonios. Tienen tres hijos y una mesa donde siempre entra uno más.',
      cita: '“Queremos que cada persona que entra sienta que llegó a casa.”',
    },
    creemos: [
      { titulo: 'Jesús es el centro', texto: 'Creemos que Jesús murió y resucitó, y que en él encontramos vida nueva.' },
      { titulo: 'La Biblia nos guía', texto: 'Es la Palabra de Dios y la leemos juntos para vivirla en lo cotidiano.' },
      { titulo: 'Todo es gracia', texto: 'No se trata de ganarse el lugar: Dios nos ama tal como somos.' },
      { titulo: 'La iglesia somos todos', texto: 'No es un edificio ni un show: es una familia que se cuida.' },
    ],
    whatsapp: '11 5555 1234',
    instagram: 'https://www.instagram.com/ccvidacaba/',
    youtube: '',
    facebook: '',
    datosTransferencia: '',
  },
  ministerios: [
    {
      slug: 'kids-vida',
      nombre: 'Kids Vida',
      edades: 'De 3 a 11 años',
      horario: 'Domingos 10 h, durante la reunión',
      resumen: 'Los más chicos conocen a Jesús jugando.',
      descripcion:
        'Mientras los grandes están en la reunión, los chicos tienen su propio espacio: cantan, escuchan historias de la Biblia, juegan y hacen amigos, siempre con maestras capacitadas.',
      actividades: ['Grupos por edad: 3 a 5, 6 a 8 y 9 a 11', 'Registro de entrada y salida con tu nombre', 'Merienda y actividades cada domingo'],
      color: '#f5d547',
      foto: fotoDiseno('kids-vida', 'Dos nenas pintando con marcadores'),
    },
    {
      slug: 'jovenes',
      nombre: 'Jóvenes',
      edades: 'De 15 a 30 años',
      horario: 'Sábados 19 h',
      resumen: 'Amistad, preguntas reales y fe para la semana.',
      descripcion: 'Nos juntamos a cantar, charlar sin vueltas sobre la vida y la fe, y comer algo rico. Si llegás sin conocer a nadie, en una hora ya tenés amigos.',
      actividades: ['Encuentro semanal con música y charla', 'Salidas y campamentos durante el año', 'Grupos chicos para acompañarnos'],
      color: '#0c74b8',
      foto: fotoDiseno('jovenes', 'Jóvenes riendo al aire libre'),
    },
    {
      slug: 'matrimonios',
      nombre: 'Matrimonios',
      edades: 'Parejas y matrimonios',
      horario: 'Último domingo del mes, 12 h',
      resumen: 'Jesús en el centro de cada hogar.',
      descripcion: 'Encuentros para fortalecer el amor y la comunicación en pareja, con una charla, un almuerzo compartido y tiempo para ustedes dos.',
      actividades: ['Charlas sobre comunicación, finanzas y familia', 'Almuerzo compartido después de la reunión', 'Acompañamiento para parejas que lo necesiten'],
      color: '#8cc63f',
      foto: fotoDiseno('matrimonio', 'Una pareja abrazada sonriendo'),
    },
    {
      slug: 'bautismo',
      nombre: 'Bautismo',
      edades: 'Para quienes decidieron seguir a Jesús',
      horario: 'Próximo: domingo 13 de diciembre',
      resumen: 'Una decisión puede cambiar tu historia.',
      descripcion:
        'El bautismo es una forma de contar en público que decidiste seguir a Jesús. Antes hacemos un encuentro para responder tus preguntas y acompañarte en este paso.',
      actividades: ['Encuentro previo de preparación', 'Podés invitar a tu familia y amigos', 'Te acompañamos antes, durante y después'],
      color: '#f5f5f0',
      foto: fotoDiseno('bautismo', 'Personas celebrando un bautismo en el agua'),
    },
  ],
  eventos: [
    {
      slug: 'encuentro-de-matrimonios-noviembre',
      titulo: 'Encuentro de matrimonios',
      inicio: '2026-11-29T15:00:00.000Z',
      fin: '2026-11-29T18:00:00.000Z',
      repeticion: 'ninguna',
      lugar: 'Camarones 2201, CABA',
      resumen: 'Una charla para parejas y un almuerzo compartido después de la reunión.',
      descripcion:
        'Después de la reunión del domingo nos quedamos a almorzar juntos y a charlar sobre cómo cuidar el matrimonio en lo cotidiano.\n\nPueden venir parejas de novios y matrimonios, sean o no de la iglesia. Los chicos quedan en Kids Vida.',
      ministerio: 'matrimonios',
      destacado: true,
      linkInscripcion: null,
      foto: fotoDiseno('matrimonio', 'Una pareja abrazada sonriendo'),
    },
    {
      slug: 'bautismo-diciembre',
      titulo: 'Bautismo de fin de año',
      inicio: '2026-12-13T13:00:00.000Z',
      fin: '2026-12-13T16:00:00.000Z',
      repeticion: 'ninguna',
      lugar: 'Camarones 2201, CABA',
      resumen: 'Celebramos juntos a quienes decidieron seguir a Jesús.',
      descripcion:
        'Durante la reunión del domingo celebramos los bautismos del año. Podés invitar a tu familia y a tus amigos.\n\nSi te querés bautizar, antes hacemos un encuentro de preparación para responder tus preguntas y acompañarte en este paso.',
      ministerio: 'bautismo',
      destacado: true,
      linkInscripcion: '/visitanos',
      foto: fotoDiseno('bautismo', 'Personas celebrando un bautismo en el agua'),
    },
    {
      slug: 'jovenes-sabados',
      titulo: 'Encuentro de Jóvenes',
      inicio: '2026-10-31T22:00:00.000Z',
      fin: '2026-11-01T00:30:00.000Z',
      repeticion: 'semanal',
      lugar: 'Camarones 2201, CABA',
      resumen: 'Música, charla sin vueltas y algo rico para comer. De 15 a 30 años.',
      descripcion:
        'Nos juntamos a cantar, charlar sobre la vida y la fe, y comer algo rico. Si llegás sin conocer a nadie, en una hora ya tenés amigos.',
      ministerio: 'jovenes',
      destacado: true,
      linkInscripcion: null,
      foto: fotoDiseno('jovenes', 'Jóvenes riendo al aire libre'),
    },
  ],
  predicas: [
    { slug: 'sin-datos-en-el-desierto', titulo: 'Sin datos en el desierto', serie: 'Un futuro en el desierto', fecha: '2026-10-25', predicador: 'Pastor Martín Ruiz', duracionMin: 42, resumen: 'Dios escucha tu voz, abre tus ojos y provee lo necesario para seguir.', versiculos: [], urlVideo: null, destacada: true, foto: fotoDiseno('predica-desierto', '') },
    { slug: 'dios-acompana', titulo: 'Dios acompaña', serie: 'Un futuro en el desierto', fecha: '2026-10-18', predicador: 'Pastora Carolina Ruiz', duracionMin: 38, resumen: 'Tu historia en el desierto apenas comienza, y Dios camina a tu lado.', versiculos: [], urlVideo: null, destacada: false, foto: fotoDiseno('alabanza', '') },
    { slug: 'el-no-podia-orar-yo-puedo', titulo: 'Él no podía orar, yo puedo', serie: 'Un futuro en el desierto', fecha: '2026-10-11', predicador: 'Pastor Martín Ruiz', duracionMin: 45, resumen: 'Cuando otros no pueden, nosotros podemos orar por ellos.', versiculos: [], urlVideo: null, destacada: false, foto: fotoDiseno('pastor', '') },
    { slug: 'dialogo-sin-fin', titulo: 'Diálogo sin fin', serie: 'Vida de oración', fecha: '2026-10-04', predicador: 'Pastor Martín Ruiz', duracionMin: 40, resumen: 'La oración no es un trámite: es una conversación que nunca se corta.', versiculos: [], urlVideo: null, destacada: false, foto: fotoDiseno('biblia', '') },
    { slug: 'el-poder-que-sostiene-tu-vida', titulo: 'El poder que sostiene tu vida', serie: 'Vida de oración', fecha: '2026-09-27', predicador: 'Invitado: Pastor Diego Paz', duracionMin: 47, resumen: 'Lo que te sostiene en los días de angustia no es tu fuerza.', versiculos: [], urlVideo: null, destacada: false, foto: fotoDiseno('transmision', '') },
    { slug: 'bienaventurado', titulo: 'Bienaventurado', serie: 'Salmos', fecha: '2026-09-20', predicador: 'Pastora Carolina Ruiz', duracionMin: 36, resumen: 'El Salmo 1 y la vida que da fruto a su tiempo.', versiculos: [], urlVideo: null, destacada: false, foto: fotoDiseno('manos-en-alto', '') },
  ],
  campana: { metaUsd: 10_000, montoMaximoUsd: 10_000, montosSugeridos: [1, 5, 10, 20, 50, 100], formasPago: ['efectivo', 'transferencia'] },
};
