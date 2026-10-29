-- Festival: el comprador sube el comprobante de la transferencia.
--
-- Antes la persona lo mandaba por WhatsApp con el código de la orden y Ana lo
-- cruzaba a ojo. Ahora lo sube en /blur/compra/[id] y Ana lo ve en Ventas, al
-- lado de "Confirmar pago".
--
--   comprobante_path        ruta dentro del bucket `festival-comprobantes`.
--   comprobante_at          cuándo se subió (la última vez, si lo reemplazó).
--   transferencia_declarada_at
--                           cuándo la persona apretó "Ya transferí" (exige el
--                           comprobante subido). Es una declaración, no un pago:
--                           Ana sigue confirmando contra el banco. Separa las
--                           órdenes con algo para verificar ("Por confirmar") de
--                           las que eligieron transferencia y se fueron ("Sin
--                           avisar"), que vencen solas a las 48 h.
--   comprobante_aviso_at    cuándo se le avisó a Ana por mail (al declarar). Se
--                           reclama una sola vez por orden (Resend free: 100/día).

ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS comprobante_path TEXT;
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS comprobante_at TIMESTAMPTZ;
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS comprobante_aviso_at TIMESTAMPTZ;
ALTER TABLE festival_ordenes ADD COLUMN IF NOT EXISTS transferencia_declarada_at TIMESTAMPTZ;

-- Bucket PRIVADO y sin ninguna policy: un comprobante trae CBU, DNI y nombre
-- completo. Solo se toca desde el servidor con la service role (subir y
-- generar el link firmado de 60 s que abre Ana). Sin policy de SELECT no hay
-- forma de listarlo ni de bajarlo con la anon key.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'festival-comprobantes',
  'festival-comprobantes',
  false,
  4194304,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;
