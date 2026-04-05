-- ============================================================
-- Manso Club — Seed de Artistas
-- Ejecutar DESPUÉS de migration_artistas.sql
-- Usa UPSERT para ser idempotente (se puede correr varias veces)
-- ============================================================

INSERT INTO artistas (nombre, slug, bio, estilo, imagen_url, soundcloud_url, social_links, active)
VALUES
  (
    'Ana Hagen',
    'ana-hagen',
    'Curadora de sonidos profundos y narrativos. Residente de Avant Garten, Ana Hagen es una de las selectoras más respetadas de Buenos Aires, moviéndose con maestría entre el techno, el house y el EBM para crear historias sonoras únicas.',
    'Techno / House / EBM',
    NULL,
    NULL,
    '{"instagram": "anahagen"}',
    true
  ),
  (
    'Porti',
    'porti',
    'La fusión perfecta entre la electrónica y el alma. La DJ y productora mendocina cautiva con sets híbridos que integran saxo y voces en vivo sobre bases de techno y progressive, ofreciendo una experiencia sensorial e intensa.',
    'Progressive / Techno / Live Hybrid',
    NULL,
    NULL,
    '{"instagram": "porti.dj"}',
    true
  ),
  (
    'Lucas Romero',
    'lucas-romero',
    'Referente del techno melódico con raíces cordobesas. Con una trayectoria iniciada en 2007, Lucas construye puentes emocionales en la pista a través de texturas hipnóticas y una conexión profunda con el público.',
    'Melodic Techno',
    NULL,
    NULL,
    '{"instagram": "lucasromero.dj"}',
    true
  ),
  (
    'Lu Russo',
    'lu-russo',
    'Elegancia sonora y curaduría minimalista. Con una presencia fuerte en Colonia Radio, Lu Russo explora las vertientes más sofisticadas del house y el minimal, priorizando la calidad rítmica y la atmósfera en cada set.',
    'Minimal / House',
    NULL,
    NULL,
    '{"instagram": "lurusso.dj"}',
    true
  ),
  (
    'Joaquinn',
    'joaquinn',
    'Techno de vanguardia, físico y mental. Joaquinn representa el sonido crudo y auténtico del circuito underground, entregando sesiones de alta intensidad diseñadas para los oídos más exigentes de la cultura club.',
    'Raw Techno / Industrial',
    NULL,
    NULL,
    '{"instagram": "joaquinn.dj"}',
    true
  ),
  (
    'Manu Alvarez',
    'manu-alvarez',
    'Energía pura y ritmo constante. Manu Alvarez se enfoca en el lado más bailable del House y Tech-House, diseñando sets dinámicos pensados para mantener la pista en movimiento con sonidos frescos y contundentes.',
    'House / Tech-House',
    NULL,
    NULL,
    '{"instagram": "manualvarez.dj"}',
    true
  ),
  (
    'Fabi Sarinelli',
    'fabi-sarinelli',
    'Técnica impecable y devoción por el vinilo. Fabi Sarinelli es una especialista en la selección fina de techno y house, destacándose por una mezcla precisa y un gusto exquisito por los sonidos analógicos y de vanguardia.',
    'Techno / House / Vinyl Select',
    NULL,
    NULL,
    '{"instagram": "fabisarinelli"}',
    true
  ),
  (
    'Lau Loinaz',
    'lau-loinaz',
    'Una mirada fresca y ecléctica a la escena electrónica. Lau Loinaz se distingue por su versatilidad, fusionando géneros con una sensibilidad moderna que se adapta perfectamente al espíritu artístico y experimental de Manso Club.',
    'Ecléctico / Electronic',
    NULL,
    NULL,
    '{"instagram": "lauloinaz"}',
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  nombre        = EXCLUDED.nombre,
  bio           = EXCLUDED.bio,
  estilo        = EXCLUDED.estilo,
  imagen_url    = COALESCE(EXCLUDED.imagen_url, artistas.imagen_url),
  soundcloud_url = COALESCE(EXCLUDED.soundcloud_url, artistas.soundcloud_url),
  social_links  = EXCLUDED.social_links,
  active        = EXCLUDED.active,
  updated_at    = now();
