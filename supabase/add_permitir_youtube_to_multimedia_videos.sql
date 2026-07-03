-- Permite marcar por video si el reproductor de YouTube debe habilitar el
-- link nativo al canal/YouTube, en vez del player bloqueado por defecto.
ALTER TABLE multimedia_videos ADD COLUMN IF NOT EXISTS permitir_youtube boolean NOT NULL DEFAULT false;
