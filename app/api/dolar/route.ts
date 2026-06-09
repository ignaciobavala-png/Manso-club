import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
  try {
    const res = await fetch('https://dolarapi.com/v1/dolares/blue', {
      next: { revalidate: 300 }, // cache 5 min en el servidor
    });

    if (!res.ok) throw new Error('dolarapi error');

    const data = await res.json();
    return NextResponse.json({
      compra: data.compra,
      venta: data.venta,
      nombre: data.nombre,
      fechaActualizacion: data.fechaActualizacion,
    });
  } catch {
    return NextResponse.json({ error: 'No se pudo obtener la cotización' }, { status: 502 });
  }
}
