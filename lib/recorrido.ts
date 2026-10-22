export type PasoRecorrido = {
  foto: string;
  alt: string;
  titulo: string;
  texto: string;
  /** Clip generado con IA que une esta foto con la siguiente (primer y último cuadro = las fotos reales). */
  clipDespues?: string;
};

/** El orden es el del recorrido real: de la puerta de calle al balcón. */
export const PASOS_RECORRIDO: PasoRecorrido[] = [
  {
    foto: '/recorrido/01.webp',
    clipDespues: '/recorrido/t1.mp4',
    alt: 'Puerta vidriada azul que da a una escalera de madera y un piso de baldosas naranjas',
    titulo: 'La puerta',
    texto: 'Se entra por una puerta vidriada azul. Del otro lado esperan la escalera y el piso de baldosas naranjas.',
  },
  {
    foto: '/recorrido/02.webp',
    alt: 'Salón con piso de madera, ventanales, un piano vertical y un cuadro colorido',
    titulo: 'El salón',
    texto: 'Piso de madera, ventanales a la calle y una lámpara redonda que cuelga del techo.',
  },
  {
    foto: '/recorrido/03.webp',
    alt: 'Cabina de madera con el nombre Manso y parlantes de estudio a los costados',
    titulo: 'La cabina',
    texto: 'Una cabina de madera con el nombre de la casa y parlantes de estudio a cada lado.',
  },
  {
    foto: '/recorrido/04.webp',
    alt: 'Piano vertical de madera oscura bajo un cuadro abstracto, con un objeto rojo encima',
    titulo: 'El piano',
    texto: 'Un piano vertical, un cuadro enorme y un toque de rojo que se ve desde la puerta.',
  },
  {
    foto: '/recorrido/05.webp',
    alt: 'Mesa de madera con dos bandejas, un mixer y un reproductor digital',
    titulo: 'Las bandejas',
    texto: 'Dos bandejas, un mixer y un reproductor digital, todo armado sobre una barra de madera.',
  },
  {
    foto: '/recorrido/06.webp',
    alt: 'Puerta alta abierta hacia el hall de la escalera, con una bola de espejos colgada',
    titulo: 'Hacia la escalera',
    texto: 'Una puerta alta se abre al hall. Colgada sobre la escalera, una bola de espejos.',
  },
  {
    foto: '/recorrido/07.webp',
    alt: 'Rincón debajo de la escalera con un sillón de cuero, una puerta y un afiche',
    titulo: 'Bajo la escalera',
    texto: 'Un rincón con un sillón de cuero, una puerta vidriada y un afiche en la pared.',
  },
  {
    foto: '/recorrido/08.webp',
    clipDespues: '/recorrido/t2.mp4',
    alt: 'Escalera de madera lustrada con baranda tallada y paneles de vidrio',
    titulo: 'La escalera',
    texto: 'Madera lustrada, baranda tallada y un escalón detrás de otro hasta el piso de arriba.',
  },
  {
    foto: '/recorrido/09.webp',
    alt: 'Pasillo largo con puertas de madera y luz que entra de costado',
    titulo: 'Arriba, el pasillo',
    texto: 'Un pasillo largo con puertas de madera, y la luz entrando de costado.',
  },
  {
    foto: '/recorrido/10.webp',
    alt: 'Puertas de madera con banderola, piso de tablas y una baranda en primer plano',
    titulo: 'Más puertas',
    texto: 'Puertas de madera con banderola, piso de tablas y cada ambiente con su propio carácter.',
  },
  {
    foto: '/recorrido/11.webp',
    alt: 'Personas trabajando con notebooks en una mesa larga, junto a ventanales',
    titulo: 'El cowork',
    texto: 'Una mesa larga junto a los ventanales. Acá se trabaja.',
  },
  {
    foto: '/recorrido/12.webp',
    alt: 'Cuatro personas con notebooks y auriculares compartiendo una mesa',
    titulo: 'Trabajar en compañía',
    texto: 'Notebooks, auriculares y una mesa compartida: cada persona en lo suyo, todas en el mismo lugar.',
  },
  {
    foto: '/recorrido/13.webp',
    clipDespues: '/recorrido/t3.mp4',
    alt: 'Puertas de madera amarilla con vidrios que dan a un balcón y a los árboles de la calle',
    titulo: 'El balcón',
    texto: 'Unas puertas amarillas de vidrio repartido dan al balcón y a los árboles de la calle.',
  },
  {
    foto: '/recorrido/14.webp',
    alt: 'Vista desde el balcón a una esquina con el piso mojado y un local iluminado',
    titulo: 'La esquina',
    texto: 'Desde la baranda del balcón se ve la esquina de Colegiales, con el asfalto todavía mojado.',
  },
];
