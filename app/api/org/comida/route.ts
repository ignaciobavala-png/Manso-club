import { NextResponse, type NextRequest } from 'next/server';
import { AREA_ARTISTAS, COMER_ARTISTA, LINEUP_HOSP, BEBIDAS, DIETAS, adminOrg, haySesionOrg, tokenComidaValido } from '@/lib/org';

export const dynamic = 'force-dynamic';

const COLUMNAS = 'id, created_at, nombre, area, comidas, dieta, alergias, bebida, extras, escenario, horario, comer, bebida_set';
/** Tope de filas: el link circula por WhatsApp, esto frena a un bot que lo encuentre. */
const TOPE = 500;

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/** Solo valores de la lista: lo que mande el navegador fuera de ella se descarta. */
const lista = (v: unknown, permitidos: readonly string[]) =>
  Array.isArray(v) ? permitidos.filter((p) => v.includes(p)) : [];

/** Abierto a quien tenga el link (lleva un código): carga su comida. Si el nombre ya estaba, se actualiza (no se duplica). */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  if (!tokenComidaValido(b.token)) return NextResponse.json({ error: 'Link inválido.' }, { status: 403 });
  // Honeypot: un campo oculto que una persona nunca llena.
  if (texto(b.web, 50)) return NextResponse.json({ ok: true });

  // Solo artistas: eligen su nombre del line-up (con escenario y horario) y dicen si comen antes o después del set.
  const artista = LINEUP_HOSP.find((a) => a.n === texto(b.artista, 120));
  const comer = (COMER_ARTISTA as readonly string[]).find((c) => c === b.comer);
  if (!artista || !comer) return NextResponse.json({ error: 'Elegí tu nombre y cuándo querés comer.' }, { status: 400 });
  const nombre = artista.n;
  const fila = {
    escenario: artista.stage,
    horario: artista.time,
    comer,
    bebida_set: texto(b.bebida_set, 300) || null,
    nombre,
    area: AREA_ARTISTAS,
    comidas: [],
    dieta: lista(b.dieta, DIETAS),
    alergias: texto(b.alergias, 300) || null,
    bebida: lista(b.bebida, BEBIDAS),
    extras: texto(b.extras, 500) || null,
  };

  const db = adminOrg();
  const { data: previa } = await db.from('org_comida').select('id').ilike('nombre', nombre.replace(/[%_\\]/g, '\\$&')).limit(1);
  if (previa?.length) {
    const { error } = await db.from('org_comida').update(fila).eq('id', previa[0].id);
    if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
    return NextResponse.json({ ok: true, actualizado: true });
  }
  const { count } = await db.from('org_comida').select('id', { count: 'exact', head: true });
  if ((count ?? 0) >= TOPE) return NextResponse.json({ error: 'El formulario está cerrado.' }, { status: 429 });
  const { error } = await db.from('org_comida').insert(fila);
  if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** Solo con la clave de /org: acá hay nombres y alergias de gente real. */
export async function GET() {
  if (!(await haySesionOrg())) return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
  const { data, error } = await adminOrg().from('org_comida').select(COLUMNAS).order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: 'No se pudo leer.' }, { status: 500 });
  return NextResponse.json(data);
}
