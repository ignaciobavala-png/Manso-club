import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Todo lo que el asistente quiere HACER (mandar un mail, crear un evento) pasa
 * por una aprobación humana. El modelo solo puede proponer; la propuesta sale
 * firmada del servidor y el botón de la pantalla la devuelve. Sin firma válida
 * (o vencida, o de otra persona) no se ejecuta nada, así que ni un prompt
 * malicioso ni un cliente trucho pueden hacer algo que nadie aprobó.
 */
export interface PropuestaMail {
  para: string;
  asunto: string;
  texto: string;
}

export interface PropuestaEvento {
  titulo: string;
  /** Hora de Buenos Aires, formato YYYY-MM-DDTHH:mm. */
  fecha: string;
  fecha_fin: string | null;
  descripcion: string | null;
  categoria: string | null;
  link_tickets: string | null;
  imagen_url: string | null;
}

export type Accion =
  | { tipo: 'mail'; datos: PropuestaMail }
  | { tipo: 'evento'; datos: PropuestaEvento };

export interface AccionFirmada {
  accion: Accion;
  exp: number;
  firma: string;
}

const VIGENCIA_MS = 15 * 60 * 1000;

function secreto(): string {
  const s = process.env.IA_APROBACION_SECRET || process.env.DEEPSEEK_API_KEY;
  if (!s) throw new Error('Falta IA_APROBACION_SECRET (o DEEPSEEK_API_KEY) para firmar propuestas.');
  return s;
}

/** Orden de campos fijo: la firma no depende del orden en que llegue el JSON. */
function canon(a: Accion): unknown[] {
  if (a.tipo === 'mail') {
    const d = a.datos;
    return ['mail', d.para, d.asunto, d.texto];
  }
  const d = a.datos;
  return ['evento', d.titulo, d.fecha, d.fecha_fin, d.descripcion, d.categoria, d.link_tickets, d.imagen_url];
}

function firmar(userId: string, exp: number, a: Accion): string {
  return createHmac('sha256', secreto()).update(JSON.stringify([userId, exp, canon(a)])).digest('hex');
}

export function firmarAccion(userId: string, accion: Accion): AccionFirmada {
  const exp = Date.now() + VIGENCIA_MS;
  return { accion, exp, firma: firmar(userId, exp, accion) };
}

export function verificarAccion(userId: string, accion: Accion, exp: number, firma: string): boolean {
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const esperada = firmar(userId, exp, accion);
  if (esperada.length !== firma.length) return false;
  return timingSafeEqual(Buffer.from(esperada), Buffer.from(firma));
}
