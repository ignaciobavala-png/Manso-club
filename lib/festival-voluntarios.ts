/**
 * Voluntarios de BLUR: constantes, tipos y validación. Sin dependencias de
 * servidor, así la usan igual el formulario (navegador) y la API (servidor):
 * el brief pide validar en los dos lados.
 *
 * La validación devuelve códigos, no frases: el texto de cada error sale de
 * `festival-voluntarios-textos` en el idioma de la página.
 */

/** El 12/12/2026: la edad mínima se cuenta a esta fecha, no a hoy. */
export const FECHA_FESTIVAL = '2026-12-12';

/** Los valores se guardan tal cual en la base: son los de las tarjetas de la página. */
export const AREAS = [
  'Montaje y desmontaje',
  'Recepción y atención al público',
  'Apoyo en producción y coordinación',
  'Donde me necesiten',
] as const;

export const IDIOMAS = ['Español', 'Inglés', 'Portugués', 'Francés', 'Otro'] as const;

export const COMO_TE_ENTERASTE = ['Instagram', 'Flyer', 'Amigos', 'Manso Club', 'Facebook', 'Universidad', 'Otro'] as const;

export const ESTADOS_VOLUNTARIO = ['nuevo', 'contactado', 'confirmado', 'en_espera', 'descartado'] as const;
export type EstadoVoluntario = (typeof ESTADOS_VOLUNTARIO)[number];

export const ETIQUETA_ESTADO: Record<EstadoVoluntario, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  confirmado: 'Confirmado',
  en_espera: 'En espera',
  descartado: 'Descartado',
};

export interface ConfigVoluntarios {
  abierta: boolean;
  cierre: string | null;
  edad_minima: number;
  turnos: string | null;
  montaje: string | null;
  desmontaje: string | null;
  traslado: string | null;
  induccion: string | null;
  disponibilidad: string[];
}

export const CONFIG_VOLUNTARIOS_POR_DEFECTO: ConfigVoluntarios = {
  abierta: true,
  cierre: null,
  edad_minima: 18,
  turnos: null,
  montaje: null,
  desmontaje: null,
  traslado: null,
  induccion: null,
  disponibilidad: [
    'Montaje (días previos)',
    'Sábado 12/12 tarde',
    'Sábado 12/12 noche',
    'Desmontaje domingo 13/12',
  ],
};

/** ¿Se puede postular hoy? Apagada a mano o pasada la fecha de cierre = cerrada. */
export const convocatoriaAbierta = (c: ConfigVoluntarios, ahora = new Date()) =>
  c.abierta && (!c.cierre || new Date(c.cierre) > ahora);

/** Lo que manda el formulario. */
export interface Postulacion {
  nombre: string;
  email: string;
  whatsapp: string;
  fecha_nacimiento: string;
  instagram: string;
  ciudad: string;
  areas: string[];
  disponibilidad: string[];
  experiencia: 'si' | 'no' | '';
  experiencia_detalle: string;
  idiomas: string[];
  idiomas_otro: string;
  motivo: string;
  con_quien: string;
  como_te_enteraste: string;
  acepta_datos: boolean;
  novedades: boolean;
}

export const POSTULACION_VACIA: Postulacion = {
  nombre: '',
  email: '',
  // El brief pide +54 por defecto, con lugar para extranjeros.
  whatsapp: '+54 ',
  fecha_nacimiento: '',
  instagram: '',
  ciudad: '',
  areas: [],
  disponibilidad: [],
  experiencia: '',
  experiencia_detalle: '',
  idiomas: [],
  idiomas_otro: '',
  motivo: '',
  con_quien: '',
  como_te_enteraste: '',
  acepta_datos: false,
  novedades: false,
};

export type CampoPostulacion = keyof Postulacion;

