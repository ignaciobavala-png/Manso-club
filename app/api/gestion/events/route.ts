import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch(`${process.env.GESTION_API_URL}/api/crm/events`, {
    headers: { 'x-crm-secret': process.env.GESTION_CRM_SECRET! },
    next: { revalidate: 60 },
  });

  if (!res.ok) return NextResponse.json({ error: 'Error al obtener eventos' }, { status: res.status });
  return NextResponse.json(await res.json());
}
