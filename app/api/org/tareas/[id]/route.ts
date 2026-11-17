import { NextResponse, type NextRequest } from 'next/server';
import { AREAS, PRIORIDADES, adminOrg, haySesionOrg } from '@/lib/org';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Edita texto, prioridad o área de una tarea, o la tilda como hecha. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id } = await params;

  const b = (await req.json().catch(() => null)) as
    | { texto?: unknown; hecho?: unknown; prioridad?: unknown; area?: unknown }
    | null;
  const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b?.texto === 'string') {
    const t = b.texto.trim().slice(0, 600);
    if (!t) return NextResponse.json({ error: 'El texto no puede quedar vacío.' }, { status: 400 });
    cambios.texto = t;
  }
  if (typeof b?.hecho === 'boolean') cambios.hecho = b.hecho;
  if (PRIORIDADES.includes(b?.prioridad as (typeof PRIORIDADES)[number])) cambios.prioridad = b!.prioridad;
  if (AREAS.includes(b?.area as (typeof AREAS)[number])) cambios.area = b!.area;
  if (Object.keys(cambios).length === 1) return NextResponse.json({ error: 'Nada para cambiar.' }, { status: 400 });

  const { error } = await adminOrg().from('org_tareas').update(cambios).eq('id', id);
  if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id } = await params;
  const { error } = await adminOrg().from('org_tareas').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'No se pudo borrar.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
