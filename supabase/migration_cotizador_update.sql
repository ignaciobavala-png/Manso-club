-- ============================================================
-- Actualización del cotizador: cambiar capacidades de multiplicador a precio fijo
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna de precio a capacidades
ALTER TABLE cotizador_capacidades 
ADD COLUMN IF NOT EXISTS precio integer DEFAULT 0;

-- 2. Migrar datos existentes (convertir multiplicadores a precios estimados)
-- Usamos un precio base de referencia de $50000 para la conversión
UPDATE cotizador_capacidades 
SET precio = CASE 
    WHEN multiplicador = 1.0 THEN 50000   -- Hasta 50 personas
    WHEN multiplicador = 1.3 THEN 65000   -- Hasta 100 personas  
    WHEN multiplicador = 1.6 THEN 80000   -- Hasta 200 personas
    WHEN multiplicador = 2.0 THEN 100000  -- Más de 200 personas
    ELSE 50000
END
WHERE precio = 0;

-- 3. Eliminar columna de multiplicador (opcional, después de verificar)
-- ALTER TABLE cotizador_capacidades DROP COLUMN multiplicador;

-- 4. Actualizar datos iniciales para que usen precios en lugar de multiplicadores
-- Primero eliminamos los datos existentes para evitar duplicados
DELETE FROM cotizador_capacidades WHERE label IN (
  'Hasta 50 personas', 
  'Hasta 100 personas', 
  'Hasta 200 personas', 
  'Más de 200 personas'
);

-- Luego insertamos los nuevos datos
INSERT INTO cotizador_capacidades (label, precio, orden) VALUES
  ('Hasta 50 personas',    50000, 1),
  ('Hasta 100 personas',   75000, 2),
  ('Hasta 200 personas',   100000, 3),
  ('Más de 200 personas',  150000, 4);
