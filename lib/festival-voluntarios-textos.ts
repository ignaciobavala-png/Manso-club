import type { CodigoError } from '@/lib/festival-voluntarios';
import type { Idioma } from '@/lib/festival-idioma';

/**
 * Textos de /blur/voluntarios. Los de castellano se copian tal cual del brief
 * del 04/11 ("Los textos entre comillas son finales"). Los de inglés los
 * escribimos nosotros: el brief dice que los entregan aparte, así que son
 * provisorios hasta que lleguen.
 *
 * Lo que el brief dejó "A DEFINIR" (turnos, montaje, traslado, inducción, edad)
 * NO está acá: sale de `festival_voluntarios_config` y, vacío, no se muestra.
 */

const es = {
  titulo: 'Voluntarios',
  metaTitulo: 'Voluntarios · BLUR Festival 2026',
  metaDescripcion: 'Sumate al equipo de BLUR Festival: técnica y producción, hospitality, barra y gastronomía. Sábado 12/12, Delta, Tigre.',

  hero: {
    titulo: '¿Querés ser parte de BLUR?',
    bajada: 'BLUR Festival, Innovación, Arte y Cultura en Comunidad. Sábado 12.12.26, Delta, Tigre.',
    texto: 'Sumate al equipo que hace BLUR posible: vivilo desde adentro.',
    boton: 'Quiero sumarme',
  },

  que: {
    rotulo: 'Qué es BLUR',
    texto:
      'BLUR es un festival de un día en una isla del Delta del Paraná: arte, diseño, tecnología y música en 3 stages, un panel de charlas sobre innovación, gastronomía y atardecer sobre el río. Lo organiza Manso Club, club cultural y estudio creativo de Colegiales.',
  },

  areas: {
    rotulo: '¿En qué vas a participar?',
    items: [
      {
        valor: 'Técnica y producción',
        descripcion: 'Ayudando a los equipos de técnica y logística, armado de escenarios y espacios.',
      },
      {
        valor: 'Hospitality',
        descripcion: 'Ayudando a los equipos de técnica y logística, armado de escenarios y espacios.',
      },
      {
        valor: 'Barra y gastronomía',
        descripcion: 'Asistiendo en los puestos de barra y gastronomía.',
      },
    ],
  },

  beneficios: {
    rotulo: '¿Qué ofrecemos?',
    /** La moneda de cambio: va primero y en grande. */
    destacado: {
      titulo: 'Entrada gratis a BLUR',
      texto: 'Tu tiempo a cambio de la entrada al festival. Fuera de tu turno, BLUR es tuyo.',
    },
    items: [
      'Almuerzo en los puestos gastronómicos del festival.',
      'Entrada free a eventos seleccionados de Manso.',
      'Conocer desde adentro cómo se produce un festival real.',
      'Experiencia práctica en el área que más te interese.',
      'Trabajo en equipo con personas de distintas disciplinas.',
      'Contacto con gente del rubro.',
      'Participación para sumar a tu CV.',
    ],
  },

  quien: {
    rotulo: '¿A quién buscamos?',
    texto:
      'Personas con compromiso y buena disposición para trabajar en equipo. Interesadas en ser parte de un movimiento cultural de vanguardia.',
    isla: 'Poder estar en la isla el sábado 12/12 en el turno asignado.',
    induccion: 'Asistir a una charla de inducción previa (online o en Manso).',
  },

  compromiso: {
    rotulo: 'Fecha, lugar y compromiso',
    fecha: 'Sábado 12.12.26 · Delta, Tigre.',
    turnos: 'Turnos de {valor}.',
    montaje: 'Montaje: {valor}.',
    desmontaje: 'Desmontaje: {valor}.',
    traslado: 'Cómo llegar: {valor}.',
    induccion: 'Inducción: {valor}.',
  },

  faq: {
    rotulo: 'Preguntas frecuentes',
    items: [
      { p: '¿Es pago?', r: 'No. Es una participación voluntaria no remunerada.' },
      { p: '¿Necesito experiencia?', r: 'No. Buscamos ganas y compromiso; te explicamos todo en la inducción.' },
      {
        p: '¿Puedo anotarme con amigos?',
        r: 'Sí. Poné sus nombres en el formulario y tratamos de ponerlos en el mismo equipo. Cada uno completa su propio formulario.',
      },
      { p: '¿Puedo disfrutar del festival?', r: 'Sí. Fuera de tu turno tenés acceso al festival.' },
      { p: '¿Hay comida?', r: 'Sí. Tenés el almuerzo en los puestos gastronómicos del festival.' },
      {
        p: '¿Y si no puedo ir a último momento?',
        r: 'Avisanos cuanto antes por mail o Instagram para reorganizar el equipo.',
      },
      {
        p: 'Hablo otro idioma, ¿sirve?',
        r: '¡Sí! Va a haber público internacional; indicalo en el formulario.',
      },
    ],
    /** Se agrega a la lista solo si hay dato de traslado cargado en el panel. */
    llegar: { p: '¿Cómo llego a la isla?', r: '{valor}' },
  },

  contacto: {
    dudas: '¿Dudas? Escribinos por Instagram',
    o: 'o a',
    legal: 'Participación voluntaria no remunerada.',
  },

  home: {
    texto: '¿Querés ser parte de BLUR desde adentro?',
    boton: 'Sumate como voluntario/a',
  },

  flotante: 'Quiero sumarme',

  form: {
    titulo: '¿Te interesa participar?',
    bajada: 'Completá tus datos y te escribimos. Toma 3 minutos.',
    grupos: { personales: 'Datos personales', participacion: 'Participación', sobreVos: 'Sobre vos', consentimiento: 'Consentimiento' },
    campos: {
      nombre: 'Nombre y apellido',
      email: 'Email',
      whatsapp: 'WhatsApp',
      whatsappAyuda: 'Con código de país.',
      fecha_nacimiento: 'Fecha de nacimiento',
      instagram: 'Instagram',
      ciudad: 'Barrio / ciudad',
      areas: 'Área de interés',
      disponibilidad: 'Disponibilidad',
      experiencia: '¿Tenés experiencia en eventos o festivales?',
      si: 'Sí',
      no: 'No',
      experiencia_detalle: 'Contanos dónde y qué hiciste',
      idiomas: 'Idiomas que hablás',
      idiomas_otro: '¿Cuál?',
      motivo: '¿Por qué querés ser parte de BLUR?',
      con_quien: '¿Venís con alguien?',
      con_quien_ayuda: 'Nombres de amigos/as que también se postulan',
      como_te_enteraste: '¿Cómo te enteraste?',
      elegir: 'Elegí una opción',
      acepta_datos:
        'Acepto que BLUR / Manso Club use mis datos para coordinar el voluntariado. Entiendo que es una participación no remunerada.',
      novedades: 'Quiero recibir novedades de Manso y BLUR',
      privacidad: 'Cómo usamos tus datos',
      privacidadTexto:
        'Guardamos lo que completás acá para coordinar el voluntariado de BLUR. Lo ve solo el equipo de producción y no lo compartimos con terceros. Si querés que lo borremos o corregirlo, escribinos a {mail} (Ley 25.326).',
      obligatorio: 'obligatorio',
      caracteres: '{n}/{max}',
    },
    enviar: 'Enviar postulación',
    enviando: 'Enviando…',
    errorEnvio:
      'No pudimos enviar tu postulación. Probá de nuevo o escribinos a {mail}',
    errorGeneral: 'Revisá los campos marcados.',
    errores: {
      obligatorio: 'Este campo es obligatorio.',
      nombre_largo: 'Escribí tu nombre y apellido (entre 3 y 80 caracteres).',
      email: 'Revisá el mail: parece que le falta algo.',
      telefono: 'Escribí tu WhatsApp con código de país, por ejemplo +54 9 11 1234 5678.',
      fecha: 'Esa fecha no es válida.',
      menor: 'Para esta edición buscamos personas de {edad} años o más.',
      minimo_uno: 'Elegí al menos una opción.',
      experiencia_larga: 'Máximo 500 caracteres.',
      motivo_corto: 'Contanos un poco más (mínimo 20 caracteres).',
      motivo_largo: 'Máximo 600 caracteres.',
      consentimiento: 'Necesitamos que aceptes para poder anotarte.',
    } satisfies Record<CodigoError, string>,
  },

  exito: {
    titulo: '¡Gracias, {nombre}!',
    texto: 'Recibimos tu postulación. Te vamos a escribir a {email} en los próximos días. Mientras tanto, seguinos en @{instagram}.',
    compartir: 'Compartir con un amigo',
    copiado: 'Link copiado',
    whatsapp: 'Mirá, BLUR Festival busca voluntarios (12/12, Delta, Tigre): {url}',
  },

  cerrada: {
    titulo: 'Convocatoria cerrada',
    texto: 'Convocatoria cerrada. Dejanos tu mail para la próxima edición.',
    email: 'Tu mail',
    enviar: 'Avisame',
    ok: 'Listo, te avisamos en la próxima edición.',
    error: 'No pudimos guardar tu mail. Probá de nuevo.',
  },

  mail: {
    asunto: 'Recibimos tu postulación · BLUR Festival',
    saludo: 'Hola {nombre},',
    cuerpo:
      'gracias por querer ser parte de BLUR. Recibimos tu postulación para {areas}. En los próximos días te contactamos por WhatsApp o mail para confirmar y contarte cómo sigue. Si tenés dudas, respondé este mail.',
    firma: 'Equipo BLUR · Manso Club',
  },
};

