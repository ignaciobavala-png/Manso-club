-- Agrega soporte de Mercado Pago a la tabla pedidos
ALTER TABLE pedidos
  ADD COLUMN IF NOT EXISTS mp_preference_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_status TEXT,
  ADD COLUMN IF NOT EXISTS metodo_pago TEXT NOT NULL DEFAULT 'transferencia';

CREATE INDEX IF NOT EXISTS idx_pedidos_mp_preference_id ON pedidos(mp_preference_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_mp_payment_id ON pedidos(mp_payment_id);

COMMENT ON COLUMN pedidos.mp_preference_id IS 'ID de preferencia de Mercado Pago asociada al pedido';
COMMENT ON COLUMN pedidos.mp_payment_id IS 'ID de pago de Mercado Pago una vez confirmado';
COMMENT ON COLUMN pedidos.mp_status IS 'Estado del pago según Mercado Pago (approved, pending, rejected, etc.)';
COMMENT ON COLUMN pedidos.metodo_pago IS 'Método de pago elegido: transferencia o mercadopago';
