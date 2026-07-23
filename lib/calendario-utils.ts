import { CalendarioOcurrencia } from '@/lib/types/calendario';

interface AgendaRow {
  id: string;
  titulo: string;
  descripcion?: string;
  slug?: string;
  categoria?: string;
  frecuencia?: string;
  /** Hora de inicio en formato Postgres time ("18:00:00"). */
  horario?: string | null;
  /** Día de cursada: 0 = lunes ... 6 = domingo. Si falta, se ancla al día del alta. */
  dia_semana?: number | null;
  /** Fecha límite de la recurrencia (inclusive). Sin ella, el taller se repite indefinidamente. */
  fecha_fin?: string | null;
  activo: boolean;
  created_at: string;
}

interface EventoRow {
  id: string;
  titulo: string;
  descripcion?: string;
  categoria?: string;
  fecha: string;
  activo: boolean;
  disponible: boolean;
  imagen_url?: string;
  link_tickets?: string;
}

/** Días entre ocurrencias para las frecuencias de intervalo fijo (ver FormAgenda.tsx). */
const DIAS_POR_FRECUENCIA: Record<string, number> = {
  Semanal: 7,
  Quincenal: 14,
};

/** Meses entre ocurrencias para las frecuencias mensuales (ver FormAgenda.tsx). */
const MESES_POR_FRECUENCIA: Record<string, number> = {
  Mensual: 1,
  Bimensual: 2,
  Trimestral: 3,
};

/** Avanza la fecha hasta el próximo día de la semana pedido (0 = lunes ... 6 = domingo), sin retroceder. */
function ajustarADiaSemana(fecha: Date, diaSemana: number): Date {
  const objetivoJs = (diaSemana + 1) % 7; // convención de getDay(): 0 = domingo
  const f = new Date(fecha);
  f.setDate(f.getDate() + ((objetivoJs - f.getDay() + 7) % 7));
  return f;
}

/** Devuelve una copia de la fecha con la hora del horario ("18:00:00") aplicada, para ordenar dentro del día. */
function conHorario(fecha: Date, horario?: string | null): Date {
  const f = new Date(fecha);
  if (!horario) return f;
  const [h, m] = horario.split(':').map(Number);
  f.setHours(h || 0, m || 0, 0, 0);
  return f;
}

/** Hora para mostrar ("18:00") a partir de la fecha de un evento; oculta la medianoche (hora sin cargar). */
function horaDeFecha(fecha: Date): string | undefined {
  if (fecha.getHours() === 0 && fecha.getMinutes() === 0) return undefined;
  return `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}`;
}

/**
 * Genera las ocurrencias de un taller/actividad recurrente dentro de [desde, hasta],
 * anclando la repetición a su fecha de alta (created_at) ya que "agenda" no guarda
 * una fecha de inicio explícita ni día de la semana.
 */
