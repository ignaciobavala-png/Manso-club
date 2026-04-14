-- ============================================================
-- Cotizador: cambiar duraciones de multiplicador a precio fijo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna precio
ALTER TABLE cotizador_duraciones
ADD COLUMN IF NOT EXISTS precio integer NOT NULL DEFAULT 0;

-- 2. Migrar valores existentes (si los hay con multiplicador)
-- Usar un precio de referencia de $50.000 como base para convertir
UPDATE cotizador_duraciones
SET precio = CASE
    WHEN multiplicador = 1.0 THEN 50000
    WHEN multiplicador = 1.5 THEN 75000
    WHEN multiplicador = 2.0 THEN 100000
    WHEN multiplicador = 2.5 THEN 125000
    WHEN multiplicador = 3.0 THEN 150000
    ELSE ROUND(multiplicador * 50000)
END
WHERE precio = 0;

-- 3. Actualizar los registros seed con precios reales (ajustar a los valores del negocio)
UPDATE cotizador_duraciones SET precio = 50000  WHERE label = '2 horas';
UPDATE cotizador_duraciones SET precio = 75000  WHERE label = '4 horas';
UPDATE cotizador_duraciones SET precio = 100000 WHERE label = '6 horas';
UPDATE cotizador_duraciones SET precio = 125000 WHERE label = '8 horas';
UPDATE cotizador_duraciones SET precio = 150000 WHERE label = 'Día completo';
