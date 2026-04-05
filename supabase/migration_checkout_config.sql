-- Crear tabla para configuración del checkout
CREATE TABLE IF NOT EXISTS checkout_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_checkout_config_key ON checkout_config(key);

-- Insertar configuración inicial por defecto
INSERT INTO checkout_config (key, value, description) VALUES
('banco_nombre', 'Banco Galicia', 'Nombre del banco para transferencias'),
('banco_cbu', '0070053430000001234567', 'CBU para transferencias bancarias'),
('banco_alias', 'MANSO.CLUB.TIENDA', 'Alias para transferencias bancarias'),
('banco_titular', 'MANSO CLUB S.A.', 'Titular de la cuenta bancaria'),
('banco_cuit', '30-12345678-9', 'CUIT del titular'),
('whatsapp_numero', '5491130232533', 'Número de WhatsApp para notificaciones'),
('whatsapp_mensaje_confirmacion', 'Gracias por tu pedido. Te contactaremos pronto con los datos bancarios para proceder con el pago.', 'Mensaje de confirmación automático'),
('email_notificaciones', 'pedidos@manso.club', 'Email para recibir notificaciones de pedidos'),
('moneda', 'ARS', 'Moneda predeterminada para los pedidos'),
('tiempo_entrega', '3-5 días hábiles', 'Tiempo estimado de entrega')
ON CONFLICT (key) DO NOTHING;

-- Crear trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_checkout_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER checkout_config_updated_at
  BEFORE UPDATE ON checkout_config
  FOR EACH ROW
  EXECUTE FUNCTION update_checkout_config_updated_at();

-- Conceder permisos (ajusta según tu configuración de RLS)
-- ALTER TABLE checkout_config ENABLE ROW LEVEL SECURITY;
