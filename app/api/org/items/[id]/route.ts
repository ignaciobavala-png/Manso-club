import { NextResponse, type NextRequest } from 'next/server';
import { adminOrg, haySesionOrg } from '@/lib/org';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** Edita el texto de un ítem o lo tilda/destilda como resuelto. */
export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id } = await params;

  const b = (await req.json().catch(() => null)) as { texto?: unknown; hecho?: unknown } | null;
  const cambios: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof b?.texto === 'string') {
    const t = b.texto.trim().slice(0, 600);
    if (!t) return NextResponse.json({ error: 'El texto no puede quedar vacío.' }, { status: 400 });
    cambios.texto = t;
  }
  if (typeof b?.hecho === 'boolean') cambios.hecho = b.hecho;
  if (Object.keys(cambios).length === 1) return NextResponse.json({ error: 'Nada para cambiar.' }, { status: 400 });

  const { error } = await adminOrg().from('org_items').update(cambios).eq('id', id);
  if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id } = await params;
  const { error } = await adminOrg().from('org_items').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'No se pudo borrar.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
