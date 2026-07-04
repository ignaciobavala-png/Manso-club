-- ============================================================
-- Migration: Mailing (campañas + historial de envíos)
--    - Campañas armadas como bloques (imagen/boton/texto) en jsonb
--    - Envíos registrados por destinatario para trazabilidad
--    - Todo admin-only
-- ============================================================

CREATE TABLE IF NOT EXISTS mailing_campanias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asunto text NOT NULL,
  bloques jsonb NOT NULL DEFAULT '[]',
  audiencia text NOT NULL CHECK (audiencia IN ('newsletter', 'activos', 'vencidos', 'todos')),
  estado text NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'enviada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

CREATE TABLE IF NOT EXISTS mailing_envios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campania_id uuid NOT NULL REFERENCES mailing_campanias(id) ON DELETE CASCADE,
  destinatario text NOT NULL,
  estado text NOT NULL DEFAULT 'enviado' CHECK (estado IN ('enviado', 'delivered', 'bounced', 'failed')),
  resend_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mailing_envios_campania ON mailing_envios(campania_id);

ALTER TABLE mailing_campanias ENABLE ROW LEVEL SECURITY;
ALTER TABLE mailing_envios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mailing_campanias_admin_all" ON mailing_campanias;
CREATE POLICY "mailing_campanias_admin_all"
  ON mailing_campanias FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "mailing_envios_admin_all" ON mailing_envios;
CREATE POLICY "mailing_envios_admin_all"
  ON mailing_envios FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
