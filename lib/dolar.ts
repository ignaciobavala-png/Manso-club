/**
 * Cotización del dólar para convertir precios a ARS.
 *
 * Los precios de `productos` están cargados en USD. El cobro real se hace en
 * ARS, así que la conversión tiene que resolverse siempre en el servidor: si
 * el cliente pudiera enviar la cotización, podría manipularla para pagar menos.
 */

const DOLAR_API = 'https://dolarapi.com/v1/dolares/blue';

export interface Cotizacion {
  /** ARS por 1 USD (dólar blue, precio de venta) */
  venta: number;
  fechaActualizacion: string;
}

export async function getCotizacionDolar(): Promise<Cotizacion> {
  const res = await fetch(DOLAR_API, { next: { revalidate: 300 } });

  if (!res.ok) {
    throw new Error('No se pudo obtener la cotización del dólar');
  }

  const data = await res.json();
  const venta = Number(data?.venta);

  if (!Number.isFinite(venta) || venta <= 0) {
    throw new Error('Cotización del dólar inválida');
  }

  return { venta, fechaActualizacion: data.fechaActualizacion };
}

/** Convierte un monto en USD a ARS, redondeado al peso. */
export function usdToArs(montoUsd: number, cotizacion: number): number {
  return Math.round(montoUsd * cotizacion);
}
