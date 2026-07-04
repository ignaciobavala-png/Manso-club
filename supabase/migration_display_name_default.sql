-- ============================================================
-- FORO — display_name default = parte del email antes del @
-- Elimina los "Anónimo" cuando el usuario no cargó un nombre
-- ============================================================

-- 1) Trigger de alta de usuario: default display_name desde el email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, role, display_name)
  VALUES (NEW.id, NEW.email, 'member', split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Backfill de perfiles existentes sin display_name
UPDATE user_profiles
SET display_name = split_part(email, '@', 1)
WHERE display_name IS NULL OR btrim(display_name) = '';

-- 3) Backfill de posts/replies ya creados que quedaron con autor_nombre null
--    (se copió en el momento del insert, antes de tener display_name)
UPDATE foro_threads t
SET autor_nombre = p.display_name
FROM user_profiles p
WHERE t.autor_id = p.id
  AND (t.autor_nombre IS NULL OR btrim(t.autor_nombre) = '');

UPDATE foro_replies r
SET autor_nombre = p.display_name
FROM user_profiles p
WHERE r.autor_id = p.id
  AND (r.autor_nombre IS NULL OR btrim(r.autor_nombre) = '');
