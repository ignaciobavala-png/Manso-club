-- Festival: las entradas se venden contra Manso Gestión.
--
-- La puerta usa el lector de QR de Gestión, que solo reconoce
-- `manso-ticket|<token>` contra su `ticket_registrations`. Por eso el evento,
-- los tipos y el stock viven allá (manso-gestion, migración 039, contrato en
-- `docs/WEB-API-ENTRADAS.md`) y la web:
--
--   1. reserva al armar la orden (`web_reservar`, order_ref = id de la orden)
--      y guarda acá los tokens que le devolvió;
--   2. al cobrar, emite sus tickets con esos tokens (no inventa códigos) y
--      confirma en Gestión (`web_confirmar`);
--   3. si Ana descarta una transferencia, libera el cupo (`web_liberar`).
--
-- Una orden sin `gestion_event_id` es de antes de conectarlo (o de cuando no
-- están las variables de Gestión): se emite como siempre, con códigos propios.

ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS gestion_event_id UUID;
-- Lo que devolvió `web_reservar`: [{ token, tipo_nombre, pack_pos, pack_size }].
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS gestion_tickets JSONB;
-- `web_confirmar` ya respondió. Si falló (Gestión caída), el cron lo reintenta.
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS gestion_confirmada BOOLEAN NOT NULL DEFAULT false;

-- `codigo` pasa a ser el token de Gestión y el QR, `manso-ticket|<codigo>`.
ALTER TABLE festival_tickets ADD COLUMN IF NOT EXISTS en_gestion BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE festival_tickets ADD COLUMN IF NOT EXISTS pack_pos SMALLINT;
ALTER TABLE festival_tickets ADD COLUMN IF NOT EXISTS pack_size SMALLINT;
-- Las filas de una orden se insertan en la misma transacción (mismo
-- `created_at`): sin esto el orden de los QR quedaría librado al azar.
ALTER TABLE festival_tickets ADD COLUMN IF NOT EXISTS posicion SMALLINT;

CREATE INDEX IF NOT EXISTS festival_ordenes_gestion_pendiente_idx
  ON festival_ordenes (id) WHERE estado = 'pagada' AND gestion_event_id IS NOT NULL AND NOT gestion_confirmada;

-- La misma de `migration_festival_medios_pago.sql`, con la rama de Gestión:
-- si la orden reservó allá, un ticket por token, en el orden de Gestión.
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

  IF v_orden.gestion_tickets IS NOT NULL THEN
    INSERT INTO festival_tickets (orden_id, entrada_nombre, codigo, en_gestion, pack_pos, pack_size, posicion)
    SELECT
      p_orden,
      t.fila ->> 'tipo_nombre',
      t.fila ->> 'token',
      true,
      (t.fila ->> 'pack_pos')::smallint,
      (t.fila ->> 'pack_size')::smallint,
      t.n
    FROM jsonb_array_elements(v_orden.gestion_tickets) WITH ORDINALITY AS t (fila, n);
    RETURN true;
  END IF;

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
