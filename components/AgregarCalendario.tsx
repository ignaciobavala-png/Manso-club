import { CalendarPlus } from 'lucide-react';
import { googleCalendarUrl, type EventoCalendario } from '@/lib/calendario';

const CLASE =
  'flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 border border-manso-cream/10 rounded-full text-manso-cream hover:bg-manso-cream/10 hover:border-manso-cream/20 transition-all text-xs font-medium';

/**
 * Dos enlaces: Google Calendar (URL con los datos) y un .ics que sirve la ruta
 * `icsPath` para Apple Calendar y Outlook. Es un enlace y no un data: URI
 * porque Safari no descarga los segundos.
 */
export function AgregarCalendario({ evento, icsPath }: { evento: EventoCalendario; icsPath: string }) {
  return (
    <>
      <a href={googleCalendarUrl(evento)} target="_blank" rel="noopener noreferrer" className={CLASE}>
        <CalendarPlus size={16} aria-hidden="true" />
        Google Calendar
      </a>
      <a href={icsPath} className={CLASE}>
        <CalendarPlus size={16} aria-hidden="true" />
        Apple / Outlook
      </a>
    </>
  );
}
