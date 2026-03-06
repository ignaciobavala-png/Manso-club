-- Migration: Agregar soporte para múltiples imágenes por producto
-- Cambiar de imagen_url (single) a imagenes_urls (array)

-- 1. Agregar nueva columna como array de texto
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS imagenes_urls TEXT[] DEFAULT '{}';

-- 2. Migrar datos existentes de imagen_url a imagenes_urls
UPDATE productos 
SET imagenes_urls = ARRAY[imagen_url] 
WHERE imagen_url IS NOT NULL 
AND imagen_url != '' 
AND (imagenes_urls IS NULL OR cardinalidad(imagenes_urls) = 0);

-- 3. Marcar la columna antigua como obsoleta (no eliminar aún por compatibilidad)
-- COMMENT ON COLUMN productos.imagen_url IS 'OBSOLETE: Usar imagenes_urls en su lugar';

-- 4. Crear índice para mejor rendimiento en búsquedas
CREATE INDEX IF NOT EXISTS idx_productos_imagenes_urls ON productos USING GIN (imagenes_urls);

-- Verificación
SELECT 
  COUNT(*) as total_productos,
  COUNT(CASE WHEN imagenes_urls IS NOT NULL AND cardinalidad(imagenes_urls) > 0 THEN 1 END) as con_imagenes,
  COUNT(CASE WHEN imagen_url IS NOT NULL AND imagen_url != '' THEN 1 END) as con_imagen_antigua
FROM productos;
