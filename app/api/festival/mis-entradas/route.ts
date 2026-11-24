import { NextResponse } from 'next/server';
import { z } from 'zod';
import { leerIdioma } from '@/lib/festival-idioma-servidor';
import { mailValido, recuperarEntradas } from '@/lib/festival-recuperar';

/**
 * "Mis entradas" (ver `lib/festival-recuperar`): recibe un mail y, si tiene
 * compras pagadas, le manda el link a esa casilla. Responde 200 igual haya o no
 * compra. El navegador traduce el código de error: acá no hay copy.
 */
export const maxDuration = 30;

const Entrada = z.object({ mail: z.string().max(254), web: z.string().optional() });

export async function POST(request: Request) {
  const cuerpo = Entrada.safeParse(await request.json().catch(() => null));
  if (!cuerpo.success || !mailValido(cuerpo.data.mail.trim())) {
    return NextResponse.json({ error: 'invalido' }, { status: 400 });
  }
  // Honeypot: un campo escondido que una persona no llena. Respuesta de éxito falsa.
  if (cuerpo.data.web) return NextResponse.json({ ok: true });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'desconocida';
  const resultado = await recuperarEntradas(cuerpo.data.mail, ip, await leerIdioma());
  if (resultado === 'limite') return NextResponse.json({ error: 'limite' }, { status: 429 });
  if (resultado === 'caido') return NextResponse.json({ error: 'caido' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
