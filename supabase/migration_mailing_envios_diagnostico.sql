-- ============================================================
-- Migration: Mailing — distinguir "nunca salió" de "Resend lo rechazó"
--
-- Contexto (campaña 2026-07-29, 920 destinatarios): 7 de 10 lotes
-- fallaron en la propia llamada a resend.batch.send(). El código marcaba
-- esas filas como 'failed' y descartaba el error, así que quedaban
-- indistinguibles de un rechazo real de Resend y sin motivo registrado.
-- Nadie podía saber a quién reenviarle sin arriesgar duplicados.
--
--   - 'no_enviado'   → el mail nunca llegó a la API de Resend (resend_id null).
--                      Es seguro reenviarle: esa persona no recibió nada.
--   - 'failed'       → Resend lo aceptó y después no pudo entregarlo.
--   - error_detalle  → mensaje crudo del lote, para diagnosticar sin logs.
-- ============================================================

ALTER TABLE mailing_envios ADD COLUMN IF NOT EXISTS error_detalle text;

ALTER TABLE mailing_envios DROP CONSTRAINT IF EXISTS mailing_envios_estado_check;
ALTER TABLE mailing_envios
  ADD CONSTRAINT mailing_envios_estado_check
  CHECK (estado IN ('enviado', 'delivered', 'bounced', 'failed', 'no_enviado'));

-- Backfill: toda fila 'failed' sin resend_id nunca fue aceptada por Resend.
-- Reclasificarla es lo que permite reenviarle sin duplicar a quien sí recibió.
UPDATE mailing_envios
SET estado = 'no_enviado'
WHERE estado = 'failed' AND resend_id IS NULL;

-- El reenvío filtra por (campania_id, estado); el índice existente es solo
-- por campania_id y estas tablas crecen ~1 fila por destinatario por campaña.
CREATE INDEX IF NOT EXISTS idx_mailing_envios_campania_estado
  ON mailing_envios(campania_id, estado);

-- ============================================================
-- Métricas agregadas en Postgres, no en el cliente
--
-- El admin traía todas las filas de mailing_envios con .in(campania_id) y
-- las contaba en JS. Supabase corta las respuestas en 1000 filas por
-- defecto: con 971 envíos acumulados ya estaba al borde, y la próxima
-- campaña grande habría mostrado métricas truncadas sin ningún error
-- visible. Agregar en la DB devuelve una fila por campaña y no crece nunca.
--
-- security invoker: la RLS de mailing_envios (admin-only) sigue aplicando.
-- ============================================================

CREATE OR REPLACE FUNCTION public.mailing_metricas()
RETURNS TABLE (
  campania_id uuid,
  total bigint,
  delivered bigint,
  bounced bigint,
  failed bigint,
  no_enviado bigint,
  opened bigint,
  clicked bigint
)
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    e.campania_id,
    count(*),
    count(*) FILTER (WHERE e.estado = 'delivered'),
    count(*) FILTER (WHERE e.estado = 'bounced'),
    count(*) FILTER (WHERE e.estado = 'failed'),
    count(*) FILTER (WHERE e.estado = 'no_enviado'),
    count(*) FILTER (WHERE e.opened_at IS NOT NULL),
    count(*) FILTER (WHERE e.clicked_at IS NOT NULL)
  FROM mailing_envios e
  GROUP BY e.campania_id;
$$;

REVOKE ALL ON FUNCTION public.mailing_metricas() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.mailing_metricas() TO authenticated;
