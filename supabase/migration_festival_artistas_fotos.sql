-- Galería de fotos por artista (página de line-up). Antes había una sola foto
-- (`foto_url`). Ahora `fotos` guarda todas, en orden; `foto_url` queda como la
-- primera, para que el listado, el OG y el sitemap sigan igual.
ALTER TABLE festival_artistas ADD COLUMN IF NOT EXISTS fotos text[] NOT NULL DEFAULT '{}';

-- Los artistas que ya tenían foto arrancan con esa como única del galería.
UPDATE festival_artistas
   SET fotos = ARRAY[foto_url]
 WHERE foto_url IS NOT NULL AND fotos = '{}';
