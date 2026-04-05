CREATE TABLE manifiesto (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contenido TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO manifiesto (contenido) VALUES ('');

CREATE UNIQUE INDEX single_manifiesto_record ON manifiesto ((1));

ALTER TABLE manifiesto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "manifiesto_public_read" ON manifiesto
  FOR SELECT USING (true);

CREATE POLICY "manifiesto_admin_write" ON manifiesto
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE TRIGGER update_manifiesto_updated_at
  BEFORE UPDATE ON manifiesto
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
