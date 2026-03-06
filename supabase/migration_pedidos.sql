-- Crear tabla para pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT NOT NULL,
  cliente_telefono TEXT NOT NULL,
  productos JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'pendiente_pago',
  mensaje_whatsapp TEXT,
  notificacion_email_enviada BOOLEAN DEFAULT FALSE,
  notificacion_whatsapp_enviada BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON pedidos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_email ON pedidos(cliente_email);

-- Habilitar RLS
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;

-- Política para que solo admin pueda ver/manejar pedidos
CREATE POLICY "Solo admin puede gestionar pedidos" ON pedidos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'ana@manso.club'
    )
  );

-- Política para permitir inserción (desde el API endpoint sin autenticación)
CREATE POLICY "Permitir inserción de pedidos" ON pedidos
  FOR INSERT WITH CHECK (true);

-- Comentario sobre la tabla
COMMENT ON TABLE pedidos IS 'Tabla para registrar todos los pedidos de la tienda MANSO CLUB';
COMMENT ON COLUMN pedidos.estado IS 'Estados posibles: pendiente_pago, pagado, enviado, cancelado';
