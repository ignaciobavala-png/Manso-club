CREATE TABLE ofertas_empleo (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  area TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  activo BOOLEAN DEFAULT true,
  orden INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE ofertas_empleo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ofertas_empleo_public_read" ON ofertas_empleo
  FOR SELECT USING (true);

CREATE POLICY "ofertas_empleo_admin_write" ON ofertas_empleo
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_ofertas_empleo_updated_at
  BEFORE UPDATE ON ofertas_empleo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

INSERT INTO ofertas_empleo (area, descripcion, orden) VALUES
  ('Producción', 'Coordinación de eventos, talleres y actividades en el espacio.', 1),
  ('Comunicación', 'Gestión de redes, contenido visual y estrategia de marca.', 2),
  ('Curaduría', 'Selección y programación de artistas, ciclos y residencias.', 3),
  ('Técnica', 'Sonido, iluminación y soporte técnico para eventos en vivo.', 4);
