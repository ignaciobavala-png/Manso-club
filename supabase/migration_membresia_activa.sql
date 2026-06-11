-- Agrega campos de membresía a user_profiles
-- Permite distinguir registrados gratis de miembros pagos
-- membresia_activa: switch principal de acceso a contenido exclusivo
-- membresia_hasta: fecha de vencimiento (NULL = vitalicio)
-- membresia_tipo: etiqueta libre ('mensual', 'anual', 'vitalicio', etc.)

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS membresia_activa  BOOLEAN      NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS membresia_hasta   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS membresia_tipo    TEXT;

-- Permite al admin actualizar perfiles (activar/desactivar membresías)
CREATE POLICY "admins_update_profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );
