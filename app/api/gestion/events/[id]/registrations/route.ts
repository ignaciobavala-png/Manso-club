import { NextResponse } from 'next/server';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const res = await fetch(`${process.env.GESTION_API_URL}/api/crm/events/${id}/registrations`, {
    headers: { 'x-crm-secret': process.env.GESTION_CRM_SECRET! },
    next: { revalidate: 60 },
  });

  if (!res.ok) return NextResponse.json({ error: 'Error al obtener registraciones' }, { status: res.status });
  return NextResponse.json(await res.json());
}
