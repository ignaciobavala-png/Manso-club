/**
 * Precios de la tienda con moneda de referencia.
 *
 * Cada producto guarda el precio tal como se cargó en el panel y en qué moneda
 * se cargó (`productos.moneda`). Esa es la referencia: el número que Ana
 * escribió no se mueve nunca, y el precio en la otra moneda se calcula con la
 * cotización del blue al momento de mostrarlo o de cobrar.
 *
 * Los productos que ya existían cuando todo se cargaba en dólares no tienen
 * `moneda`, así que la ausencia se lee como USD.
 */

export type Moneda = 'USD' | 'ARS';

export interface PrecioDeProducto {
  precio: number;
  moneda?: Moneda | string | null;
}

/** Moneda en la que está cargado el precio; USD si el producto es viejo. */
export function monedaDe(producto: PrecioDeProducto): Moneda {
  return producto.moneda === 'ARS' ? 'ARS' : 'USD';
}

/**
 * Convierte entre las dos monedas. Devuelve `null` cuando hace falta la
 * cotización y no la tenemos: quien llama decide si muestra el precio en su
 * moneda original o si bloquea el cobro.
 */
export function convertir(
  monto: number,
  desde: Moneda,
  hacia: Moneda,
  cotizacion: number | null,
): number | null {
  if (desde === hacia) return monto;
  if (!cotizacion || cotizacion <= 0) return null;
  return hacia === 'ARS' ? Math.round(monto * cotizacion) : monto / cotizacion;
}

/** Precio del producto en pesos (redondeado al peso). */
export function precioEnArs(
  producto: PrecioDeProducto,
  cotizacion: number | null,
): number | null {
  return convertir(Number(producto.precio), monedaDe(producto), 'ARS', cotizacion);
}

/** Precio del producto en dólares. */
export function precioEnUsd(
  producto: PrecioDeProducto,
  cotizacion: number | null,
): number | null {
  return convertir(Number(producto.precio), monedaDe(producto), 'USD', cotizacion);
}

export function formatArs(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(monto));
}

export function formatUsd(monto: number): string {
  // Los precios en dólares se cargan enteros, pero un precio en pesos
  // convertido a USD casi nunca lo es: ahí sí van los centavos.
  const decimales = Number.isInteger(monto) ? 0 : 2;
  return `USD $${monto.toLocaleString('es-AR', {
    minimumFractionDigits: decimales,
    maximumFractionDigits: decimales,
  })}`;
}

export function formatMoneda(monto: number, moneda: Moneda): string {
  return moneda === 'ARS' ? formatArs(monto) : formatUsd(monto);
}

/**
 * Precio listo para mostrar en la moneda que eligió la persona. Si falta la
 * cotización cae en la moneda de referencia del producto, que siempre es un
 * número exacto.
 */
export function mostrarPrecio(
  producto: PrecioDeProducto,
  moneda: Moneda,
  cotizacion: number | null,
): string {
  const origen = monedaDe(producto);
  const monto = convertir(Number(producto.precio), origen, moneda, cotizacion);
  return monto === null
    ? formatMoneda(Number(producto.precio), origen)
    : formatMoneda(monto, moneda);
}

/**
 * Total del carrito en una moneda. `null` si hay algún ítem cargado en la otra
 * moneda y no tenemos cotización para pasarlo.
 */
export function totalEn(
  items: (PrecioDeProducto & { quantity: number })[],
  moneda: Moneda,
  cotizacion: number | null,
): number | null {
  let total = 0;
  for (const item of items) {
    const monto = convertir(Number(item.precio), monedaDe(item), moneda, cotizacion);
    if (monto === null) return null;
    total += monto * item.quantity;
  }
  return moneda === 'ARS' ? Math.round(total) : total;
}
