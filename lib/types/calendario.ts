export type CalendarioTipo = 'agenda' | 'evento';

export interface CalendarioOcurrencia {
  id: string;
  tipo: CalendarioTipo;
  titulo: string;
  categoria?: string;
  fecha: Date;
  /** Hora de inicio ya formateada para mostrar (ej. "18:00"). Ausente si no tiene horario. */
  hora?: string;
  /** Ruta interna (agenda con slug) a la que navegar al clickear. */
  href?: string;
  /** Link externo (ej. link_tickets de eventos) a abrir en nueva pestaña. */
  linkExterno?: string;
  imagen_url?: string;
  descripcion?: string;
  disponible?: boolean;
}
