import { NextRequest, NextResponse } from 'next/server';
import { adminFestival } from '@/lib/festival-compra';
import { esIdioma, type Idioma } from '@/lib/festival-idioma';
import {
  AREAS,
  CONFIG_VOLUNTARIOS_POR_DEFECTO,
  COMO_TE_ENTERASTE,
  IDIOMAS,
  convocatoriaAbierta,
  normalizarTelefono,
  validarPostulacion,
  type ConfigVoluntarios,
  type Postulacion,
} from '@/lib/festival-voluntarios';
import { enviarConfirmacion } from '@/lib/festival-voluntarios-servidor';

/**
 * Recibe las postulaciones de /blur/voluntarios. Es el único camino de
 * escritura: las tablas no tienen insert público. Valida de nuevo todo lo que
 * el formulario ya validó (el brief lo pide: lo que llega es input de
 * cualquiera) y, por la misma razón, recorta las listas a los valores que
 * existen.
 *
 * Anti-spam, sin captcha visible: un campo señuelo (`sitio_web`) que una
 * persona no ve y un bot llena, y un piso de tiempo desde que se mostró el
 * formulario. En los dos casos se responde que salió bien, para no darle
 * pistas al bot. Turnstile quedó afuera hasta tener las claves.
 */

const MAX_BYTES = 20_000;
const MIN_MS_DE_LLENADO = 4_000;

// Tope por IP, en memoria: en serverless cada instancia tiene el suyo, así que
// frena a un script torpe y no a uno decidido. Alcanza para este volumen.
const VENTANA_MS = 10 * 60_000;
const MAX_POR_VENTANA = 6;
const intentos = new Map<string, number[]>();

