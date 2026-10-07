import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ORDEN_REDES, REDES, type EstadoPago, type RedCripto } from '@/lib/cripto-redes';
import { leerTransferencias, normalizarHash, puntoDePartida, redesActivas, walletDe } from '@/lib/cripto-escaner';
import { EMAIL_FROM, getResend } from '@/lib/resend';
import { getMPPaymentClient, getMPPreferenceClient } from '@/lib/mercadopago';
import { datosParaTransferencia, getBankConfig } from '@/lib/getBankConfig';
import type { FestivalConfig, MedioPago } from '@/lib/types/festival';

/**
 * Compra de entradas del festival. Tres medios, cada uno con su perilla en el
 * panel (`mediosDePago`):
 *
 *   - Mercado Pago: la orden arma una preferencia; el webhook
 *     `/api/festival/mp-webhook` (y la vuelta del comprador a su compra)
 *     confirman con `confirmarPagoMP`.
 *   - Transferencia: la compra muestra los datos de la cuenta y Ana la confirma
 *     desde el panel (`/api/festival/ordenes/[id]/confirmar`).
 *   - Cripto, directo a la wallet de Manso. Esquema y razones en
 *     `supabase/migration_festival_cripto.sql`:
 *
 *   1. `/api/festival/compra` crea la orden (sin red todavía).
 *   2. En `/festival/compra/[id]` el comprador elige red → `elegirRed` le fija
 *      un monto único y desde qué bloque mirar.
 *   3. `sincronizarRed` lee la cadena y acredita la transferencia con ese monto
 *      exacto. La corren la pantalla de pago (cada pocos segundos, con freno)
 *      y el cron `/api/festival/conciliar`.
 *   4. Si el monto no coincide, `reclamarConHash` con el hash que pega el comprador.
 */

export interface ItemOrden {
  entrada_id: string;
  nombre: string;
  cantidad: number;
  precio_ars: number;
  entradas_por_unidad: number;
}

export interface OrdenFestival {
  id: string;
  nombre: string;
  email: string;
  items: ItemOrden[];
  cantidad_entradas: number;
  total_ars: number;
  /** Solo seguro en cripto: en pesos se guarda si dolarapi respondió. */
  total_usd: number | null;
  estado: 'pendiente' | 'pagada' | 'vencida';
  metodo: MedioPago;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  red: RedCripto | null;
  monto_esperado: number | null;
  bloque_inicio: number | null;
  vence_at: string | null;
  observacion: string | null;
  mail_enviado: boolean;
  created_at: string;
}

export interface TicketFestival {
  id: string;
  entrada_nombre: string;
  codigo: string;
  usado: boolean;
}

interface PagoCripto {
  id: string;
  red: RedCripto;
  token: string;
  tx_hash: string;
  monto: string;
  bloque: number;
  orden_id: string | null;
}

/** Cuánto tiempo tiene el comprador para mandar el pago desde que elige red. */
const MINUTOS_PARA_PAGAR = 60;
/** Una orden vencida todavía se acredita si el pago llega dentro de este plazo. */
const HORAS_DE_GRACIA = 24;
/** La pantalla de pago consulta seguido; la cadena se lee como mucho cada tanto. */
const SEGUNDOS_ENTRE_LECTURAS = 10;

