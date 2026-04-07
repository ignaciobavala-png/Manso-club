-- Añadir campo device_type a la tabla hero_config
-- Este campo permitirá especificar si una imagen está optimizada para desktop, mobile o ambos

ALTER TABLE hero_config 
ADD COLUMN device_type TEXT DEFAULT 'ambos' CHECK (device_type IN ('desktop', 'mobile', 'ambos'));

-- Crear índice para optimizar consultas por dispositivo
CREATE INDEX idx_hero_config_device_type ON hero_config(device_type);

-- Comentario sobre el nuevo campo
COMMENT ON COLUMN hero_config.device_type IS 'Tipo de dispositivo para el que está optimizada la imagen: desktop, mobile o ambos';
