import { NextResponse, type NextRequest } from 'next/server';
import { ORG_COOKIE, ORG_SESION_DIAS, adminOrg, claveCorrecta, crearToken, hashIp, orgConfigurada } from '@/lib/org';

export const dynamic = 'force-dynamic';

/** La clave es corta: 5 errores en 15 minutos y esa IP queda frenada un rato. */
const MAX_ERRORES = 5;
const VENTANA_MIN = 15;

export async function POST(req: NextRequest) {
  if (!orgConfigurada()) {
    return NextResponse.json({ error: 'La sección no está configurada.' }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as { clave?: unknown } | null;
  const clave = typeof body?.clave === 'string' ? body.clave : '';

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sin-ip';
  const ipHash = hashIp(ip);
  const db = adminOrg();

  const desde = new Date(Date.now() - VENTANA_MIN * 60_000).toISOString();
  const { count, error } = await db
    .from('org_intentos')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', desde);
  // Si la base no contesta se corta, en vez de dejar probar claves sin freno.
  if (error) return NextResponse.json({ error: 'Probá de nuevo en un momento.' }, { status: 503 });
  if ((count ?? 0) >= MAX_ERRORES) {
    return NextResponse.json({ error: 'Demasiados intentos. Esperá unos minutos.' }, { status: 429 });
  }

  if (!claveCorrecta(clave)) {
    await db.from('org_intentos').insert({ ip_hash: ipHash });
    return NextResponse.json({ error: 'Clave incorrecta.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ORG_COOKIE, crearToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ORG_SESION_DIAS * 86_400,
  });
  return res;
}
