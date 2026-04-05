-- Migration: Agregar campo descripción a productos
-- Añade un campo de breve descripción para cada producto

-- 1. Agregar columna descripción a la tabla productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS descripcion TEXT DEFAULT '';

-- 2. Verificación
SELECT 
  COUNT(*) as total_productos,
  COUNT(CASE WHEN descripcion IS NOT NULL AND descripcion != '' THEN 1 END) as con_descripcion,
  COUNT(CASE WHEN descripcion IS NULL OR descripcion = '' THEN 1 END) as sin_descripcion
FROM productos;

-- 3. Opcional: Agregar comentario a la columna
COMMENT ON COLUMN productos.descripcion IS 'Breve descripción del producto para mostrar en la tienda y dashboard';
