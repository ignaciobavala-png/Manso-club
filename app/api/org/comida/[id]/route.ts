import { NextResponse, type NextRequest } from 'next/server';
import { adminOrg, haySesionOrg } from '@/lib/org';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { id } = await params;
  const { error } = await adminOrg().from('org_comida').delete().eq('id', id);
  if (error) return NextResponse.json({ error: 'No se pudo borrar.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
