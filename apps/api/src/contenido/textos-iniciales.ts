import type { TextosSitio } from '@ccvida/shared';

// Los textos de la maqueta aprobada (Propuesta 2). Son DE EJEMPLO: el panel
// arranca con ellos para que la iglesia corrija en vez de escribir de cero.
export const TEXTOS_INICIALES: TextosSitio = {
  lema: 'Hay lugar para ti.',
  bajadaInicio: 'Una familia en Buenos Aires que se apoya, ora unida y camina junta en la fe. Ven como estés.',
  reunion: 'Domingos 10 h',
  direccion: 'Camarones 2201',
  barrio: 'CABA',
  mapaUrl: '',
  versiculoBienvenida: {
    texto: 'Vengan a mí todos ustedes que están cansados y agobiados, y yo les daré descanso.',
    cita: 'Mateo 11:28',
  },
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
  whatsapp: '',
  instagram: 'https://www.instagram.com/ccvidacaba/',
  youtube: '',
  facebook: '',
  datosTransferencia: '',
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
  // Sin fotos cargadas, la web usa las de diseño.
  fotosNosotros: { portada: null, historia: null, pastores: null, galeria: [] },
};
