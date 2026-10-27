import type { TextosSitio } from '@ccvida/shared';

// Los textos de la maqueta aprobada (Propuesta 2). Son DE EJEMPLO: el panel
// arranca con ellos para que la iglesia corrija en vez de escribir de cero.
export const TEXTOS_INICIALES: TextosSitio = {
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
  whatsapp: '',
  instagram: 'https://www.instagram.com/ccvidacaba/',
  youtube: '',
  facebook: '',
  datosTransferencia: '',
  nosotrosIntro:
    'Centro Cristiano Vida Capital es una iglesia cristiana evangélica en el corazón de Buenos Aires. Creemos que la iglesia no es un edificio: sos vos.',
  pilares: [
    { titulo: 'Somos familia', texto: 'La comunidad es el corazón: nos recibimos por nombre y compartimos la mesa.', color: '#0c74b8' },
    { titulo: 'Dios te acompaña', texto: 'En el desierto y en la fiesta, nadie camina solo.', color: '#f5d547' },
    { titulo: 'Tu lugar está acá', texto: 'Cada persona suma. Tu presencia marca la diferencia.', color: '#8cc63f' },
    { titulo: 'Crecemos juntos', texto: 'Hay un espacio para cada etapa: chicos, jóvenes, parejas y familias.', color: '#0a0a0a' },
  ],
  // Sin fotos cargadas, la web usa las de diseño.
  fotosNosotros: { portada: null, historia: null, pastores: null, galeria: [] },
};
