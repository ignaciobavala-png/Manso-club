-- Venta de entradas del festival en cripto: USDT / USDC directo a la wallet
-- de Manso, verificado leyendo la blockchain. Sin pasarela, sin servidor
-- propio y sin comisiones de terceros.
--
-- Cómo se reconoce un pago: cada orden, al elegir red, recibe un monto único
-- (el total en dólares + entre 1 y 99 centavos) que no comparte con ninguna
-- otra orden pendiente de esa red. `lib/cripto` lee las transferencias que
-- entran a la wallet y las guarda en `festival_cripto_pagos`; la que tenga el
-- monto exacto se acredita sola. Si no coincide (un exchange descontó la
-- comisión, se mandó de más), el comprador pega el hash y se revisa a mano o
-- con `monto >= esperado`.
--
-- Tablas propias y no `ordenes`/`pedidos`: esas son del flujo de Mercado Pago
-- de la tienda y tienen otro ciclo de vida.
--
-- RLS: hay mails de gente real y los códigos de entrada, así que ninguna policy
-- pública. Todo lo escribe el servidor con la service role; el admin lee.

CREATE TABLE IF NOT EXISTS festival_ordenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  -- Snapshot de lo comprado: [{ entrada_id, nombre, cantidad, precio_ars, entradas_por_unidad }].
  items JSONB NOT NULL,
  cantidad_entradas INT NOT NULL CHECK (cantidad_entradas >= 1),
  total_ars NUMERIC(12, 2) NOT NULL CHECK (total_ars > 0),
  -- total_ars / cotizacion, redondeado al centavo. El monto a pagar es este
  -- más los centavos que lo hacen único (`monto_esperado`).
  total_usd NUMERIC(12, 2) NOT NULL CHECK (total_usd > 0),
  cotizacion NUMERIC(12, 2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'pagada', 'vencida')),
  -- Se completan cuando el comprador elige red; puede cambiarla mientras no pague.
  red TEXT CHECK (red IN ('tron', 'bsc', 'polygon', 'base')),
  monto_esperado NUMERIC(12, 2),
  -- Desde dónde mirar la blockchain: número de bloque en las EVM, timestamp
  -- en milisegundos en Tron. Un pago anterior no puede pagar esta orden.
  bloque_inicio BIGINT,
  vence_at TIMESTAMPTZ,
  -- Lo que vio el sistema y no pudo resolver solo ("llegaron 148.5 de 150.97").
  observacion TEXT,
  pagada_at TIMESTAMPTZ,
  mail_enviado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- La garantía de que el monto identifica a la orden: dos pendientes de la
-- misma red nunca esperan lo mismo. Elegir red reintenta con otros centavos.
CREATE UNIQUE INDEX IF NOT EXISTS festival_ordenes_monto_unico
  ON festival_ordenes (red, monto_esperado) WHERE estado = 'pendiente';

-- Una transferencia de USDT/USDC que entró a la wallet de Manso.
CREATE TABLE IF NOT EXISTS festival_cripto_pagos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  red TEXT NOT NULL,
  token TEXT NOT NULL,
  contrato TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INT NOT NULL DEFAULT 0,
  desde TEXT NOT NULL,
  -- En unidades del token (USDT/USDC ≈ 1 dólar), truncado a 6 decimales.
  monto NUMERIC(30, 6) NOT NULL,
  -- Misma unidad que `festival_ordenes.bloque_inicio` para esa red.
  bloque BIGINT NOT NULL,
  -- Una transferencia paga una sola orden, y una orden se paga con una sola.
  orden_id UUID UNIQUE REFERENCES festival_ordenes (id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (red, tx_hash, log_index)
);

CREATE INDEX IF NOT EXISTS festival_cripto_pagos_sueltos_idx ON festival_cripto_pagos (red, monto) WHERE orden_id IS NULL;

-- Hasta dónde se leyó cada red, y cuándo (para no leerla en cada consulta de
-- cada comprador: la pantalla de pago pregunta cada pocos segundos).
CREATE TABLE IF NOT EXISTS festival_cripto_redes (
  red TEXT PRIMARY KEY,
  cursor BIGINT,
  escaneado_at TIMESTAMPTZ
);
INSERT INTO festival_cripto_redes (red) VALUES ('tron'), ('bsc'), ('polygon'), ('base')
ON CONFLICT (red) DO NOTHING;

CREATE TABLE IF NOT EXISTS festival_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_id UUID NOT NULL REFERENCES festival_ordenes (id) ON DELETE CASCADE,
  entrada_id UUID REFERENCES festival_entradas (id) ON DELETE SET NULL,
  entrada_nombre TEXT NOT NULL,
  -- Lo que va en el QR. 12 caracteres hex: no se adivina.
  codigo TEXT NOT NULL UNIQUE,
  usado BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festival_tickets_orden_idx ON festival_tickets (orden_id);

ALTER TABLE festival_ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_cripto_pagos ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_cripto_redes ENABLE ROW LEVEL SECURITY;
ALTER TABLE festival_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS festival_ordenes_admin ON festival_ordenes;
CREATE POLICY festival_ordenes_admin ON festival_ordenes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS festival_cripto_pagos_admin ON festival_cripto_pagos;
CREATE POLICY festival_cripto_pagos_admin ON festival_cripto_pagos FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS festival_cripto_redes_admin ON festival_cripto_redes;
CREATE POLICY festival_cripto_redes_admin ON festival_cripto_redes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
DROP POLICY IF EXISTS festival_tickets_admin ON festival_tickets;
CREATE POLICY festival_tickets_admin ON festival_tickets FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Acredita una transferencia a una orden y emite sus tickets, todo en una
-- transacción. Devuelve false sin tocar nada si la orden ya estaba pagada o
-- la transferencia ya era de otra orden: así dos acreditaciones simultáneas
-- (el cron y la pantalla del comprador) no duplican nada.
--
-- No mira montos ni bloques: eso lo decide quien llama (`lib/festival-compra`).
-- Un pack (`entradas_por_unidad` > 1) da un ticket por persona.
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

REVOKE ALL ON FUNCTION public.festival_acreditar_pago(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.festival_acreditar_pago(UUID, UUID) TO service_role;
