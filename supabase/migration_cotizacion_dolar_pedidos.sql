-- Auditoría de conversión de moneda en pedidos.
-- Los precios de `productos` están cargados en USD; el cobro se hace en ARS
-- convirtiendo con el dólar blue al momento de generar el pedido.
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS moneda_origen TEXT NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS total_usd NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS cotizacion_dolar NUMERIC(12,2);

COMMENT ON COLUMN pedidos.moneda_origen IS 'Moneda en la que estan cargados los precios de productos (USD)';
COMMENT ON COLUMN pedidos.total_usd IS 'Total del pedido en la moneda de origen, antes de convertir';
COMMENT ON COLUMN pedidos.cotizacion_dolar IS 'Cotizacion ARS por 1 USD usada al cobrar este pedido (dolar blue venta)';
