-- ============================================================
-- fix_security_warnings.sql — 2026-06-28
-- Corrige warnings de seguridad del linter de Supabase:
--   1. function_search_path_mutable: SET search_path = '' en 6 funciones
--   2. artista_fotos RLS: eliminar políticas permisivas viejas + agregar admin
--   3. checkout_config RLS: restringir a is_admin()
--   4. REVOKE EXECUTE FROM anon en get_user_role y get_password_reset_pending
-- ============================================================


-- ============================================================
-- 1. SEARCH_PATH
-- ============================================================

-- Trigger functions sin refs a tablas: ALTER es suficiente
ALTER FUNCTION public.update_updated_at() SET search_path = '';
ALTER FUNCTION public.update_checkout_config_updated_at() SET search_path = '';

-- is_admin y handle_new_user ya usan public.* en el body
ALTER FUNCTION public.is_admin() SET search_path = '';
ALTER FUNCTION public.handle_new_user() SET search_path = '';

-- protect_permisos_totales: referencia user_profiles sin schema → recrear
CREATE OR REPLACE FUNCTION public.protect_permisos_totales()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.permisos_totales IS DISTINCT FROM OLD.permisos_totales THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION 'Solo un admin puede modificar permisos_totales';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- user_tiene_acceso_streaming: tres tablas sin schema → recrear
CREATE OR REPLACE FUNCTION public.user_tiene_acceso_streaming(p_contenido_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  -- Compra individual vigente
  IF EXISTS (
    SELECT 1 FROM public.streaming_compras
    WHERE user_id = v_user_id
      AND contenido_id = p_contenido_id
      AND (expira_en IS NULL OR expira_en > now())
  ) THEN
    RETURN true;
  END IF;

  -- Membresía activa que incluye streaming
  IF EXISTS (
    SELECT 1
    FROM public.user_membresias_activas uma
    JOIN public.membresias m ON m.id = uma.membresia_id
    WHERE uma.user_id = v_user_id
      AND uma.estado = 'activa'
      AND uma.vencimiento > now()
      AND m.incluye_streaming = true
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$;


-- ============================================================
-- 2. ARTISTA_FOTOS — eliminar políticas permisivas heredadas
-- La migración migration_artista_miembro_storage_rls.sql creó
-- member_*_own_fotos pero nunca borró las viejas con USING(true).
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can delete artista_fotos" ON public.artista_fotos;
DROP POLICY IF EXISTS "Authenticated users can insert artista_fotos" ON public.artista_fotos;
DROP POLICY IF EXISTS "Authenticated users can update artista_fotos" ON public.artista_fotos;

-- Los admins también necesitan gestionar fotos desde el panel
DROP POLICY IF EXISTS "admin_artista_fotos_insert" ON public.artista_fotos;
DROP POLICY IF EXISTS "admin_artista_fotos_update" ON public.artista_fotos;
DROP POLICY IF EXISTS "admin_artista_fotos_delete" ON public.artista_fotos;

CREATE POLICY "admin_artista_fotos_insert"
  ON public.artista_fotos FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_artista_fotos_update"
  ON public.artista_fotos FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "admin_artista_fotos_delete"
  ON public.artista_fotos FOR DELETE TO authenticated
  USING (public.is_admin());


-- ============================================================
-- 3. CHECKOUT_CONFIG — restringir a admin (no usado activamente
-- pero la tabla existe y las políticas son permisivas)
-- ============================================================
DROP POLICY IF EXISTS "checkout_config_auth_insert" ON public.checkout_config;
DROP POLICY IF EXISTS "checkout_config_auth_update" ON public.checkout_config;

CREATE POLICY "checkout_config_auth_insert"
  ON public.checkout_config FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY "checkout_config_auth_update"
  ON public.checkout_config FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- 4. REVOKE EXECUTE FROM anon
-- Estas funciones solo las necesita el servidor (middleware),
-- nunca un usuario anónimo.
-- ============================================================
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_password_reset_pending(uuid) FROM anon;
