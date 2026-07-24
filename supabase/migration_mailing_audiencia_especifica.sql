-- ============================================================
-- Migration: Mailing — audiencia "específico"
--    - Permite elegir una lista puntual de emails en vez de un
--      segmento (newsletter/activos/vencidos/todos)
-- ============================================================

ALTER TABLE mailing_campanias ADD COLUMN IF NOT EXISTS destinatarios_especificos text[];

ALTER TABLE mailing_campanias DROP CONSTRAINT IF EXISTS mailing_campanias_audiencia_check;
ALTER TABLE mailing_campanias
  ADD CONSTRAINT mailing_campanias_audiencia_check
  CHECK (audiencia IN ('newsletter', 'activos', 'vencidos', 'todos', 'especifico'));
