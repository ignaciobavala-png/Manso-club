import { NextResponse } from 'next/server';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { exigirAdmin, getModeloIA } from '@/lib/ia';

export const maxDuration = 60;

const Entrada = z.object({
  idea: z.string().trim().min(10, 'Contame un poco más: qué querés comunicar.').max(1500),
  tono: z.enum(['cercano', 'institucional', 'entusiasta']).default('cercano'),
});

const Salida = z.object({
  asunto: z.string().describe('Máximo 60 caracteres.'),
  preheader: z.string().describe('Máximo 90 caracteres. Complementa el asunto, no lo repite.'),
  parrafos: z.array(z.string()).min(1).max(6).describe('Texto plano, 1 a 3 oraciones por párrafo.'),
  faltan: z.array(z.string()).describe('Datos que el mail necesita y el pedido no trajo (cada uno marcado [COMPLETAR] en el texto).'),
});

const TONOS: Record<z.infer<typeof Entrada>['tono'], string> = {
  cercano: 'Cercano y directo, como le escribirías a alguien de la comunidad.',
  institucional: 'Sobrio y claro, sin coloquialismos.',
  entusiasta: 'Con energía y ganas, sin caer en exageraciones ni signos de exclamación en cadena.',
};

const SISTEMA = `Sos quien redacta los mails de Manso Club, un espacio cultural y cowork creativo de Buenos Aires (eventos, talleres, membresías, festival).

Reglas:
- Español rioplatense, con voseo. Sin emojis. Sin frases de marketing vacías.
- NUNCA inventes fechas, horarios, precios, lugares, nombres de artistas ni links. Usá solo lo que trae el pedido.
- Si el mail necesita un dato que el pedido no trae, escribí [COMPLETAR] en ese lugar y listá qué falta en "faltan".
- Texto plano: sin Markdown ni HTML.
- El asunto no supera los 60 caracteres y el preheader los 90.`;

export async function POST(request: Request) {
  const auth = await exigirAdmin();
  if (!auth.ok) return auth.respuesta;

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }
  const entrada = Entrada.safeParse(cuerpo);
  if (!entrada.success) {
    return NextResponse.json({ error: entrada.error.issues[0]?.message ?? 'Datos inválidos' }, { status: 400 });
  }

  try {
    const { output } = await generateText({
      model: getModeloIA(),
      system: `${SISTEMA}\n\nTono: ${TONOS[entrada.data.tono]}`,
      prompt: entrada.data.idea,
      output: Output.object({ schema: Salida }),
      // Redactar un mail corto no necesita razonar: apagarlo lo hace más rápido y barato,
      // y habilita temperature (que no rige con thinking activado).
      providerOptions: { deepseek: { thinking: { type: 'disabled' } } },
      temperature: 0.7,
      maxOutputTokens: 900,
      abortSignal: request.signal,
    });

    return NextResponse.json({
      asunto: output.asunto.trim().slice(0, 80),
      preheader: output.preheader.trim().slice(0, 120),
      parrafos: output.parrafos.map(p => p.trim()).filter(Boolean),
      faltan: output.faltan,
    });
  } catch (err) {
    console.error('[ia/mailing]', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'No se pudo redactar ahora. Probá de nuevo en un momento.' }, { status: 502 });
  }
}