export type CodigoError =
  | 'obligatorio'
  | 'nombre_largo'
  | 'email'
  | 'telefono'
  | 'fecha'
  | 'menor'
  | 'minimo_uno'
  | 'experiencia_larga'
  | 'motivo_corto'
  | 'motivo_largo'
  | 'consentimiento';

export type Errores = Partial<Record<CampoPostulacion, CodigoError>>;

/** Orden en que aparecen los campos: el foco va al primero con error. */
export const ORDEN_CAMPOS: CampoPostulacion[] = [
  'nombre',
  'email',
  'whatsapp',
  'fecha_nacimiento',
  'instagram',
  'ciudad',
  'areas',
  'disponibilidad',
  'experiencia',
  'experiencia_detalle',
  'idiomas',
  'motivo',
  'con_quien',
  'como_te_enteraste',
  'acepta_datos',
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Años cumplidos a `ref` (YYYY-MM-DD), comparando strings de fecha: sin husos horarios de por medio. */
export function edadAl(nacimiento: string, ref: string = FECHA_FESTIVAL): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nacimiento);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // Descarta 31/02 y similares: el Date los corre de mes.
  const f = new Date(Date.UTC(y, mo - 1, d));
  if (f.getUTCFullYear() !== y || f.getUTCMonth() !== mo - 1 || f.getUTCDate() !== d) return null;
  const [ry, rm, rd] = ref.split('-').map(Number);
  let edad = ry - y;
  if (rm < mo || (rm === mo && rd < d)) edad -= 1;
  return edad;
}

/** "+54 9 11 1234-5678" → "+5491112345678". */
export const normalizarTelefono = (t: string) => t.replace(/[^\d+]/g, '');

/** Sin "@" adelante ni espacios: se guarda el usuario pelado. */
export const normalizarInstagram = (t: string) =>
  t
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^@+/, '')
    .replace(/\/.*$/, '');

export function validarPostulacion(p: Postulacion, config: Pick<ConfigVoluntarios, 'edad_minima' | 'disponibilidad'>): Errores {
  const e: Errores = {};

  const nombre = p.nombre.trim();
  if (!nombre) e.nombre = 'obligatorio';
  else if (nombre.length < 3 || nombre.length > 80) e.nombre = 'nombre_largo';

  const email = p.email.trim();
  if (!email) e.email = 'obligatorio';
  else if (!EMAIL.test(email) || email.length > 200) e.email = 'email';

  // Con código de país: "+" y entre 8 y 15 dígitos (E.164).
  const tel = normalizarTelefono(p.whatsapp);
  const digitos = tel.replace(/\D/g, '');
  if (!digitos || tel === '+54') e.whatsapp = 'obligatorio';
  else if (!tel.startsWith('+') || digitos.length < 8 || digitos.length > 15) e.whatsapp = 'telefono';

  if (!p.fecha_nacimiento) e.fecha_nacimiento = 'obligatorio';
  else {
    const edad = edadAl(p.fecha_nacimiento);
    if (edad === null || edad > 110) e.fecha_nacimiento = 'fecha';
    else if (edad < config.edad_minima) e.fecha_nacimiento = 'menor';
  }

  if (!p.ciudad.trim()) e.ciudad = 'obligatorio';

  if (p.areas.length === 0) e.areas = 'minimo_uno';
  if (p.disponibilidad.length === 0) e.disponibilidad = 'minimo_uno';

  if (!p.experiencia) e.experiencia = 'obligatorio';
  else if (p.experiencia === 'si' && p.experiencia_detalle.trim().length > 500) e.experiencia_detalle = 'experiencia_larga';

  const motivo = p.motivo.trim();
  if (!motivo) e.motivo = 'obligatorio';
  else if (motivo.length < 20) e.motivo = 'motivo_corto';
  else if (motivo.length > 600) e.motivo = 'motivo_largo';

  if (!p.como_te_enteraste) e.como_te_enteraste = 'obligatorio';
  if (!p.acepta_datos) e.acepta_datos = 'consentimiento';

  return e;
}
