-- ============================================================
-- Migration: Mailing — campañas programadas
--    - scheduled_at: fecha/hora en la que el cron debe disparar la campaña
--    - estado 'programada' entre borrador y enviada
-- ============================================================

ALTER TABLE mailing_campanias ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;

ALTER TABLE mailing_campanias DROP CONSTRAINT IF EXISTS mailing_campanias_estado_check;
ALTER TABLE mailing_campanias
  ADD CONSTRAINT mailing_campanias_estado_check
  CHECK (estado IN ('borrador', 'programada', 'enviada'));

CREATE INDEX IF NOT EXISTS idx_mailing_campanias_programadas
  ON mailing_campanias(scheduled_at)
  WHERE estado = 'programada';
