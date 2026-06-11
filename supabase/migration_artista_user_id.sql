-- Vincula un perfil de artista con una cuenta de usuario
-- Permite que miembros (membresia_activa = true) gestionen su propio perfil

ALTER TABLE artistas
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_artistas_user_id ON artistas (user_id);

-- El miembro puede insertar su propio perfil de artista
DROP POLICY IF EXISTS "Miembro puede crear su perfil de artista" ON artistas;
CREATE POLICY "Miembro puede crear su perfil de artista"
  ON artistas FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- El miembro solo puede editar su propio perfil
DROP POLICY IF EXISTS "Miembro puede editar su propio perfil de artista" ON artistas;
CREATE POLICY "Miembro puede editar su propio perfil de artista"
  ON artistas FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
