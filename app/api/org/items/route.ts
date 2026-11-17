import { NextResponse, type NextRequest } from 'next/server';
import { NIVELES, adminOrg, haySesionOrg } from '@/lib/org';

export const dynamic = 'force-dynamic';

/** Suma un ítem al final de un nivel de un espacio. */
export async function POST(req: NextRequest) {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const b = (await req.json().catch(() => null)) as
    | { espacio_id?: unknown; nivel?: unknown; texto?: unknown }
    | null;
  const texto = typeof b?.texto === 'string' ? b.texto.trim().slice(0, 600) : '';
  const nivel = b?.nivel;
  const espacio = b?.espacio_id;
  if (!texto || typeof espacio !== 'string' || !NIVELES.includes(nivel as (typeof NIVELES)[number])) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const db = adminOrg();
  const { data: ult } = await db
    .from('org_items')
    .select('orden')
    .eq('espacio_id', espacio)
    .eq('nivel', nivel)
    .order('orden', { ascending: false })
    .limit(1);
  const orden = (ult?.[0]?.orden ?? -1) + 1;

  const { data, error } = await db
    .from('org_items')
    .insert({ espacio_id: espacio, nivel, texto, orden })
    .select('id, nivel, texto, riesgo, hecho, orden')
    .single();
  if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
  return NextResponse.json(data);
}
