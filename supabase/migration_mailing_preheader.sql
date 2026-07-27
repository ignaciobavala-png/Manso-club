-- ============================================================
-- Migration: Mailing — pre-header por campaña
--    - El texto de vista previa que la casilla muestra al lado
--      del asunto era el asunto repetido ("Asunto - Asunto");
--      ahora cada campaña define su propio pre-header
-- ============================================================

ALTER TABLE mailing_campanias
  ADD COLUMN IF NOT EXISTS preheader text;
