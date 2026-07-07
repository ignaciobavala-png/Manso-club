-- ============================================================
-- Migration: Mailing — deduplicar interacciones por reintento de webhook
--    - Resend/svix entrega webhooks "at-least-once": un reintento por
--      timeout o respuesta no-2xx puede reenviar el mismo evento.
--    - svix_id (header "svix-id", único por entrega) sirve de clave de
--      idempotencia: el webhook hace upsert con ignoreDuplicates.
-- ============================================================

ALTER TABLE mailing_interacciones ADD COLUMN IF NOT EXISTS svix_id text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mailing_interacciones_svix_id
  ON mailing_interacciones(svix_id)
  WHERE svix_id IS NOT NULL;
