import { NextResponse, type NextRequest } from 'next/server';
import { AREA_ARTISTAS, AREAS_STAFF, COMER_ARTISTA, COMER_CHARLA, COMIDAS, LINEUP_HOSP, BEBIDAS, DIETAS, adminOrg, esTipoComida, haySesionOrg, tokenComidaValido } from '@/lib/org';

export const dynamic = 'force-dynamic';

const COLUMNAS = 'id, created_at, tipo, nombre, area, comidas, dieta, alergias, bebida, extras, escenario, horario, comer, bebida_set';
/** Tope de filas: el link circula por WhatsApp, esto frena a un bot que lo encuentre. */
const TOPE = 500;

const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
/** Solo valores de la lista: lo que mande el navegador fuera de ella se descarta. */
const lista = (v: unknown, permitidos: readonly string[]) =>
  Array.isArray(v) ? permitidos.filter((p) => v.includes(p)) : [];

/** Abierto a quien tenga el link (lleva un código): carga su comida. Si el nombre ya estaba en ese formulario, se actualiza (no se duplica). */
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  // Sin `tipo` es el formulario original (artistas). Cada tipo tiene su código: el de uno no abre otro.
  const tipo = b.tipo === undefined ? 'artistas' : b.tipo;
  if (!esTipoComida(tipo) || !tokenComidaValido(b.token, tipo)) return NextResponse.json({ error: 'Link inválido.' }, { status: 403 });
  // Honeypot: un campo oculto que una persona nunca llena.
  if (texto(b.web, 50)) return NextResponse.json({ ok: true });

  // Lo común a los tres formularios; abajo, lo propio de cada uno.
  const comun = {
    tipo,
    dieta: lista(b.dieta, DIETAS),
    alergias: texto(b.alergias, 300) || null,
    bebida: lista(b.bebida, BEBIDAS),
    extras: texto(b.extras, 500) || null,
  };
  let nombre: string;
  let propio: Record<string, unknown>;

  if (tipo === 'artistas') {
    // Eligen su nombre del line-up (con escenario y horario) y dicen si comen antes o después del set.
    const artista = LINEUP_HOSP.find((a) => a.n === texto(b.artista, 120));
    const comer = (COMER_ARTISTA as readonly string[]).find((c) => c === b.comer);
    if (!artista || !comer) return NextResponse.json({ error: 'Elegí tu nombre y cuándo querés comer.' }, { status: 400 });
    nombre = artista.n;
    propio = { escenario: artista.stage, horario: artista.time, comer, bebida_set: texto(b.bebida_set, 300) || null, area: AREA_ARTISTAS, comidas: [] };
  } else if (tipo === 'charlas') {
    // No hay lista cerrada de panelistas: escriben su nombre y de qué charla o panel son.
    nombre = texto(b.nombre, 120);
    const charla = texto(b.charla, 160);
    const comer = (COMER_CHARLA as readonly string[]).find((c) => c === b.comer);
    if (!nombre || !charla || !comer) return NextResponse.json({ error: 'Completá tu nombre, tu charla y cuándo querés comer.' }, { status: 400 });
    propio = { escenario: charla, horario: texto(b.horario, 60) || null, comer, bebida_set: texto(b.bebida_set, 300) || null, area: 'Panel de charlas', comidas: [] };
  } else {
    // Staff: nombre, área y qué comidas necesita ese día.
    nombre = texto(b.nombre, 120);
    const area = (AREAS_STAFF as readonly string[]).find((a) => a === b.area);
    const comidas = lista(b.comidas, COMIDAS);
    if (!nombre || !area || comidas.length === 0) return NextResponse.json({ error: 'Completá tu nombre, tu área y qué comidas necesitás.' }, { status: 400 });
    propio = { area, comidas };
  }
  const fila = { ...comun, ...propio, nombre };

  const db = adminOrg();
  const { data: previa } = await db.from('org_comida').select('id').eq('tipo', tipo).ilike('nombre', nombre.replace(/[%_\\]/g, '\\$&')).limit(1);
  if (previa?.length) {
    const { error } = await db.from('org_comida').update(fila).eq('id', previa[0].id);
    if (error) return NextResponse.json({ error: 'No se pudo guardar.' }, { status: 500 });
    return NextResponse.json({ ok: true, actualizado: true });
  }
  const { count } = await db.from('org_comida').select('id', { count: 'exact', head: true }).eq('tipo', tipo);
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
