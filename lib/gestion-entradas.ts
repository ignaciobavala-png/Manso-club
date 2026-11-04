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

/** Un tipo tal como se edita en el panel: incluye inactivos, el cupo propio y cuántas entradas ocupa. */
export interface TipoGestionAdmin {
  id: string;
  nombre: string;
  descripcion: string | null;
  precio: number;
  entradas_por_unidad: number;
  cupo: number | null;
  max_por_compra: number | null;
  estado: EstadoEntrada;
  activo: boolean;
  orden: number;
  /** Vendidas + reservadas: con ocupadas no se borra, se desactiva. */
  ocupadas: number;
}

export type TipoGuardar = Omit<TipoGestionAdmin, 'id' | 'orden' | 'ocupadas'> & { id?: string };

// Las tres RPC siguientes son de la migración 043 de Gestión (solo service_role).
export async function tiposAdminGestion(): Promise<TipoGestionAdmin[]> {
  const { data, error } = await gestion().rpc('web_tipos_admin', { p_event_id: eventoGestion() });
  if (error) throw fallo('web_tipos_admin', error);
  return ((data as TipoGestionAdmin[] | null) ?? []).map(t => ({ ...t, precio: Number(t.precio) }));
}

export async function guardarTipoGestion(t: TipoGuardar): Promise<string> {
  const { data, error } = await gestion().rpc('web_guardar_tipo', {
    p_event_id: eventoGestion(),
    p_id: t.id ?? null,
    p_nombre: t.nombre,
    p_descripcion: t.descripcion,
    p_precio: t.precio,
    p_entradas_por_unidad: t.entradas_por_unidad,
    p_cupo: t.cupo,
    p_max_por_compra: t.max_por_compra,
    p_estado: t.estado,
    p_activo: t.activo,
  });
  if (error) throw fallo('web_guardar_tipo', error);
  return data as string;
}

export async function borrarTipoGestion(id: string): Promise<void> {
  const { error } = await gestion().rpc('web_borrar_tipo', { p_event_id: eventoGestion(), p_id: id });
  if (error) throw fallo('web_borrar_tipo', error);
}

/**
 * Los eventos de Gestión que para quien compra son un solo festival BLUR:
 * la entrada sola, con lancha y con estacionamiento. `FESTIVAL_GESTION_EVENT_ID`
 * sigue siendo el de la venta (el único donde se reserva); estos son los que
 * el panel de Ventas lee. Se puede pisar con `FESTIVAL_GESTION_EVENT_IDS`
 * (ids separados por coma).
 */
export const EVENTOS_FESTIVAL_GESTION: string[] = (
  process.env.FESTIVAL_GESTION_EVENT_IDS?.split(',')
    .map(s => s.trim())
    .filter(Boolean) ?? [
    'cad3a58d-3744-4c81-a493-43e3f5f5fe40', // BLUR
    'd0471ae7-bff7-4797-945e-c93ff464012a', // BLUR + LANCHA
    '3093fc7e-5a9c-44bb-81b9-6fb19e8beec1', // BLUR + Estacionamiento
  ]
);

/** Una entrada de Gestión tal como la devuelve `web_ventas_admin` (migración 044). Sin el token del QR. */
export interface VentaGestion {
  registro_id: string;
  event_id: string;
  evento: string;
  order_ref: string | null;
  nombre: string;
  email: string;
  phone: string | null;
  origen: 'web' | 'gestion';
  payment_provider: string | null;
  payment_verified: boolean;
  vendida: boolean;
  reservada: boolean;
  rechazada: boolean;
  tipo: string | null;
  precio: number | null;
  tiene_comprobante: boolean;
  registered_at: string;
  paid_at: string | null;
  mp_expires_at: string | null;
  qr_mail_enviado_at: string | null;
  used_at: string | null;
}

/** Solo lectura: una fila por entrada de los eventos del festival, las de la web y las cargadas a mano. */
export async function ventasAdminGestion(): Promise<VentaGestion[]> {
  const { data, error } = await gestion().rpc('web_ventas_admin', { p_event_ids: EVENTOS_FESTIVAL_GESTION });
  if (error) throw fallo('web_ventas_admin', error);
  return ((data as VentaGestion[] | null) ?? []).map(v => ({ ...v, precio: v.precio === null ? null : Number(v.precio) }));
}