function expandirAgenda(item: AgendaRow, desde: Date, hasta: Date): CalendarioOcurrencia[] {
  let anchor = new Date(item.created_at);
  if (isNaN(anchor.getTime())) return [];

  // Si el taller tiene día de cursada, correr el ancla al primer día que coincida.
  // Los intervalos semanales/quincenales (múltiplos de 7 días) preservan el día de ahí en más.
  const tieneDia = typeof item.dia_semana === 'number' && item.dia_semana >= 0 && item.dia_semana <= 6;
  if (tieneDia) anchor = ajustarADiaSemana(anchor, item.dia_semana!);

  // La recurrencia no debe extenderse más allá de su fecha de finalización, si tiene una cargada.
  if (item.fecha_fin) {
    const limite = new Date(`${item.fecha_fin}T23:59:59`);
    if (!isNaN(limite.getTime()) && limite < hasta) hasta = limite;
    if (limite < desde) return [];
  }

  const ocurrencias: CalendarioOcurrencia[] = [];
  const base: Omit<CalendarioOcurrencia, 'fecha'> = {
    id: item.id,
    tipo: 'agenda',
    titulo: item.titulo,
    categoria: item.categoria,
    descripcion: item.descripcion,
    href: item.slug ? `/agenda/${item.slug}` : undefined,
    hora: item.horario ? item.horario.slice(0, 5) : undefined,
    serieId: item.id,
  };

  const diasIntervalo = item.frecuencia ? DIAS_POR_FRECUENCIA[item.frecuencia] : undefined;
  const mesesIntervalo = item.frecuencia ? MESES_POR_FRECUENCIA[item.frecuencia] : undefined;

  if (diasIntervalo) {
    const msIntervalo = diasIntervalo * 24 * 60 * 60 * 1000;
    let cursor = new Date(anchor);
    if (cursor < desde) {
      const saltos = Math.floor((desde.getTime() - cursor.getTime()) / msIntervalo);
      cursor = new Date(cursor.getTime() + saltos * msIntervalo);
    }
    while (cursor <= hasta) {
      if (cursor >= desde) {
        ocurrencias.push({ ...base, id: `${item.id}-${cursor.toISOString().slice(0, 10)}`, fecha: conHorario(cursor, item.horario) });
      }
      cursor = new Date(cursor.getTime() + msIntervalo);
    }
  } else if (mesesIntervalo) {
    let cursor = new Date(anchor);
    while (cursor < desde) {
      cursor.setMonth(cursor.getMonth() + mesesIntervalo);
    }
    while (cursor <= hasta) {
      // Sumar meses corre el día de la semana: si hay día de cursada, ajustar cada ocurrencia.
      const fechaOcurrencia = tieneDia ? ajustarADiaSemana(cursor, item.dia_semana!) : new Date(cursor);
      if (fechaOcurrencia >= desde && fechaOcurrencia <= hasta) {
        ocurrencias.push({ ...base, id: `${item.id}-${fechaOcurrencia.toISOString().slice(0, 10)}`, fecha: conHorario(fechaOcurrencia, item.horario) });
      }
      cursor = new Date(cursor);
      cursor.setMonth(cursor.getMonth() + mesesIntervalo);
    }
  } else {
    // Frecuencia desconocida o ausente: mostramos solo la ocurrencia ancla si cae en el rango.
    if (anchor >= desde && anchor <= hasta) {
      ocurrencias.push({ ...base, fecha: conHorario(anchor, item.horario) });
    }
  }

  return ocurrencias;
}

function mapearEvento(item: EventoRow): CalendarioOcurrencia | null {
  const fecha = new Date(item.fecha);
  if (isNaN(fecha.getTime())) return null;
  return {
    id: item.id,
    tipo: 'evento',
    titulo: item.titulo,
    categoria: item.categoria,
    descripcion: item.descripcion,
    fecha,
    hora: horaDeFecha(fecha),
    linkExterno: item.link_tickets || undefined,
    imagen_url: item.imagen_url,
    disponible: item.disponible,
  };
}

/** Rango de fechas cubierto por la grilla visible del mes (incluye días de relleno de semanas incompletas). */
export function rangoDelMes(mesVisible: Date): { desde: Date; hasta: Date } {
  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();
  const primerDia = new Date(anio, mes, 1);
  const ultimoDia = new Date(anio, mes + 1, 0);
  const offsetInicio = (primerDia.getDay() + 6) % 7;

  const desde = new Date(anio, mes, 1 - offsetInicio);
  const celdasTotales = Math.ceil((offsetInicio + ultimoDia.getDate()) / 7) * 7;
  const hasta = new Date(anio, mes, 1 - offsetInicio + celdasTotales - 1, 23, 59, 59);

  return { desde, hasta };
}

export function construirOcurrencias(
  agendaRows: AgendaRow[],
  eventoRows: EventoRow[],
  desde: Date,
  hasta: Date,
): CalendarioOcurrencia[] {
  const deAgenda = agendaRows
    .filter(item => item.activo)
    .flatMap(item => expandirAgenda(item, desde, hasta));

  const deEventos = eventoRows
    .filter(item => item.activo)
    .map(mapearEvento)
    .filter((o): o is CalendarioOcurrencia => o !== null)
    .filter(o => o.fecha >= desde && o.fecha <= hasta);

  return [...deAgenda, ...deEventos].sort((a, b) => a.fecha.getTime() - b.fecha.getTime());
}
