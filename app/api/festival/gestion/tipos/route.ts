import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase';
import {
  borrarTipoGestion,
  ErrorGestion,
  guardarTipoGestion,
  tiposAdminGestion,
  ventaEnGestion,
  type TipoGuardar,
} from '@/lib/gestion-entradas';

/**
 * Ana edita desde el panel los tipos de entrada que viven en Manso Gestión
 * (precio, cupo, estado, packs). Los datos no se copian acá: cada guardado es
 * una RPC contra Gestión, así el stock sigue siendo uno solo.
 */
async function esAdmin() {
  const auth = await createSupabaseServer();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) return false;
  const { data: role } = await auth.rpc('get_user_role', { user_id: user.id });
  return role === 'admin';
}

const ESTADOS = ['en_venta', 'proximamente', 'agotado', 'finalizado'];

/** Errores que Gestión explica en castellano y que Ana puede corregir ella misma. */
function respuestaError(e: unknown, mensaje: string) {
  if (e instanceof ErrorGestion && ['datos_invalidos', 'tipo_con_ventas', 'tipo_inexistente'].includes(e.codigo)) {
    return NextResponse.json({ error: e.message.replace(/^[a-z_]+: [a-z_]+: /, '') }, { status: 422 });
  }
  console.error(`${mensaje}:`, e);
  return NextResponse.json({ error: mensaje }, { status: 500 });
}

export async function GET() {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!ventaEnGestion()) return NextResponse.json({ error: 'La venta no está conectada a Gestión' }, { status: 409 });
  try {
    return NextResponse.json({ tipos: await tiposAdminGestion() });
  } catch (e) {
    return respuestaError(e, 'No se pudieron leer los tipos de Gestión');
  }
}

export async function POST(request: Request) {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!ventaEnGestion()) return NextResponse.json({ error: 'La venta no está conectada a Gestión' }, { status: 409 });

  const b = (await request.json().catch(() => null)) as Partial<TipoGuardar> | null;
  const entero = (v: unknown) => (v === null || v === undefined ? null : Number.isInteger(v) ? (v as number) : NaN);
  if (
    !b ||
    typeof b.nombre !== 'string' ||
    typeof b.precio !== 'number' ||
    !ESTADOS.includes(b.estado as string) ||
    Number.isNaN(entero(b.cupo)) ||
    Number.isNaN(entero(b.max_por_compra)) ||
    !Number.isInteger(b.entradas_por_unidad)
  ) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }

  try {
    const id = await guardarTipoGestion({
      id: b.id,
      nombre: b.nombre,
      descripcion: typeof b.descripcion === 'string' ? b.descripcion : null,
      precio: b.precio,
      entradas_por_unidad: b.entradas_por_unidad!,
      cupo: entero(b.cupo),
      max_por_compra: entero(b.max_por_compra),
      estado: b.estado!,
      activo: b.activo !== false,
    });
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return respuestaError(e, 'No se pudo guardar el tipo');
  }
}

export async function DELETE(request: Request) {
  if (!(await esAdmin())) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  if (!ventaEnGestion()) return NextResponse.json({ error: 'La venta no está conectada a Gestión' }, { status: 409 });
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el id' }, { status: 400 });
  try {
    await borrarTipoGestion(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return respuestaError(e, 'No se pudo borrar el tipo');
  }
}
