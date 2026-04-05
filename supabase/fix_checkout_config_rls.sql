-- Fix: habilitar RLS en checkout_config y definir políticas explícitas
-- Ejecutar en Supabase Dashboard > SQL Editor

ALTER TABLE checkout_config ENABLE ROW LEVEL SECURITY;

-- Lectura pública (el frontend de checkout necesita leer los datos bancarios)
DROP POLICY IF EXISTS "checkout_config_public_read" ON checkout_config;
CREATE POLICY "checkout_config_public_read"
  ON checkout_config FOR SELECT
  TO anon, authenticated
  USING (true);

-- Escritura solo para usuarios autenticados (admin)
DROP POLICY IF EXISTS "checkout_config_auth_insert" ON checkout_config;
CREATE POLICY "checkout_config_auth_insert"
  ON checkout_config FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "checkout_config_auth_update" ON checkout_config;
CREATE POLICY "checkout_config_auth_update"
  ON checkout_config FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
