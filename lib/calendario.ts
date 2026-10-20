import { SITE_URL } from '@/lib/constants';
import { LUGAR } from '@/lib/seo';

export interface EventoCalendario {
  titulo: string;
  descripcion?: string | null;
  /** Instante de inicio. */
  inicio: Date;
  /** Sin hora conocida: el evento se agrega como "todo el día". */
  todoElDia?: boolean;
  /** Ruta relativa de la página del evento (ej: `/eventos/<id>`). */
  path: string;
}

const DURACION_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

const LUGAR_TEXTO = `Manso Club, ${LUGAR.calle}, ${LUGAR.barrio}, ${LUGAR.ciudad}`;

/** Argentina no usa horario de verano: -03 todo el año. */
export function inicioDesdeFechaYHora(fecha: string, horario?: string | null): EventoCalendario['inicio'] {
  return new Date(`${fecha}T${horario ? horario.slice(0, 5) : '00:00'}:00-03:00`);
}

/** `20261031T230000Z`: el formato de fecha que entienden Google y los .ics. */
function utc(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** `20261031`: para los eventos de todo el día, en fecha de Buenos Aires. */
function soloFecha(d: Date): string {
  return utc(new Date(d.getTime() - 3 * 60 * 60 * 1000)).slice(0, 8);
}

function rango(e: EventoCalendario): [string, string] {
  if (e.todoElDia) return [soloFecha(e.inicio), soloFecha(new Date(e.inicio.getTime() + DIA_MS))];
  return [utc(e.inicio), utc(new Date(e.inicio.getTime() + DURACION_MS))];
}

export function googleCalendarUrl(e: EventoCalendario): string {
  const [desde, hasta] = rango(e);
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.titulo,
    dates: `${desde}/${hasta}`,
    details: [e.descripcion, `${SITE_URL}${e.path}`].filter(Boolean).join('\n\n'),
    location: LUGAR_TEXTO,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

/** Escapa lo que el formato iCalendar reserva (RFC 5545 §3.3.11). */
function texto(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');
}

export function icsContenido(e: EventoCalendario, uid: string): string {
  const [desde, hasta] = rango(e);
  const fecha = e.todoElDia ? ';VALUE=DATE' : '';
  const lineas = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Manso Club//Agenda//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}@mansoclub.com.ar`,
    `DTSTAMP:${utc(new Date())}`,
    `DTSTART${fecha}:${desde}`,
    `DTEND${fecha}:${hasta}`,
    `SUMMARY:${texto(e.titulo)}`,
    `DESCRIPTION:${texto([e.descripcion, `${SITE_URL}${e.path}`].filter(Boolean).join('\n\n'))}`,
    `LOCATION:${texto(LUGAR_TEXTO)}`,
    `URL:${SITE_URL}${e.path}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lineas.join('\r\n') + '\r\n';
}

export function respuestaIcs(e: EventoCalendario, uid: string, nombreArchivo: string): Response {
  return new Response(icsContenido(e, uid), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${nombreArchivo}.ics"`,
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
}
