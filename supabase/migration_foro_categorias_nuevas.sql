-- Nuevas categorías del foro
INSERT INTO foro_categorias (nombre, slug, descripcion, orden) VALUES
  ('Arte&Diseño', 'arte-diseno', 'Arte, diseño y todo lo visual', 4),
  ('Cine', 'cine', 'Cine, series y todo lo audiovisual narrativo', 5),
  ('Gastronomía', 'gastronomia', 'Comida, bebida y cultura gastronómica', 6),
  ('Innovación', 'innovacion', 'Ideas, tecnología e innovación', 7),
  ('Audiovisual', 'audiovisual', 'Fotografía, video y producción audiovisual', 8),
  ('Ideas', 'ideas', 'Propuestas e ideas para la comunidad', 9)
ON CONFLICT (slug) DO NOTHING;
