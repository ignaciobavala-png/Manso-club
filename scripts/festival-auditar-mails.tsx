// Audita que cada compra pagada del festival tenga su mail de entradas entregado.
//
//   pnpm festival:auditar                       # solo informa (no toca nada)
//   pnpm festival:auditar --reenviar            # reenvía a los dudosos (pide confirmar)
//   pnpm festival:auditar --reenviar --si       # ídem, sin preguntar
//   pnpm festival:auditar --orden <id|email>    # limita a una orden o comprador
//
// Variables (de `vercel env pull .env.production.local`, no del repo):
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, MP_ACCESS_TOKEN
// Se cargan con `node --env-file` si pasás la ruta en ENV_FILE, o ya exportadas.
//
// Qué mira:
//  1. Resend: para cada orden pagada con total > 0, el último evento del mail
//     "Tus entradas…" enviado a su casilla (delivered / bounced / complained / sin registro).
//     `mail_enviado = true` no alcanza: se marca ANTES de llamar a Resend.
//  2. Mercado Pago: para cada orden de MP aún pendiente, si MP tiene un pago aprobado
//     con su external_reference (webhook perdido). Solo informa; confirmarlo es
//     `--reenviar`, que además emite la orden con `confirmarPagoMP`.
//
// Dudoso = sin registro en Resend, o último evento distinto de delivered/opened/clicked.
// Resend solo guarda unos días de historial: si una orden es vieja, aparece "sin registro"
// aunque se haya entregado; el reenvío es inofensivo (el mail lleva los mismos QR).
import { createInterface } from 'node:readline/promises';
import { existsSync, readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const REENVIAR = args.includes('--reenviar');
const SI = args.includes('--si');
const filtro = args.includes('--orden') ? args[args.indexOf('--orden') + 1]?.toLowerCase() : null;

// Carga mínima de un .env si se indica (sin dependencias).
const envFile = process.env.ENV_FILE;
if (envFile && existsSync(envFile)) {
  for (const l of readFileSync(envFile, 'utf8').split('\n')) {
    const m = l.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
  }
}
for (const k of ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY']) {
  if (!process.env[k]) {
    console.error(`Falta ${k}. Exportala o pasá ENV_FILE=<ruta>.`);
    process.exit(1);
  }
}

type Fila = { id: string; nombre: string; email: string; metodo: string; estado: string; total_ars: number; cantidad_entradas: number; mail_enviado: boolean; created_at: string };
type MailResend = { id: string; to: string[]; subject: string; last_event: string; created_at: string };

const BIEN = new Set(['delivered', 'opened', 'clicked']);

async function mailsDeResend(): Promise<MailResend[]> {
  const todos: MailResend[] = [];
  let after: string | undefined;
  for (let pagina = 0; pagina < 200; pagina++) {
    const url = new URL('https://api.resend.com/emails');
    url.searchParams.set('limit', '100');
    if (after) url.searchParams.set('after', after);
    const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` } });
    if (r.status === 429) {
      await new Promise(res => setTimeout(res, 1500));
      pagina--;
      continue;
    }
    if (!r.ok) throw new Error(`Resend ${r.status}: ${await r.text()}`);
    const j = (await r.json()) as { data: MailResend[]; has_more: boolean };
    todos.push(...j.data);
    if (!j.has_more || j.data.length === 0) break;
    after = j.data[j.data.length - 1].id;
  }
  return todos;
}

async function pagoAprobadoMP(ordenId: string): Promise<{ id: number; monto: number } | null> {
  const url = new URL('https://api.mercadopago.com/v1/payments/search');
  url.searchParams.set('external_reference', `festival:${ordenId}`);
  const r = await fetch(url, { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } });
  if (!r.ok) throw new Error(`MP ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { results: { id: number; status: string; transaction_amount: number }[] };
  const ok = j.results.find(p => p.status === 'approved');
  return ok ? { id: ok.id, monto: ok.transaction_amount } : null;
}

async function main() {
  // Import dinámico: lib/resend.ts lee RESEND_FROM_EMAIL al cargarse, y tiene que ser después del .env.
  const { adminFestival, confirmarPagoMP, enviarMailTickets } = await import('../lib/festival-compra');
  const supabase = adminFestival();
  const { data, error } = await supabase
    .from('festival_ordenes')
    .select('id, nombre, email, metodo, estado, total_ars, cantidad_entradas, mail_enviado, created_at')
    .order('created_at', { ascending: false })
    .limit(2000);
  if (error) throw error;
  const ordenes = ((data ?? []) as Fila[]).filter(o => !filtro || o.id.toLowerCase().startsWith(filtro) || o.email.toLowerCase() === filtro);

  // ── 1. Mails de las pagadas ────────────────────────────────────────────
  const pagadas = ordenes.filter(o => o.estado === 'pagada' && Number(o.total_ars) > 0);
  console.log(`Leyendo el historial de Resend… (${pagadas.length} órdenes pagadas a revisar)`);
  const enviados = await mailsDeResend();
  const porDestino = new Map<string, MailResend[]>();
  for (const m of enviados) {
    if (!/^Tus entradas/.test(m.subject)) continue;
    for (const to of m.to) {
      const k = to.trim().toLowerCase();
      porDestino.set(k, [...(porDestino.get(k) ?? []), m]);
    }
  }

  const dudosas: Fila[] = [];
  console.log('\nORDEN     MÉTODO         CASILLA                                  RESEND');
  for (const o of pagadas) {
    const ms = (porDestino.get(o.email.trim().toLowerCase()) ?? []).sort((a, b) => b.created_at.localeCompare(a.created_at));
    const mejor = ms.find(m => BIEN.has(m.last_event));
    const estado = mejor ? mejor.last_event : ms[0] ? ms[0].last_event : 'SIN REGISTRO';
    const dudoso = !mejor;
    if (dudoso) dudosas.push(o);
    console.log(`${o.id.slice(0, 8)}  ${o.metodo.padEnd(13)}  ${o.email.padEnd(40)} ${dudoso ? '⚠ ' : '  '}${estado}${o.mail_enviado ? '' : ' (mail_enviado=false)'}`);
  }

  // ── 2. Pendientes de MP con pago aprobado ──────────────────────────────
  const conMP = Boolean(process.env.MP_ACCESS_TOKEN) && !process.env.MP_ACCESS_TOKEN?.includes('SENSITIVE');
  if (!conMP) console.log('\nSin MP_ACCESS_TOKEN: se saltea el chequeo de pagos pendientes en Mercado Pago.');
  const pendientesMP = conMP ? ordenes.filter(o => o.estado !== 'pagada' && o.metodo === 'mercadopago') : [];
  if (conMP) console.log(`\nConsultando a Mercado Pago ${pendientesMP.length} órdenes pendientes…`);
  const cobradas: { orden: Fila; pago: { id: number; monto: number } }[] = [];
  for (const o of pendientesMP) {
    try {
      const pago = await pagoAprobadoMP(o.id);
      if (pago) cobradas.push({ orden: o, pago });
    } catch (e) {
      console.error(`  ${o.id.slice(0, 8)}: ${e instanceof Error ? e.message : e}`);
    }
  }
  if (conMP) console.log(cobradas.length === 0 ? '  Ninguna tiene un pago aprobado en MP.' : '  COBRADAS EN MP Y SIN EMITIR:');
  for (const { orden, pago } of cobradas) console.log(`  ⚠ ${orden.id.slice(0, 8)}  ${orden.email}  pago ${pago.id}  $${pago.monto}  (orden: ${orden.estado})`);

  console.log(`\nResumen: ${pagadas.length} pagadas, ${dudosas.length} con mail dudoso, ${cobradas.length} cobradas sin emitir.`);

  if (!REENVIAR || (dudosas.length === 0 && cobradas.length === 0)) {
    if (!REENVIAR && (dudosas.length || cobradas.length)) console.log('Para corregirlo: pnpm festival:auditar --reenviar');
    return;
  }

  if (!SI) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const r = await rl.question(`\nEmitir ${cobradas.length} y reenviar ${dudosas.length} mails? (s/N) `);
    rl.close();
    if (r.trim().toLowerCase() !== 's') return;
  }

  // Primero las cobradas sin emitir: confirmarPagoMP emite, confirma en Gestión y manda el mail.
  for (const { orden, pago } of cobradas) {
    try {
      const r = await confirmarPagoMP(supabase, String(pago.id));
      console.log(`${r?.estado === 'pagada' ? '✓' : '✗'} emitida ${orden.id.slice(0, 8)} ${orden.email} → ${r?.estado}${r?.observacion ? ` (${r.observacion})` : ''}`);
    } catch (e) {
      console.error(`✗ ${orden.id.slice(0, 8)}: ${e instanceof Error ? e.message : e}`);
    }
  }

  // Después los dudosos: soltar la marca y reusar el envío normal (igual que el botón de Ana).
  // Resend limita a 2 por segundo y 100 por día en el plan gratis.
  for (const o of dudosas) {
    await supabase.from('festival_ordenes').update({ mail_enviado: false }).eq('id', o.id);
    await enviarMailTickets(supabase, o);
    const { data: d } = await supabase.from('festival_ordenes').select('mail_enviado').eq('id', o.id).maybeSingle();
    console.log(`${d?.mail_enviado ? '✓' : '✗'} reenviado ${o.id.slice(0, 8)} ${o.email}`);
    await new Promise(res => setTimeout(res, 600));
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