/** Service role: las tablas de la compra no tienen ninguna policy pública. */
export function adminFestival(): SupabaseClient {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const urlSitio = () => process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mansoclub.com.ar';
export const urlCompra = (ordenId: string) => `${urlSitio()}/festival/compra/${ordenId}`;

const normalizar = (o: OrdenFestival): OrdenFestival => ({
  ...o,
  total_ars: Number(o.total_ars),
  total_usd: o.total_usd === null ? null : Number(o.total_usd),
  monto_esperado: o.monto_esperado === null ? null : Number(o.monto_esperado),
  bloque_inicio: o.bloque_inicio === null ? null : Number(o.bloque_inicio),
});

/** Lo que ve la pantalla de pago: sin mail ni datos internos. */
export function estadoPublico(orden: OrdenFestival): EstadoPago {
  const activas = redesActivas();
  return {
    estado: orden.estado,
    totalUsd: orden.total_usd ?? 0,
    red: orden.red,
    monto: orden.monto_esperado,
    direccion: orden.red ? walletDe(orden.red) : null,
    venceAt: orden.vence_at,
    observacion: orden.observacion,
    redes: ORDEN_REDES.filter(r => activas.includes(r)),
  };
}

export async function leerOrden(supabase: SupabaseClient, id: string): Promise<OrdenFestival | null> {
  const { data } = await supabase.from('festival_ordenes').select('*').eq('id', id).maybeSingle();
  return data ? normalizar(data as OrdenFestival) : null;
}

/**
 * Fija red, monto único y punto de partida. También sirve para cambiar de red
 * o para reabrir una orden vencida. El índice único `(red, monto_esperado)`
 * entre pendientes es el que garantiza que el monto identifique a la orden:
 * si los centavos sorteados ya están tomados, se sortean otros.
 */
export async function elegirRed(supabase: SupabaseClient, orden: OrdenFestival, red: RedCripto) {
  if (orden.estado === 'pagada') throw new Error('La orden ya está pagada');
  if (orden.metodo !== 'cripto' || orden.total_usd === null) throw new Error('Esta compra no se paga en cripto');
  const bloqueInicio = await puntoDePartida(red);

  for (let intento = 0; intento < 20; intento++) {
    const centavos = 1 + Math.floor(Math.random() * 99);
    const monto = Math.round(orden.total_usd * 100 + centavos) / 100;
    const { error } = await supabase
      .from('festival_ordenes')
      .update({
        red,
        monto_esperado: monto,
        bloque_inicio: bloqueInicio,
        vence_at: new Date(Date.now() + MINUTOS_PARA_PAGAR * 60_000).toISOString(),
        estado: 'pendiente',
        observacion: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orden.id)
      .neq('estado', 'pagada');
    if (!error) return;
    if (error.code !== '23505') throw new Error(error.message);
  }
  throw new Error('No se pudo asignar un monto único; probá de nuevo.');
}

/** Órdenes que todavía pueden recibir un pago en esa red. */
async function ordenesAbiertas(supabase: SupabaseClient, red: RedCripto): Promise<OrdenFestival[]> {
  const gracia = new Date(Date.now() - HORAS_DE_GRACIA * 3600_000).toISOString();
  const { data } = await supabase
    .from('festival_ordenes')
    .select('*')
    .eq('red', red)
    .or(`estado.eq.pendiente,and(estado.eq.vencida,vence_at.gt.${gracia})`);
  return ((data as OrdenFestival[] | null) ?? []).map(normalizar);
}

/**
 * Lee la cadena desde el cursor (o desde la orden abierta más vieja) y
 * acredita lo que coincida. Sin órdenes abiertas no lee nada. Sin `forzar`,
 * respeta el freno entre lecturas: lo reclama con un UPDATE condicionado, así
 * dos compradores mirando a la vez no disparan dos lecturas.
 */
export async function sincronizarRed(supabase: SupabaseClient, red: RedCripto, { forzar = false } = {}) {
  if (!walletDe(red)) return;
  const abiertas = await ordenesAbiertas(supabase, red);
  if (abiertas.length === 0) return;

  let consulta = supabase.from('festival_cripto_redes').update({ escaneado_at: new Date().toISOString() }).eq('red', red);
  if (!forzar) {
    const limite = new Date(Date.now() - SEGUNDOS_ENTRE_LECTURAS * 1000).toISOString();
    consulta = consulta.or(`escaneado_at.is.null,escaneado_at.lt.${limite}`);
  }
  const { data: reclamada } = await consulta.select('cursor').maybeSingle();
  if (!reclamada) return;

  // Nada anterior a la orden abierta más vieja puede pagar ninguna, así que un
  // cursor viejo (semanas sin ventas) no obliga a leer todo lo del medio.
  const inicioMasViejo = Math.min(...abiertas.map(o => o.bloque_inicio ?? Infinity));
  const cursor = reclamada.cursor === null ? null : Number(reclamada.cursor);
  const desde = Math.max(cursor === null ? -Infinity : cursor + (red === 'tron' ? 0 : 1), inicioMasViejo);
  if (!Number.isFinite(desde)) return;

  const { transferencias, hasta } = await leerTransferencias(red, desde);
  if (transferencias.length > 0) {
    const { error } = await supabase
      .from('festival_cripto_pagos')
      .upsert(transferencias, { onConflict: 'red,tx_hash,log_index', ignoreDuplicates: true });
    if (error) throw new Error(`No se pudieron guardar las transferencias de ${red}: ${error.message}`);
  }
  await supabase
    .from('festival_cripto_redes')
    .update({ cursor: hasta })
    .eq('red', red)
    .or(`cursor.is.null,cursor.lt.${hasta}`);

  await acreditarCoincidencias(supabase, red, abiertas);
}

/** Cada transferencia suelta con el monto exacto de una orden abierta la paga. */
async function acreditarCoincidencias(supabase: SupabaseClient, red: RedCripto, abiertas: OrdenFestival[]) {
  const { data: sueltos } = await supabase
    .from('festival_cripto_pagos')
    .select('id, red, token, tx_hash, monto, bloque, orden_id')
    .eq('red', red)
    .is('orden_id', null)
    .gte('created_at', new Date(Date.now() - 2 * HORAS_DE_GRACIA * 3600_000).toISOString());

  for (const pago of (sueltos as PagoCripto[] | null) ?? []) {
    const candidatas = abiertas.filter(
      o => o.monto_esperado !== null && o.monto_esperado === Number(pago.monto) && (o.bloque_inicio ?? Infinity) <= Number(pago.bloque)
    );
    // Entre pendientes el monto es único por índice; una vencida puede
    // compartirlo con una pendiente nueva, y ahí gana la pendiente.
    const pendientes = candidatas.filter(o => o.estado === 'pendiente');
    const elegida = pendientes.length === 1 ? pendientes[0] : candidatas.length === 1 ? candidatas[0] : null;
    if (elegida) await acreditar(supabase, pago.id, elegida);
  }
}

async function acreditar(supabase: SupabaseClient, pagoId: string, orden: OrdenFestival): Promise<boolean> {
  const { data: ok, error } = await supabase.rpc('festival_acreditar_pago', { p_pago: pagoId, p_orden: orden.id });
  if (error) throw new Error(`No se pudo acreditar ${pagoId} a ${orden.id}: ${error.message}`);
  if (ok) await enviarMailTickets(supabase, orden);
  return Boolean(ok);
}

export type ResultadoHash = { ok: true } | { ok: false; mensaje: string };

/**
 * Para cuando el monto no coincidió: el comprador pega el hash. Se acepta si
 * la transferencia entró a la wallet de Manso en la red de la orden, es
 * posterior a que eligiera red, no pagó otra orden y llegó al menos lo pedido.
 * Si llegó menos, queda anotado para que lo resuelva Ana.
 */
export async function reclamarConHash(
  supabase: SupabaseClient,
  orden: OrdenFestival,
  hashPegado: string
): Promise<ResultadoHash> {
  if (orden.estado === 'pagada') return { ok: true };
  if (!orden.red || orden.monto_esperado === null || orden.bloque_inicio === null) {
    return { ok: false, mensaje: 'Primero elegí la red en la que pagaste.' };
  }
  const red = orden.red;
  const hash = normalizarHash(red, hashPegado);
  if (!hash) return { ok: false, mensaje: `Ese no parece un hash de ${REDES[red].nombre}.` };

  await sincronizarRed(supabase, red, { forzar: true });

  const { data } = await supabase
    .from('festival_cripto_pagos')
    .select('id, red, token, tx_hash, monto, bloque, orden_id')
    .eq('red', red)
    .eq('tx_hash', hash);
  const pagos = (data as PagoCripto[] | null) ?? [];

  if (pagos.some(p => p.orden_id === orden.id)) return { ok: true };
  if (pagos.length === 0) {
    return {
      ok: false,
      mensaje: `Todavía no vemos esa transacción entrando a la wallet de Manso en ${REDES[red].nombre}. Si la acabás de mandar, esperá un minuto a que se confirme y probá de nuevo.`,
    };
  }
  const pago = pagos.find(p => p.orden_id === null);
  if (!pago) return { ok: false, mensaje: 'Esa transacción ya se usó para otra compra.' };
  if (Number(pago.bloque) < orden.bloque_inicio) {
    return { ok: false, mensaje: 'Esa transacción es anterior a tu compra.' };
  }

  const recibido = Number(pago.monto);
  if (recibido + 1e-6 < orden.monto_esperado) {
    const nota = `Llegaron ${recibido} ${pago.token} de ${orden.monto_esperado} (tx ${hash}).`;
    await supabase.from('festival_ordenes').update({ observacion: nota, updated_at: new Date().toISOString() }).eq('id', orden.id);
    return {
      ok: false,
      mensaje: `Recibimos ${recibido} ${pago.token} y la compra es de ${orden.monto_esperado}. Seguramente el exchange descontó la comisión de retiro. Escribinos y lo resolvemos.`,
    };
  }

  return (await acreditar(supabase, pago.id, orden))
    ? { ok: true }
    : { ok: false, mensaje: 'Esa transacción ya se usó para otra compra.' };
}

/**
 * Marca la orden pagada, emite los tickets y manda el mail. Para Mercado Pago y
 * transferencia; cripto pasa por `acreditar`, que además reclama la
 * transferencia en la cadena. Devuelve false si ya estaba pagada.
 */
export async function emitirOrden(supabase: SupabaseClient, orden: OrdenFestival): Promise<boolean> {
  const { data: ok, error } = await supabase.rpc('festival_emitir_orden', { p_orden: orden.id });
  if (error) throw new Error(`No se pudo emitir la orden ${orden.id}: ${error.message}`);
  if (ok) await enviarMailTickets(supabase, orden);
  return Boolean(ok);
}

// ── Medios de pago ─────────────────────────────────────────────────────────

/**
 * Los que se ofrecen: prendidos en el panel y además configurados. Una perilla
 * prendida sin el dato que la sostiene (token de MP, CBU o alias, wallets) no
 * muestra el medio: sería un botón que falla.
 */
export async function mediosDePago(config: FestivalConfig): Promise<MedioPago[]> {
  const medios: MedioPago[] = [];
  if (config.pago_mercadopago && process.env.MP_ACCESS_TOKEN) medios.push('mercadopago');
  if (config.pago_transferencia && datosParaTransferencia(await getBankConfig()).length > 0) {
    medios.push('transferencia');
  }
  if (config.pago_cripto && redesActivas().length > 0) medios.push('cripto');
  return medios;
}

/**
 * `external_reference` de las preferencias del festival. El prefijo las separa
 * de los pedidos de la tienda: si en el panel de MP hay un webhook global, la
 * tienda también recibe estos avisos y no debe confundirlos con un pedido.
 */
const REF_MP = 'festival:';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Arma la preferencia de MP de una orden y devuelve a dónde mandar al comprador. */
export async function crearPreferenciaMP(supabase: SupabaseClient, orden: OrdenFestival): Promise<string> {
  const vuelta = urlCompra(orden.id);
  const preferencia = await getMPPreferenceClient().create({
    body: {
      items: orden.items.map(i => ({
        id: i.entrada_id,
        title: `Festival — ${i.nombre}`,
        quantity: i.cantidad,
        unit_price: i.precio_ars,
        currency_id: 'ARS',
      })),
      payer: { name: orden.nombre, email: orden.email },
      external_reference: `${REF_MP}${orden.id}`,
      back_urls: { success: vuelta, failure: vuelta, pending: vuelta },
      auto_return: 'approved',
      notification_url: `${urlSitio()}/api/festival/mp-webhook`,
      statement_descriptor: 'MANSO FESTIVAL',
    },
  });
  if (!preferencia.id || !preferencia.init_point) throw new Error('Mercado Pago no devolvió la preferencia');
  await supabase.from('festival_ordenes').update({ mp_preference_id: preferencia.id }).eq('id', orden.id);
  return preferencia.init_point;
}

/** El link de pago de una orden de MP que todavía no se pagó (para reintentar). */
export async function linkPagoMP(orden: OrdenFestival): Promise<string | null> {
  if (!orden.mp_preference_id) return null;
  try {
    return (await getMPPreferenceClient().get({ preferenceId: orden.mp_preference_id })).init_point ?? null;
  } catch {
    return null;
  }
}

/**
 * Confirma un pago de MP leyéndolo de la API de MP con nuestro token: el aviso
 * (webhook o el `payment_id` de la URL de vuelta) es solo el disparador y no
 * se le cree nada, así que no depende de `MP_WEBHOOK_SECRET`. Emite si está
 * aprobado, en pesos y por al menos el total. Devuelve la orden, o null si el
 * pago no es de una compra del festival.
 */
export async function confirmarPagoMP(supabase: SupabaseClient, paymentId: string): Promise<OrdenFestival | null> {
  const pago = await getMPPaymentClient().get({ id: paymentId });
  const ref = pago.external_reference ?? '';
  const ordenId = ref.slice(REF_MP.length);
  if (!ref.startsWith(REF_MP) || !UUID.test(ordenId)) return null;

  const orden = await leerOrden(supabase, ordenId);
  if (!orden || orden.estado === 'pagada' || pago.status !== 'approved') return orden;

  if (pago.currency_id !== 'ARS' || (pago.transaction_amount ?? 0) + 0.01 < orden.total_ars) {
    await supabase
      .from('festival_ordenes')
      .update({
        mp_payment_id: String(pago.id),
        observacion: `MP aprobó ${pago.currency_id} ${pago.transaction_amount} y la compra es de ARS ${orden.total_ars}.`,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orden.id);
    return orden;
  }

  await supabase.from('festival_ordenes').update({ mp_payment_id: String(pago.id) }).eq('id', orden.id);
  await emitirOrden(supabase, orden);
  return leerOrden(supabase, orden.id);
}

/** Pasa a vencidas las pendientes cuyo plazo terminó (con un margen por la confirmación). */
export async function vencerOrdenes(supabase: SupabaseClient) {
  const margen = new Date(Date.now() - 20 * 60_000).toISOString();
  await supabase
    .from('festival_ordenes')
    .update({ estado: 'vencida', updated_at: new Date().toISOString() })
    .eq('estado', 'pendiente')
    .lt('vence_at', margen);
  // Las que nunca eligieron red no tienen vence_at.
  await supabase
    .from('festival_ordenes')
    .update({ estado: 'vencida', updated_at: new Date().toISOString() })
    .eq('estado', 'pendiente')
    // Mercado Pago y transferencia no vencen: un pago puede confirmarse tarde.
    .eq('metodo', 'cripto')
    .is('red', null)
    .lt('created_at', new Date(Date.now() - HORAS_DE_GRACIA * 3600_000).toISOString());
}

/**
 * Mail con el link a la compra. Se reclama `mail_enviado` antes de mandarlo
 * para no duplicarlo si dos acreditaciones corren a la vez; si Resend falla
 * se libera, y el cron lo vuelve a intentar.
 */
export async function enviarMailTickets(supabase: SupabaseClient, orden: Pick<OrdenFestival, 'id' | 'nombre' | 'email' | 'cantidad_entradas'>) {
  const { data: reclamada } = await supabase
    .from('festival_ordenes')
    .update({ mail_enviado: true })
    .eq('id', orden.id)
    .eq('mail_enviado', false)
    .select('id')
    .maybeSingle();
  if (!reclamada) return;

  try {
    const link = urlCompra(orden.id);
    const entradas = orden.cantidad_entradas === 1 ? 'tu entrada' : `tus ${orden.cantidad_entradas} entradas`;
    await getResend().emails.send({
      from: EMAIL_FROM,
      to: orden.email,
      subject: 'Tus entradas del festival',
      html: `<p>Hola ${escapar(orden.nombre)},</p>
<p>Recibimos el pago. Acá está ${entradas}, cada una con su QR:</p>
<p><a href="${link}">${link}</a></p>
<p>Guardá este mail: el link es tu entrada.</p>`,
    });
  } catch (e) {
    await supabase.from('festival_ordenes').update({ mail_enviado: false }).eq('id', orden.id);
    console.error(`No se pudo mandar el mail de la orden ${orden.id}:`, e);
  }
}

const escapar = (s: string) =>
  s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
