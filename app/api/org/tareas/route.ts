import { NextResponse, type NextRequest } from 'next/server';
import { AREAS, PRIORIDADES, adminOrg, haySesionOrg } from '@/lib/org';

export const dynamic = 'force-dynamic';

/** Suma una tarea al final de su zona (la zona debe existir en el plan). */
export async function POST(req: NextRequest) {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });

  const b = (await req.json().catch(() => null)) as
    | { zona?: unknown; area?: unknown; prioridad?: unknown; texto?: unknown }
    | null;
  const texto = typeof b?.texto === 'string' ? b.texto.trim().slice(0, 600) : '';
  const zona = typeof b?.zona === 'string' ? b.zona : '';
  if (
    !texto ||
    !zona ||
    !AREAS.includes(b?.area as (typeof AREAS)[number]) ||
    !PRIORIDADES.includes(b?.prioridad as (typeof PRIORIDADES)[number])
  ) {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }

  const db = adminOrg();
  const { data: previas } = await db
    .from('org_tareas')
    .select('zona_orden, orden')
    .eq('zona', zona)
    .order('orden', { ascending: false })
    .limit(1);
  if (!previas?.length) return NextResponse.json({ error: 'Zona inexistente.' }, { status: 400 });

  const { data, error } = await db
    .from('org_tareas')
    .insert({ zona, zona_orden: previas[0].zona_orden, area: b!.area, prioridad: b!.prioridad, texto, orden: previas[0].orden + 1 })
    .select('id, zona, zona_orden, area, texto, prioridad, hecho, orden')
    .single();
  if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
  return NextResponse.json(data);
}
