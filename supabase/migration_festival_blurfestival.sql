-- El festival se mudó de /blur a /blurfestival (12/11, pedido de Ana).
--
-- El conteo de visitas guarda la ruta de cada pantalla. Sin esto, el panel
-- mostraría cada pantalla partida en dos renglones (lo de antes de la mudanza
-- con /blur y lo de después con /blurfestival) y las viejas quedarían sin
-- nombre. Correr junto con el deploy que trae la mudanza.
--
-- Se puede correr más de una vez: lo ya mudado no vuelve a coincidir.

UPDATE festival_visitas
   SET path = '/blurfestival' || substr(path, length('/blur') + 1)
 WHERE path = '/blur' OR path LIKE '/blur/%';

UPDATE festival_clicks
   SET path = '/blurfestival' || substr(path, length('/blur') + 1)
 WHERE path = '/blur' OR path LIKE '/blur/%';

-- Prefijos que Ana excluyó del conteo desde el panel (ej. {/blur/compra}).
UPDATE festival_conteo_config
   SET rutas_excluidas = ARRAY(
         SELECT CASE
                  WHEN r = '/blur' OR r LIKE '/blur/%'
                    THEN '/blurfestival' || substr(r, length('/blur') + 1)
                  ELSE r
                END
           FROM unnest(rutas_excluidas) AS r
       )
 WHERE EXISTS (
         SELECT 1 FROM unnest(rutas_excluidas) AS r
          WHERE r = '/blur' OR r LIKE '/blur/%'
       );
