-- ============================================================
-- Migration: Mailing — color de fondo por campaña
--    - El marco del mail (Body del template) era siempre crema
--      (#FFFCDC); ahora cada campaña elige su color para que
--      coincida con el fondo del arte (ej: piezas sobre negro)
-- ============================================================

ALTER TABLE mailing_campanias
  ADD COLUMN IF NOT EXISTS color_fondo text NOT NULL DEFAULT '#FFFCDC';
