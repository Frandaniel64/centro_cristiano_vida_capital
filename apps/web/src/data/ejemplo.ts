// Contenido de la maqueta (Propuesta 2), con la misma forma que GET /api/contenido.
// Se usa en el modo muestra (PUBLIC_DEMO=true). Todo es DE EJEMPLO.
// Los textos son los mismos que apps/api/src/contenido/textos-iniciales.ts.
import type { ContenidoPublico } from '@ccvida/shared';
import { fotoDiseno } from '../lib/fotos';

export const CONTENIDO_EJEMPLO: ContenidoPublico = {
  textos: {
    lema: 'Hay lugar para ti.',
    bajadaInicio: 'Una familia en Buenos Aires que se apoya, ora unida y camina junta en la fe. Ven como estés.',
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
      { hora: '11:15', titulo: 'Oración', texto: 'Si quieres, oramos por ti.' },
      { hora: '11:45', titulo: 'Charla y despedida', texto: 'Nadie se va corriendo.' },
    ],
    faqVisita: [
      { pregunta: '¿Cómo me tengo que vestir?', respuesta: 'Como estés cómodo. Vas a ver gente de jean y zapatillas, y también algunos más arreglados.' },
      { pregunta: '¿Puedo ir solo?', respuesta: 'Claro. Avísanos con el formulario y alguien te espera en la puerta para que no entres solo.' },
      { pregunta: '¿Qué hago con mis hijos?', respuesta: 'Pueden ir a Vida Kids durante la reunión. Los registras en la entrada y los retiras al final.' },
      { pregunta: '¿Me van a pedir plata?', respuesta: 'No. Hay un momento de ofrenda para quienes quieran dar, pero nadie espera que lo hagas en tu primera visita.' },
    ],
    faqProTemplo: [
      { pregunta: '¿Qué es un voucher?', respuesta: 'Es tu aporte en dólares para el proyecto Pro Templo. Eliges el monto, lo pagas y recibes un voucher con tu número.' },
      { pregunta: '¿Cómo lo pago?', respuesta: 'En efectivo en la mesa Pro Templo los domingos después de la reunión, o por transferencia. Te mandamos los datos por email.' },
      { pregunta: '¿Puedo dar más de un voucher?', respuesta: 'Sí, cuantos quieras y cuando quieras. Cada uno suma a la pared.' },
      { pregunta: '¿Qué pasa si superamos la meta?', respuesta: 'Lo que sobre se usa para equipar el local y sostener el alquiler de los meses siguientes.' },
    ],
    historia:
      'Empezamos como un puñado de familias que se juntaban a orar en un living de Floresta. Con los años el living quedó chico y nos mudamos al teatro donde hoy nos encontramos cada domingo.\n\nHoy somos más de 150 personas de todas las edades. Seguimos siendo lo mismo que al principio: una familia que se recibe, se acompaña y comparte la mesa.',
    datosIglesia: 'Más de 150 personas · Desde 2016 · Floresta, CABA',
    pastores: {
      nombres: 'Martín y Carolina Ruiz',
      texto:
        'Pastorean CCVida desde 2016. Martín predica casi todos los domingos; Carolina coordina Vida Kids y los encuentros de matrimonios. Tienen tres hijos y una mesa donde siempre entra uno más.',
      cita: '“Queremos que cada persona que entra sienta que llegó a casa.”',
    },
    whatsapp: '11 5555 1234',
    instagram: 'https://www.instagram.com/ccvidacaba/',
    youtube: '',
    facebook: '',
    datosTransferencia: '',
    mapaUrl: '',
    versiculoBienvenida: {
      texto: 'Vengan a mí todos ustedes que están cansados y agobiados, y yo les daré descanso.',
      cita: 'Mateo 11:28',
    },
    nosotrosIntro:
      'Centro Cristiano Vida Capital es una iglesia cristiana evangélica en el corazón de Buenos Aires. Creemos que la iglesia no es un edificio: eres tú.',
    // Textos oficiales de la iglesia (documento "Nuestro modelo: Las 3E", noviembre 2026).
    mision:
      'Acompañar a las personas a conocer a Jesús, construir relaciones significativas y transformar positivamente el mundo que las rodea.\n\nCreemos que nadie tiene que recorrer la vida en soledad. Somos una comunidad de personas que comparten la vida, se apoyan mutuamente y descubren juntas cómo la fe, el amor y el servicio pueden marcar una diferencia.\n\nAquí hay lugar para ti, para tus preguntas, tu historia y tus ganas de comenzar algo nuevo.',
    vision:
      'Ser un movimiento de personas que siguen a Jesús, transforman su entorno y acompañan a nuevas generaciones a hacer lo mismo.\n\nQueremos que lo que comienza en una persona pueda impactar a su familia, su comunidad y muchas generaciones más.',
    modeloBajada: 'Un lugar para conectar, crecer y transformar.',
    modelo: [
      {
        titulo: 'Encuentro',
        frase: 'Conectar con Dios',
        texto: 'Creemos que cada persona puede descubrir una relación auténtica con Dios, sin importar de dónde venga ni en qué etapa de su vida se encuentre.',
        introItems: 'Lo hacemos a través de:',
        items: [
          { titulo: 'Atención', texto: 'Hacer una pausa para escuchar, reflexionar y descubrir lo que Dios quiere enseñarnos.' },
          { titulo: 'Ayuno', texto: 'Aprender a vivir con intención, reconocer lo verdaderamente importante y cultivar nuestra dependencia de Dios.' },
          { titulo: 'Adoración', texto: 'Expresar nuestra gratitud, amor y confianza en Dios.' },
        ],
      },
      {
        titulo: 'Entrega',
        frase: 'Compartir la vida',
        texto: 'Creemos que la vida es mejor cuando la compartimos. Queremos construir una comunidad donde cada persona sea valorada, pueda desarrollar sus capacidades y encuentre oportunidades para contribuir.',
        introItems: 'Lo hacemos compartiendo:',
        items: [
          { titulo: 'Tiempo', texto: 'Estar presentes, escucharnos y acompañarnos en los diferentes momentos de la vida.' },
          { titulo: 'Talento', texto: 'Poner nuestras habilidades y capacidades al servicio de los demás.' },
          { titulo: 'Tesoro', texto: 'Practicar la generosidad y compartir nuestros recursos para ayudar a quienes lo necesitan.' },
        ],
      },
      {
        titulo: 'Extensión',
        frase: 'Hacer la diferencia',
        texto: 'Creemos que lo que transforma nuestra vida también puede transformar la vida de otros. Por eso, queremos llevar el amor de Jesús más allá de nuestros encuentros, a nuestras familias, amistades, trabajos y comunidades.',
        introItems: 'Lo hacemos a través de:',
        items: [
          { titulo: 'Invitar', texto: 'Abrir las puertas para que más personas puedan descubrir un espacio donde sentirse bienvenidas.' },
          { titulo: 'Integrar', texto: 'Construir relaciones auténticas donde todos puedan encontrar su lugar.' },
          { titulo: 'Instruir', texto: 'Compartir lo que aprendemos de Jesús y acompañar a otros en su camino de fe y crecimiento.' },
        ],
      },
    ],
    fotosNosotros: { portada: null, historia: null, pastores: null, galeria: [] },
  },
  // Sin fotos elegidas: la web usa las de diseño.
  nosotros: { portada: null, historia: null, pastores: null, galeria: [] },
  ministerios: [
    {
      slug: 'kids-vida',
      nombre: 'Vida Kids',
      edades: 'De 3 a 11 años',
      horario: 'Domingos 10 h, durante la reunión',
      resumen: 'Los más chicos conocen a Jesús jugando.',
      descripcion:
        'Mientras los grandes están en la reunión, los chicos tienen su propio espacio: cantan, escuchan historias de la Biblia, juegan y hacen amigos, siempre con maestras capacitadas.',
      actividades: ['Grupos por edad: 3 a 5, 6 a 8 y 9 a 11', 'Registro de entrada y salida con tu nombre', 'Merienda y actividades cada domingo'],
      color: '#b1d9e1',
      foto: fotoDiseno('kids-vida', 'Dos nenas pintando con marcadores'),
    },
    {
      slug: 'jovenes',
      nombre: 'Jóvenes',
      edades: 'De 15 a 30 años',
      horario: 'Sábados 19 h',
      resumen: 'Amistad, preguntas reales y fe para la semana.',
      descripcion: 'Nos juntamos a cantar, charlar sin vueltas sobre la vida y la fe, y comer algo rico. Si llegas sin conocer a nadie, en una hora ya tienes amigos.',
      actividades: ['Encuentro semanal con música y charla', 'Salidas y campamentos durante el año', 'Grupos chicos para acompañarnos'],
      color: '#0a6cac',
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
      color: '#a0d062',
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
      actividades: ['Encuentro previo de preparación', 'Puedes invitar a tu familia y amigos', 'Te acompañamos antes, durante y después'],
      color: '#0d1f2d',
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
        'Después de la reunión del domingo nos quedamos a almorzar juntos y a charlar sobre cómo cuidar el matrimonio en lo cotidiano.\n\nPueden venir parejas de novios y matrimonios, sean o no de la iglesia. Los chicos quedan en Vida Kids.',
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
        'Durante la reunión del domingo celebramos los bautismos del año. Puedes invitar a tu familia y a tus amigos.\n\nSi te quieres bautizar, antes hacemos un encuentro de preparación para responder tus preguntas y acompañarte en este paso.',
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
        'Nos juntamos a cantar, charlar sobre la vida y la fe, y comer algo rico. Si llegas sin conocer a nadie, en una hora ya tienes amigos.',
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