export type TextosVoluntarios = typeof es;

const en: TextosVoluntarios = {
  titulo: 'Volunteers',
  metaTitulo: 'Volunteers · BLUR Festival 2026',
  metaDescripcion: 'Join the BLUR Festival team: technical and production, hospitality, bar and food. Saturday 12/12, Delta, Tigre.',

  hero: {
    titulo: 'Want to be part of BLUR?',
    bajada: 'BLUR Festival, Innovation, Art and Culture in Community. Saturday 12.12.26, Delta, Tigre.',
    texto: 'Join the team that makes BLUR happen: live it from the inside.',
    boton: 'I want to join',
  },

  que: {
    rotulo: 'What is BLUR',
    texto:
      'BLUR is a one-day festival on an island in the Paraná Delta: art, design, technology and music across 3 stages, a panel of talks on innovation, food and a sunset over the river. It is organised by Manso Club, a cultural club and creative studio in Colegiales.',
  },

  areas: {
    rotulo: 'What will you do?',
    items: [
      {
        valor: 'Técnica y producción',
        descripcion: 'Helping the technical and logistics teams, building stages and spaces.',
      },
      {
        valor: 'Hospitality',
        descripcion: 'Helping the technical and logistics teams, building stages and spaces.',
      },
      {
        valor: 'Barra y gastronomía',
        descripcion: 'Assisting at the bar and food stands.',
      },
    ],
  },

  beneficios: {
    rotulo: 'What we offer',
    destacado: {
      titulo: 'Free entry to BLUR',
      texto: 'Your time in exchange for a ticket to the festival. Outside your shift, BLUR is yours.',
    },
    items: [
      'Lunch at the festival food stands.',
      'Free entry to selected Manso events.',
      'See from the inside how a real festival is produced.',
      'Hands-on experience in the area that interests you most.',
      'Teamwork with people from different disciplines.',
      'Contact with people in the field.',
      'Participation you can add to your CV.',
    ],
  },

  quien: {
    rotulo: 'Who we are looking for',
    texto:
      'People who are committed and enjoy working in a team. Interested in being part of a cutting-edge cultural movement.',
    isla: 'Be able to be on the island on Saturday 12/12 during your assigned shift.',
    induccion: 'Attend a prior induction talk (online or at Manso).',
  },

  compromiso: {
    rotulo: 'Date, place and commitment',
    fecha: 'Saturday 12.12.26 · Delta, Tigre.',
    turnos: 'Shifts of {valor}.',
    montaje: 'Set-up: {valor}.',
    desmontaje: 'Take-down: {valor}.',
    traslado: 'Getting there: {valor}.',
    induccion: 'Induction: {valor}.',
  },

  faq: {
    rotulo: 'FAQ',
    items: [
      { p: 'Is it paid?', r: 'No. It is an unpaid volunteer role.' },
      { p: 'Do I need experience?', r: 'No. We are looking for enthusiasm and commitment; we explain everything at the induction.' },
      {
        p: 'Can I sign up with friends?',
        r: 'Yes. Write their names in the form and we will try to put you on the same team. Everyone fills in their own form.',
      },
      { p: 'Can I enjoy the festival?', r: 'Yes. Outside your shift you have access to the festival.' },
      { p: 'Is there food?', r: 'Yes. You get lunch at the festival food stands.' },
      {
        p: 'What if I cannot make it at the last minute?',
        r: 'Let us know as soon as possible by email or Instagram so we can reorganise the team.',
      },
      {
        p: 'I speak another language, does it help?',
        r: 'Yes! There will be an international audience; mention it in the form.',
      },
    ],
    llegar: { p: 'How do I get to the island?', r: '{valor}' },
  },

  contacto: {
    dudas: 'Questions? Write to us on Instagram',
    o: 'or to',
    legal: 'Unpaid volunteer participation.',
  },

  home: {
    texto: 'Want to be part of BLUR from the inside?',
    boton: 'Join as a volunteer',
  },

  flotante: 'I want to join',

  form: {
    titulo: 'Interested in taking part?',
    bajada: 'Fill in your details and we will write to you. It takes 3 minutes.',
    grupos: { personales: 'Personal details', participacion: 'Participation', sobreVos: 'About you', consentimiento: 'Consent' },
    campos: {
      nombre: 'Full name',
      email: 'Email',
      whatsapp: 'WhatsApp',
      whatsappAyuda: 'Including country code.',
      fecha_nacimiento: 'Date of birth',
      instagram: 'Instagram',
      ciudad: 'Neighbourhood / city',
      areas: 'Area of interest',
      disponibilidad: 'Availability',
      experiencia: 'Do you have experience in events or festivals?',
      si: 'Yes',
      no: 'No',
      experiencia_detalle: 'Tell us where and what you did',
      idiomas: 'Languages you speak',
      idiomas_otro: 'Which one?',
      motivo: 'Why do you want to be part of BLUR?',
      con_quien: 'Coming with someone?',
      con_quien_ayuda: 'Names of friends who are also applying',
      como_te_enteraste: 'How did you hear about us?',
      elegir: 'Choose an option',
      acepta_datos:
        'I agree that BLUR / Manso Club may use my data to coordinate the volunteer programme. I understand this is an unpaid role.',
      novedades: 'I want to receive news from Manso and BLUR',
      privacidad: 'How we use your data',
      privacidadTexto:
        'We keep what you fill in here to coordinate BLUR volunteers. Only the production team sees it and we do not share it with third parties. If you want it deleted or corrected, write to {mail} (Argentine Law 25.326).',
      obligatorio: 'required',
      caracteres: '{n}/{max}',
    },
    enviar: 'Send application',
    enviando: 'Sending…',
    errorEnvio: 'We could not send your application. Try again or write to us at {mail}',
    errorGeneral: 'Please check the highlighted fields.',
    errores: {
      obligatorio: 'This field is required.',
      nombre_largo: 'Enter your full name (3 to 80 characters).',
      email: 'Check your email: it looks incomplete.',
      telefono: 'Enter your WhatsApp with country code, e.g. +54 9 11 1234 5678.',
      fecha: 'That date is not valid.',
      menor: 'For this edition we are looking for people aged {edad} or over.',
      minimo_uno: 'Choose at least one option.',
      experiencia_larga: '500 characters maximum.',
      motivo_corto: 'Tell us a bit more (20 characters minimum).',
      motivo_largo: '600 characters maximum.',
      consentimiento: 'We need you to accept so we can register you.',
    },
  },

  exito: {
    titulo: 'Thank you, {nombre}!',
    texto: 'We received your application. We will write to {email} in the coming days. In the meantime, follow us at @{instagram}.',
    compartir: 'Share with a friend',
    copiado: 'Link copied',
    whatsapp: 'Look, BLUR Festival is looking for volunteers (12/12, Delta, Tigre): {url}',
  },

  cerrada: {
    titulo: 'Applications closed',
    texto: 'Applications are closed. Leave us your email for the next edition.',
    email: 'Your email',
    enviar: 'Notify me',
    ok: 'Done, we will let you know about the next edition.',
    error: 'We could not save your email. Try again.',
  },

  mail: {
    asunto: 'We received your application · BLUR Festival',
    saludo: 'Hi {nombre},',
    cuerpo:
      'thanks for wanting to be part of BLUR. We received your application for {areas}. In the coming days we will contact you by WhatsApp or email to confirm and tell you what happens next. If you have questions, reply to this email.',
    firma: 'BLUR team · Manso Club',
  },
};

export const TEXTOS_VOLUNTARIOS: Record<Idioma, TextosVoluntarios> = { es, en };

/** "Hola {nombre}" con `{nombre}` reemplazado. */
export const llenar = (plantilla: string, valores: Record<string, string | number>) =>
  plantilla.replace(/\{(\w+)\}/g, (_, k: string) => String(valores[k] ?? ''));
