import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Todo lo que el asistente quiere HACER (mandar un mail) pasa por una
 * aprobación humana. El modelo solo puede proponer; la propuesta sale firmada
 * del servidor y el botón "Enviar" de la pantalla la devuelve. Sin firma válida
 * (o vencida, o de otra persona) no se ejecuta nada, así que ni un prompt
 * malicioso ni un cliente trucho pueden mandar un mail que nadie aprobó.
 */
export interface PropuestaMail {
  para: string;
  asunto: string;
  texto: string;
}

const VIGENCIA_MS = 15 * 60 * 1000;

function secreto(): string {
  const s = process.env.IA_APROBACION_SECRET || process.env.DEEPSEEK_API_KEY;
  if (!s) throw new Error('Falta IA_APROBACION_SECRET (o DEEPSEEK_API_KEY) para firmar propuestas.');
  return s;
}

function firmar(userId: string, exp: number, p: PropuestaMail): string {
  return createHmac('sha256', secreto())
    .update(JSON.stringify([userId, exp, p.para, p.asunto, p.texto]))
    .digest('hex');
}

export function firmarPropuesta(userId: string, p: PropuestaMail) {
  const exp = Date.now() + VIGENCIA_MS;
  return { propuesta: p, exp, firma: firmar(userId, exp, p) };
}

export function verificarPropuesta(userId: string, p: PropuestaMail, exp: number, firma: string): boolean {
  if (!Number.isFinite(exp) || Date.now() > exp) return false;
  const esperada = firmar(userId, exp, p);
  if (esperada.length !== firma.length) return false;
  return timingSafeEqual(Buffer.from(esperada), Buffer.from(firma));
}
