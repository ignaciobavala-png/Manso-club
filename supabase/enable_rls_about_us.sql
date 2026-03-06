-- Habilitar Row Level Security (RLS) para la tabla about_us
ALTER TABLE about_us ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura pública (para el sitio público)
CREATE POLICY "Public read access to about_us" ON about_us
  FOR SELECT USING (true);

-- Política para permitir operaciones completas solo al admin específico
CREATE POLICY "Admin full access to about_us" ON about_us
  FOR ALL USING (
    auth.uid() = 'f9530aab-6a9f-4403-b828-006cc23fe862'
  );

-- Comentario sobre las políticas:
-- La primera política permite que cualquiera (público) pueda leer los datos de about_us
-- La segunda política permite que solo el usuario con ID f9530aab-6a9f-4403-b828-006cc23fe862 pueda modificar los datos
-- Esto asegura que solo el admin principal tenga acceso completo a la tabla
