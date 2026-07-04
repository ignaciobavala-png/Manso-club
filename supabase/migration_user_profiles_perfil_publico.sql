-- ============================================================
-- USER_PROFILES — campos opcionales de "carta de presentación"
-- Permite que cualquier miembro complete una bio y links sociales
-- que se muestran en su perfil público (/usuario/[id]), visible
-- al clickear su nombre en el foro.
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB NOT NULL DEFAULT '[]'::jsonb;

-- user_profiles no tiene lectura pública (solo dueño/admin), y no queremos
-- exponer email/role/membresía a cualquiera. Se crea una vista con solo
-- los campos de presentación, de lectura pública, para /usuario/[id].
CREATE OR REPLACE VIEW public.user_profiles_publico AS
SELECT id, display_name, avatar_url, bio, social_links, created_at
FROM public.user_profiles;

GRANT SELECT ON public.user_profiles_publico TO anon, authenticated;
