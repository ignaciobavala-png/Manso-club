-- ============================================================
-- Migration: Mailing — interacciones (opens + clicks)
--    - Resend emite email.opened / email.clicked vía webhook
--    - opened_at / clicked_at = primer toque, para tasas por campaña
--    - mailing_interacciones = detalle por evento (qué link, cuándo)
--      para medir qué botón rinde más
-- ============================================================

ALTER TABLE mailing_envios ADD COLUMN IF NOT EXISTS opened_at timestamptz;
ALTER TABLE mailing_envios ADD COLUMN IF NOT EXISTS clicked_at timestamptz;

CREATE TABLE IF NOT EXISTS mailing_interacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  envio_id uuid REFERENCES mailing_envios(id) ON DELETE CASCADE,
  resend_id text,
  tipo text NOT NULL CHECK (tipo IN ('open', 'click')),
  link text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mailing_interacciones_envio ON mailing_interacciones(envio_id);
CREATE INDEX IF NOT EXISTS idx_mailing_interacciones_tipo ON mailing_interacciones(tipo);

ALTER TABLE mailing_interacciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mailing_interacciones_admin_all" ON mailing_interacciones;
CREATE POLICY "mailing_interacciones_admin_all"
  ON mailing_interacciones FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
