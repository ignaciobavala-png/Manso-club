UPDATE artistas
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{"instagram": "lucasromero____"}'::jsonb
WHERE nombre = 'Lucas Romero';

UPDATE artistas
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{"instagram": "johnny.driver_"}'::jsonb
WHERE nombre = 'Porti';

UPDATE artistas
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{"instagram": "anahagen__"}'::jsonb
WHERE nombre = 'Ana Hagen';

UPDATE artistas
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{"instagram": "fabustin"}'::jsonb
WHERE nombre = 'Fabi Sarinelli';

UPDATE artistas
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{"instagram": "run_luli_run"}'::jsonb
WHERE nombre = 'Lu Russo';

UPDATE artistas
SET social_links = COALESCE(social_links, '{}'::jsonb) || '{"instagram": "joaquinn_______"}'::jsonb
WHERE nombre = 'Joaquinn';
