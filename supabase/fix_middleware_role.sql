-- Fix: funcion para que el middleware pueda leer el rol
-- sin depender de RLS (usa SECURITY DEFINER)
-- Ejecutar en Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role::TEXT FROM public.user_profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;
