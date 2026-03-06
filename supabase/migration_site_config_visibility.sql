-- Agregar campo de visibilidad a la tabla site_config
ALTER TABLE site_config 
ADD COLUMN visible BOOLEAN DEFAULT true;

-- Crear índice para optimizar consultas de visibilidad
CREATE INDEX idx_site_config_visible ON site_config(visible);

-- Actualizar configuraciones existentes para que sean visibles por defecto
UPDATE site_config SET visible = true WHERE visible IS NULL;
