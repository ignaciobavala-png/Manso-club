-- Festival: interruptor general del line-up. Mientras no esté cerrado, Ana lo
-- apaga y /festival/line-up dice "se anuncia pronto" (y las páginas de los
-- artistas dan 404) sin tener que ocultar a cada artista. Arranca visible para
-- no cambiar lo que ya se ve.
ALTER TABLE festival_config ADD COLUMN IF NOT EXISTS lineup_visible BOOLEAN NOT NULL DEFAULT true;
