import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * /org — mapas de experiencia de la organización de BLUR.
 *
 * Acceso con una clave compartida (`ORG_PASS`, en el entorno y nunca en el
 * repo). Como la clave es corta, el login frena la fuerza bruta con
 * `org_intentos` (ver /api/org/login). La sesión es una cookie httpOnly firmada
 * con HMAC que vence a los 30 días; no hay cuentas por persona.
 */

export * from './org-tipos';
import type { OrgComida, OrgTarea, TipoComida } from './org-tipos';

export const ORG_COOKIE = 'org_sesion';
export const ORG_SESION_DIAS = 30;

export const NIVELES = ['staff', 'sen', 'tou', 'nec', 'her', 'des', 'dol', 'emo'] as const;
export type Nivel = (typeof NIVELES)[number];

/** Service role: las tablas org_* no tienen ninguna policy pública. */
export function adminOrg(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Sin `ORG_PASS` cargada la sección queda cerrada para todos. */
export const orgConfigurada = () => Boolean(process.env.ORG_PASS);

const secreto = () => `org|${process.env.ORG_PASS ?? ''}|${process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''}`;
const firma = (exp: string) => createHmac('sha256', secreto()).update(exp).digest('hex');

export function crearToken(): string {
  const exp = String(Date.now() + ORG_SESION_DIAS * 86_400_000);
  return `${exp}.${firma(exp)}`;
}

export function tokenValido(token: string | undefined): boolean {
  if (!token || !orgConfigurada()) return false;
  const [exp, f] = token.split('.');
  if (!exp || !f || Number(exp) < Date.now()) return false;
  const esperada = Buffer.from(firma(exp));
  const recibida = Buffer.from(f);
  return esperada.length === recibida.length && timingSafeEqual(esperada, recibida);
}

export async function haySesionOrg(): Promise<boolean> {
  return tokenValido((await cookies()).get(ORG_COOKIE)?.value);
}

/** Compara hashes del mismo largo: no filtra cuántos dígitos acertó. */
export function claveCorrecta(intento: string): boolean {
  const real = process.env.ORG_PASS;
  if (!real) return false;
  const h = (s: string) => createHash('sha256').update(s).digest();
  return timingSafeEqual(h(intento), h(real));
}

/** La IP no se guarda: solo un hash que cambia cada día. */
export function hashIp(ip: string): string {
  const dia = new Date().toISOString().slice(0, 10);
  return createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY ?? '')
    .update(`org|${ip}|${dia}`)
    .digest('hex')
    .slice(0, 24);
}

export interface OrgItem {
  id: string;
  nivel: Nivel;
  texto: string;
  riesgo: boolean;
  hecho: boolean;
  orden: number;
}
export interface OrgEspacio {
  id: string;
  nombre: string;
  plano: string | null;
  cerca: string | null;
  items: OrgItem[];
}
export interface OrgFase {
  id: string;
  nombre: string;
  espacios: OrgEspacio[];
}
export interface OrgMapa {
  id: string;
  titulo: string;
  fases: OrgFase[];
}

/** Los mapas completos, anidados y en el orden en que se cargaron. */
export async function leerMapas(): Promise<OrgMapa[]> {
  const db = adminOrg();
  const [mapas, fases, espacios, items] = await Promise.all([
    db.from('org_mapas').select('*').order('orden'),
    db.from('org_fases').select('*').order('orden'),
    db.from('org_espacios').select('*').order('orden'),
    db.from('org_items').select('id, espacio_id, nivel, texto, riesgo, hecho, orden').order('orden'),
  ]);

  const porEspacio = new Map<string, OrgItem[]>();
  for (const it of items.data ?? []) {
    const l = porEspacio.get(it.espacio_id) ?? [];
    l.push(it as OrgItem);
    porEspacio.set(it.espacio_id, l);
  }
  const espaciosPorFase = new Map<string, OrgEspacio[]>();
  for (const e of espacios.data ?? []) {
    const l = espaciosPorFase.get(e.fase_id) ?? [];
    l.push({ id: e.id, nombre: e.nombre, plano: e.plano, cerca: e.cerca, items: porEspacio.get(e.id) ?? [] });
    espaciosPorFase.set(e.fase_id, l);
  }
  return (mapas.data ?? []).map((m) => ({
    id: m.id,
    titulo: m.titulo,
    fases: (fases.data ?? [])
      .filter((f) => f.mapa_id === m.id)
      .map((f) => ({ id: f.id, nombre: f.nombre, espacios: espaciosPorFase.get(f.id) ?? [] })),
  }));
}

/** Plan de tareas por zona, en el orden del plan original. */
export async function leerTareas(): Promise<OrgTarea[]> {
  const { data } = await adminOrg()
    .from('org_tareas')
    .select('id, zona, zona_orden, area, texto, prioridad, hecho, orden')
    .order('zona_orden')
    .order('orden');
  return (data ?? []) as OrgTarea[];
}

/** Respuestas del formulario de comida, la más nueva primero. */
export async function leerComida(): Promise<OrgComida[]> {
  const { data } = await adminOrg()
    .from('org_comida')
    .select('id, created_at, tipo, nombre, area, comidas, dieta, alergias, bebida, extras, escenario, horario, comer, bebida_set')
    .order('created_at', { ascending: false });
  return (data ?? []) as OrgComida[];
}

/**
 * Código del link público de /org/comida. Sale de `ORG_PASS` con un HMAC, así que
 * no hay otra variable que cargar en Vercel: el link es estable mientras no se
 * cambie la clave, y cambiarla lo invalida (y manda a todos a pedir el nuevo).
 */
export function tokenComida(tipo: TipoComida = 'artistas'): string {
  // El de artistas conserva su semilla original: los links ya enviados siguen abriendo.
  const semilla = tipo === 'artistas' ? 'comida' : `comida-${tipo}`;
  return createHmac('sha256', secreto()).update(semilla).digest('hex').slice(0, 20);
}

export function tokenComidaValido(t: unknown, tipo: TipoComida = 'artistas'): boolean {
  if (typeof t !== 'string' || !orgConfigurada()) return false;
  const a = Buffer.from(tokenComida(tipo));
  const b = Buffer.from(t);
  return a.length === b.length && timingSafeEqual(a, b);
}
