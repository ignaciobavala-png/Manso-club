/** Tipos y helpers compartidos por las dos secciones de Solicitudes. */

export type Estado = 'pendiente' | 'aprobado' | 'rechazado';

export interface Solicitud {
  id: string;
  origen: 'membresia' | 'open_cowork';
  membresia_id: string | null;
  membresia_nombre: string | null;
  fecha_id: string | null;
  nombre: string;
  email: string;
  whatsapp: string;
  dedicacion: string;
  proyecto: string | null;
  busca: string | null;
  estado: Estado;
  notas_admin: string | null;
  user_id: string | null;
  created_at: string;
}

export interface Fecha {
  id: string;
  fecha: string;
  horario: string | null;
  cupos_maximos: number;
  activo: boolean;
}

/**
 * Estado de la cuenta de quien solicitó, cruzado por mail contra user_profiles.
 * "Pagado" para Ana es tener la membresía activa, así que no lo llevamos como
 * un estado más de la solicitud: lo leemos de donde ya vive la verdad.
 */
export interface CuentaDelSolicitante {
  id: string;
  email: string;
  membresia_activa: boolean;
  membresia_hasta: string | null;
}

export const ESTADOS: { id: Estado; label: string; color: string }[] = [
  { id: 'pendiente', label: 'Pendiente', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25' },
  { id: 'aprobado',  label: 'Aprobado',  color: 'text-green-400 bg-green-500/10 border-green-500/25' },
  { id: 'rechazado', label: 'Rechazado', color: 'text-red-400 bg-red-500/10 border-red-500/25' },
];

export function fechaCorta(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function fechaLarga(fecha: string, horario: string | null) {
  const d = new Date(`${fecha}T00:00:00`);
  const texto = d.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const capitalizado = texto.charAt(0).toUpperCase() + texto.slice(1);
  return horario ? `${capitalizado} · ${horario.slice(0, 5)}` : capitalizado;
}

/** Una fecha ya pasada no se muestra entre las próximas. */
export function esPasada(fecha: string) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return new Date(`${fecha}T00:00:00`) < hoy;
}

/** Ocupan lugar las pendientes y las aprobadas; una rechazada lo libera. */
export function ocupaCupo(s: Solicitud) {
  return s.estado !== 'rechazado';
}
