-- ============================================================
-- Manso Club — Contenido largo para la página de detalle del taller
-- Agrega "contenido_detalle" a "agenda": el campo "descripcion" sigue
-- siendo la bajada corta (listado de agenda + metadata/share), y este
-- nuevo campo es el cuerpo largo que se muestra en la columna con
-- scroll de /agenda/[slug] (intro + bloques tipo "ENCUENTRO I, II...").
-- Ejecutar en Supabase SQL Editor
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='agenda' AND column_name='contenido_detalle') THEN
    ALTER TABLE agenda ADD COLUMN contenido_detalle text;
  END IF;
END $$;
