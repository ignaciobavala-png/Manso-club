-- Añadir campos para imágenes separadas por dispositivo
-- Permitirá que cada slide tenga una imagen para desktop y otra para mobile

-- Añadir campos específicos para cada dispositivo
ALTER TABLE hero_config 
ADD COLUMN media_url_desktop TEXT,
ADD COLUMN media_url_mobile TEXT;

-- Migrar datos existentes: si hay media_url, copiarlo a ambos campos
UPDATE hero_config 
SET media_url_desktop = media_url, 
    media_url_mobile = media_url 
WHERE media_url IS NOT NULL;

-- Opcional: eliminar el campo antiguo después de la migración
-- ALTER TABLE hero_config DROP COLUMN media_url;

-- Crear índices para optimizar consultas
CREATE INDEX idx_hero_config_media_desktop ON hero_config(media_url_desktop) WHERE media_url_desktop IS NOT NULL;
CREATE INDEX idx_hero_config_media_mobile ON hero_config(media_url_mobile) WHERE media_url_mobile IS NOT NULL;

-- Comentarios sobre los nuevos campos
COMMENT ON COLUMN hero_config.media_url_desktop IS 'URL de la imagen optimizada para desktop';
COMMENT ON COLUMN hero_config.media_url_mobile IS 'URL de la imagen optimizada para mobile';
