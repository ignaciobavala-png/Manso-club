-- ============================================================
-- Migration: Exclusiones de mailing (opt-out)
--    - Emails que no deben recibir campañas, sin borrar su cuenta
--    - Se filtra en resolverAudiencia() para cualquier segmento
-- ============================================================

CREATE TABLE IF NOT EXISTS mailing_exclusiones (
  email text PRIMARY KEY,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE mailing_exclusiones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mailing_exclusiones_admin_all" ON mailing_exclusiones;
CREATE POLICY "mailing_exclusiones_admin_all"
  ON mailing_exclusiones FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