function demasiados(ip: string): boolean {
  const ahora = Date.now();
  const recientes = (intentos.get(ip) ?? []).filter(t => ahora - t < VENTANA_MS);
  recientes.push(ahora);
  intentos.set(ip, recientes);
  // Que el mapa no crezca sin límite.
  if (intentos.size > 2000) {
    for (const [k, v] of intentos) if (v.every(t => ahora - t >= VENTANA_MS)) intentos.delete(k);
  }
  return recientes.length > MAX_POR_VENTANA;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const texto = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const lista = (v: unknown, validos: readonly string[]) =>
  Array.isArray(v) ? [...new Set(v.filter((x): x is string => typeof x === 'string' && validos.includes(x)))] : [];

async function leerConfig(): Promise<ConfigVoluntarios> {
  const { data } = await adminFestival().from('festival_voluntarios_config').select('*').eq('id', 1).maybeSingle();
  return { ...CONFIG_VOLUNTARIOS_POR_DEFECTO, ...(data ?? {}) } as ConfigVoluntarios;
}

/** Sin la fila de publicación en `true`, la página da 404: tampoco se acepta nada por la API. */
async function festivalPublicado(): Promise<boolean> {
  const { data } = await adminFestival().from('festival_config').select('publicado').eq('id', 1).maybeSingle();
  return Boolean(data?.publicado);
}

export async function POST(request: NextRequest) {
  const crudo = await request.text();
  if (crudo.length > MAX_BYTES) return NextResponse.json({ error: 'Pedido inválido' }, { status: 413 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ error: 'Pedido inválido' }, { status: 400 });
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'sin-ip';
  if (demasiados(ip)) return NextResponse.json({ error: 'Demasiados intentos' }, { status: 429 });

  // Señuelo lleno o formulario "enviado" en menos de lo que tarda en leerse: bot.
  const bot = texto(body.sitio_web, 200) !== '';
  const apurado = typeof body.ms !== 'number' || body.ms < MIN_MS_DE_LLENADO;

  if (!(await festivalPublicado())) return NextResponse.json({ error: 'No disponible' }, { status: 404 });
  const config = await leerConfig();
  if (!convocatoriaAbierta(config) && body.modo !== 'aviso') {
    return NextResponse.json({ error: 'cerrada' }, { status: 409 });
  }

  const supabase = adminFestival();

  // ── Convocatoria cerrada: un solo campo, el mail para la próxima edición ──
  if (body.modo === 'aviso') {
    const email = texto(body.email, 200).toLowerCase();
    if (!EMAIL.test(email)) return NextResponse.json({ error: 'email' }, { status: 400 });
    if (bot || apurado) return NextResponse.json({ ok: true });
    // Ya estaba anotado: el índice único lo rechaza y a la persona le damos igual el "listo".
    const { error } = await supabase.from('festival_voluntarios_aviso').insert({ email });
    if (error && error.code !== '23505') {
      console.error('No se pudo guardar el aviso de voluntarios:', error.message);
      return NextResponse.json({ error: 'guardar' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  }

  // ── Postulación ──
  const p: Postulacion = {
    nombre: texto(body.nombre, 200),
    email: texto(body.email, 200),
    whatsapp: texto(body.whatsapp, 40),
    fecha_nacimiento: texto(body.fecha_nacimiento, 10),
    areas: lista(body.areas, AREAS),
    disponibilidad: lista(body.disponibilidad, config.disponibilidad),
    experiencia: body.experiencia === 'si' ? 'si' : body.experiencia === 'no' ? 'no' : '',
    experiencia_detalle: texto(body.experiencia_detalle, 600),
    idiomas: lista(body.idiomas, IDIOMAS),
    idiomas_otro: texto(body.idiomas_otro, 80),
    motivo: texto(body.motivo, 700),
    con_quien: texto(body.con_quien, 300),
    como_te_enteraste: COMO_TE_ENTERASTE.includes(body.como_te_enteraste as never) ? (body.como_te_enteraste as string) : '',
    acepta_datos: body.acepta_datos === true,
    novedades: body.novedades === true,
  };

  const errores = validarPostulacion(p, config);
  if (Object.keys(errores).length > 0) return NextResponse.json({ error: 'validacion', errores }, { status: 400 });
  if (bot || apurado) return NextResponse.json({ ok: true });

  const idioma: Idioma = esIdioma(body.idioma) ? body.idioma : 'es';
  const email = p.email.toLowerCase();

  // Mismo mail ya cargado: se acepta igual y queda marcado para que producción decida.
  const { data: previa } = await supabase
    .from('festival_voluntarios')
    .select('id')
    .ilike('email', email.replace(/[%_\\]/g, '\\$&'))
    .limit(1)
    .maybeSingle();

  const { data: fila, error } = await supabase
    .from('festival_voluntarios')
    .insert({
      nombre: p.nombre,
      email,
      whatsapp: normalizarTelefono(p.whatsapp),
      fecha_nacimiento: p.fecha_nacimiento,
      // La columna es NOT NULL de la migración original; el formulario ya no la pide.
      ciudad: '',
      areas: p.areas,
      disponibilidad: p.disponibilidad,
      experiencia: p.experiencia === 'si',
      experiencia_detalle: p.experiencia === 'si' ? p.experiencia_detalle || null : null,
      idiomas: p.idiomas,
      idiomas_otro: p.idiomas.includes('Otro') ? p.idiomas_otro || null : null,
      motivo: p.motivo,
      con_quien: p.con_quien || null,
      como_te_enteraste: p.como_te_enteraste,
      acepta_datos: true,
      novedades: p.novedades,
      utm_source: texto(body.utm_source, 100) || null,
      utm_medium: texto(body.utm_medium, 100) || null,
      utm_campaign: texto(body.utm_campaign, 100) || null,
      idioma_pagina: idioma,
      duplicado: Boolean(previa),
    })
    .select('id')
    .single();

  if (error || !fila) {
    console.error('No se pudo guardar la postulación de voluntariado:', error?.message);
    return NextResponse.json({ error: 'guardar' }, { status: 500 });
  }

  // Después de guardar: si el mail falla, la postulación ya está y se ve en el panel sin "mail enviado".
  const { data: festival } = await supabase.from('festival_config').select('email').eq('id', 1).maybeSingle();
  const salio = await enviarConfirmacion(email, idioma, p.nombre.split(/\s+/)[0], p.areas, festival?.email ?? null);
  if (salio) {
    await supabase.from('festival_voluntarios').update({ mail_confirmacion_at: new Date().toISOString() }).eq('id', fila.id);
  }

  return NextResponse.json({ ok: true });
}
