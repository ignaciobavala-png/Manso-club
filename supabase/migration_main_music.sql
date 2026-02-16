CREATE TABLE IF NOT EXISTS main_music (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  artista TEXT NOT NULL,
  soundcloud_url TEXT NOT NULL,
  orden INT DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE main_music ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active main_music"
  ON main_music FOR SELECT
  USING (active = true);

CREATE POLICY "Authenticated users can manage main_music"
  ON main_music FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
