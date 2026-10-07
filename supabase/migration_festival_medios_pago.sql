-- Festival: además de cripto, se cobra con Mercado Pago y por transferencia.
--
-- Cada medio tiene su perilla en el panel. Cripto arranca apagada hasta que
-- estén las wallets (y aun prendida, sin `FESTIVAL_WALLET_*` no aparece).
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS pago_mercadopago BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS pago_transferencia BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS pago_cripto BOOLEAN NOT NULL DEFAULT false;

-- Las órdenes viejas son todas de cripto.
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS metodo TEXT NOT NULL DEFAULT 'cripto'
  CHECK (metodo IN ('cripto', 'mercadopago', 'transferencia'));
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS mp_preference_id TEXT;
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS mp_payment_id TEXT;

-- En pesos no hace falta el dólar: si dolarapi no responde, una compra por
-- Mercado Pago o transferencia sigue. El CHECK (> 0) sigue valiendo si hay valor.
ALTER TABLE festival_ordenes ALTER COLUMN total_usd DROP NOT NULL;
ALTER TABLE festival_ordenes ALTER COLUMN cotizacion DROP NOT NULL;

-- Marca la orden pagada y emite sus tickets (uno por persona: un pack x3 da
-- tres). Devuelve false sin tocar nada si ya estaba pagada, así el webhook de
-- Mercado Pago, la vuelta del comprador y un doble clic de Ana no duplican.
-- La usan Mercado Pago y la transferencia directo, y cripto después de
-- reclamar la transferencia en la cadena.
CREATE OR REPLACE FUNCTION public.festival_emitir_orden(p_orden UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orden festival_ordenes%ROWTYPE;
BEGIN
  SELECT * INTO v_orden FROM festival_ordenes WHERE id = p_orden FOR UPDATE;
  IF NOT FOUND OR v_orden.estado = 'pagada' THEN
    RETURN false;
  END IF;

  UPDATE festival_ordenes
  SET estado = 'pagada', pagada_at = now(), updated_at = now()
  WHERE id = p_orden;

  INSERT INTO festival_tickets (orden_id, entrada_id, entrada_nombre, codigo)
  SELECT
    p_orden,
    -- Si Ana borró ese tipo de entrada entre la compra y el pago, el ticket
    -- sale igual (con el nombre del snapshot): la FK no puede trabar un cobro.
    (SELECT e.id FROM festival_entradas e WHERE e.id = (item ->> 'entrada_id')::uuid),
    item ->> 'nombre',
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  FROM jsonb_array_elements(v_orden.items) AS item
  CROSS JOIN LATERAL generate_series(
    1, (item ->> 'cantidad')::int * (item ->> 'entradas_por_unidad')::int
  );

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.festival_emitir_orden(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.festival_emitir_orden(UUID) TO service_role;

-- Cripto: la misma de antes, pero la emisión pasa por `festival_emitir_orden`.
CREATE OR REPLACE FUNCTION public.festival_acreditar_pago(p_pago UUID, p_orden UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_orden festival_ordenes%ROWTYPE;
BEGIN
  SELECT * INTO v_orden FROM festival_ordenes WHERE id = p_orden FOR UPDATE;
  IF NOT FOUND OR v_orden.estado = 'pagada' THEN
    RETURN false;
  END IF;

  UPDATE festival_cripto_pagos SET orden_id = p_orden WHERE id = p_pago AND orden_id IS NULL;
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN public.festival_emitir_orden(p_orden);
END;
$$;

REVOKE ALL ON FUNCTION public.festival_acreditar_pago(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.festival_acreditar_pago(UUID, UUID) TO service_role;
