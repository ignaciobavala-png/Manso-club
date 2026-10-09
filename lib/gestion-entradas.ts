import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { EstadoEntrada, FestivalEntrada } from '@/lib/types/festival';

/**
 * Las entradas del festival se venden contra Manso Gestión, que es otro
 * proyecto de Supabase: ahí viven el evento, los tipos de entrada y el stock,
 * y su lector de QR es el que se usa en la puerta. La web lee los tipos,
 * reserva al armar la orden y confirma al cobrar; cada entrada es una fila de
 * `ticket_registrations` de Gestión y su QR es `manso-ticket|<token>`.
 *
 * Contrato completo (parámetros, errores, idempotencia): manso-gestion,
 * `docs/WEB-API-ENTRADAS.md`.
 *
 * Se activa solo cuando están las tres variables. Sin ellas la venta usa
 * `festival_entradas` y emite códigos propios, como antes de conectarlo.
 */

export interface TipoGestion {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  entradas_por_unidad: number;
  max_por_compra: number | null;
  estado: EstadoEntrada;
  /** El que hay que mostrar: un `en_venta` sin lugar sale `agotado`. */
  estado_efectivo: EstadoEntrada;
  orden: number;
  disponibles_entradas: number | null;
  disponibles_unidades: number | null;
}

/** Una fila por QR, en el orden en que Gestión las creó. */
export interface TicketGestion {
  token: string;
  tipo_nombre: string;
  pack_pos: number | null;
  pack_size: number | null;
}

/** Tope del selector cuando Gestión no pone `max_por_compra`. */
const MAX_POR_COMPRA_DEFAULT = 10;

export const eventoGestion = () => process.env.FESTIVAL_GESTION_EVENT_ID || null;

export const ventaEnGestion = () =>
  Boolean(process.env.GESTION_SUPABASE_URL && process.env.GESTION_SERVICE_ROLE_KEY && eventoGestion());

let cliente: SupabaseClient | null = null;

/** Service role de Gestión: solo en el servidor. */
function gestion(): SupabaseClient {
  if (!cliente) {
    cliente = createClient(process.env.GESTION_SUPABASE_URL!, process.env.GESTION_SERVICE_ROLE_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cliente;
}

/** Error de las RPC de Gestión con su código estable (`tipo_agotado`, `capacity_exceeded`…). */
export class ErrorGestion extends Error {
  constructor(
    readonly codigo: string,
    mensaje: string
  ) {
    super(mensaje);
  }
}

const fallo = (funcion: string, error: { message: string }) =>
  new ErrorGestion(error.message.split(':')[0].trim(), `${funcion}: ${error.message}`);

export async function tiposGestion(): Promise<TipoGestion[]> {
  const { data, error } = await gestion().rpc('web_tipos_entrada', { p_event_id: eventoGestion() });
  if (error) throw fallo('web_tipos_entrada', error);
  return ((data as TipoGestion[] | null) ?? []).map(t => ({ ...t, precio: Number(t.precio) }));
}

/**
 * Un tipo de Gestión con la forma de una fila de la tabla de venta. El tope
 * del selector es el menor entre el de Gestión y lo que queda, así nadie arma
 * un carrito que la reserva va a rechazar.
 */
export const comoEntrada = (t: TipoGestion): FestivalEntrada => ({
  id: t.id,
  nombre: t.nombre,
  descripcion: t.descripcion,
  precio: t.precio,
  entradas_por_unidad: t.entradas_por_unidad,
  max_por_compra: Math.min(t.max_por_compra ?? MAX_POR_COMPRA_DEFAULT, t.disponibles_unidades ?? Infinity),
  estado: t.estado_efectivo,
  orden: t.orden,
  activo: true,
});

export async function reservarEnGestion(reserva: {
  ordenId: string;
  nombre: string;
  email: string;
  items: { tipo_id: string; cantidad: number }[];
  /** null = no vence sola (transferencia: hasta que Ana confirme o descarte). */
  venceAt: Date | null;
}): Promise<TicketGestion[]> {
  const { data, error } = await gestion().rpc('web_reservar', {
    p_event_id: eventoGestion(),
    p_order_ref: reserva.ordenId,
    p_nombre: reserva.nombre,
    p_email: reserva.email,
    p_items: reserva.items,
    p_vence_at: reserva.venceAt?.toISOString() ?? null,
  });
  if (error) throw fallo('web_reservar', error);
  return (data as TicketGestion[] | null) ?? [];
}

export async function confirmarEnGestion(ordenId: string): Promise<{ excede_cupo: boolean }> {
  const { data, error } = await gestion().rpc('web_confirmar', { p_order_ref: ordenId });
  if (error) throw fallo('web_confirmar', error);
  return data as { excede_cupo: boolean };
}

export async function liberarEnGestion(ordenId: string): Promise<void> {
  const { error } = await gestion().rpc('web_liberar', { p_order_ref: ordenId });
  // Liberar dos veces no falla (`liberadas: 0`); una pagada da `orden_confirmada`.
  if (error) throw fallo('web_liberar', error);
}
