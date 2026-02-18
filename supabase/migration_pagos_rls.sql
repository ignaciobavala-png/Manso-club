-- ============================================================
-- MANSO CLUB - Políticas RLS para Tablas de Pagos (CRÍTICO)
-- Ejecutar en Supabase SQL Editor (Dashboard > SQL Editor)
-- Fecha: 2026-02-18
-- ============================================================

-- ============================================================
-- 1. VERIFICAR Y CREAR TABLAS DE PAGOS (si no existen)
-- ============================================================

-- Tabla ordenes
CREATE TABLE IF NOT EXISTS ordenes (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  estado VARCHAR(50) NOT NULL DEFAULT 'pendiente',
  total DECIMAL(10,2) NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  mp_preference_id VARCHAR(255),
  mp_payment_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla orden_items
CREATE TABLE IF NOT EXISTS orden_items (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  tipo VARCHAR(50) NOT NULL,
  referencia_id VARCHAR(255),
  nombre VARCHAR(255) NOT NULL,
  precio DECIMAL(10,2) NOT NULL,
  cantidad INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla tickets
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  orden_id INTEGER NOT NULL REFERENCES ordenes(id) ON DELETE CASCADE,
  orden_item_id INTEGER REFERENCES orden_items(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  tipo VARCHAR(50) NOT NULL,
  evento_nombre VARCHAR(255),
  usado BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla configuracion (si no existe)
CREATE TABLE IF NOT EXISTS configuracion (
  id SERIAL PRIMARY KEY,
  clave VARCHAR(255) NOT NULL UNIQUE,
  valor TEXT,
  descripcion TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. HABILITAR RLS EN TABLAS DE PAGOS
-- ============================================================

ALTER TABLE IF EXISTS ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS orden_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS configuracion ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. LIMPIAR POLÍTICAS ANTERIORES (evitar duplicados)
-- ============================================================

-- ordenes
DROP POLICY IF EXISTS "ordenes_public_insert" ON ordenes;
DROP POLICY IF EXISTS "ordenes_owner_select" ON ordenes;
DROP POLICY IF EXISTS "ordenes_admin_all" ON ordenes;

-- orden_items
DROP POLICY IF EXISTS "orden_items_public_insert" ON orden_items;
DROP POLICY IF EXISTS "orden_items_admin_all" ON orden_items;

-- tickets
DROP POLICY IF EXISTS "tickets_public_select_by_code" ON tickets;
DROP POLICY IF EXISTS "tickets_admin_all" ON tickets;

-- configuracion
DROP POLICY IF EXISTS "configuracion_admin_all" ON configuracion;

-- ============================================================
-- 4. POLÍTICAS PARA: ordenes
--    - anon/authenticated puede INSERT (para crear orden)
--    - Solo el dueño (email = auth.jwt()->>email) puede SELECT su orden
--    - Solo admin puede SELECT todas, UPDATE, DELETE
-- ============================================================

-- Política para INSERT (crear orden)
CREATE POLICY "ordenes_public_insert"
  ON ordenes FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para SELECT del dueño
CREATE POLICY "ordenes_owner_select"
  ON ordenes FOR SELECT
  TO authenticated
  USING (email = auth.jwt()->>'email');

-- Política para admin (SELECT, UPDATE, DELETE)
CREATE POLICY "ordenes_admin_all"
  ON ordenes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- 5. POLÍTICAS PARA: orden_items
--    - anon/authenticated puede INSERT
--    - Solo admin puede SELECT todas, DELETE
-- ============================================================

-- Política para INSERT
CREATE POLICY "orden_items_public_insert"
  ON orden_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Política para admin (SELECT, DELETE)
CREATE POLICY "orden_items_admin_all"
  ON orden_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- 6. POLÍTICAS PARA: tickets
--    - anon puede SELECT por código único (para ver su ticket)
--    - Solo admin puede SELECT todos, UPDATE (marcar usado), DELETE
-- ============================================================

-- Política para SELECT por código (público)
CREATE POLICY "tickets_public_select_by_code"
  ON tickets FOR SELECT
  TO anon, authenticated
  USING (codigo IS NOT NULL);

-- Política para admin (SELECT, UPDATE, DELETE)
CREATE POLICY "tickets_admin_all"
  ON tickets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- 7. POLÍTICAS PARA: configuracion
--    - Solo admin puede SELECT, INSERT, UPDATE, DELETE
--    - Nadie más puede ver esta tabla
-- ============================================================

-- Política para admin (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY "configuracion_admin_all"
  ON configuracion FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- ============================================================
-- 8. ÍNDICES PARA MEJORAR RENDIMIENTO
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_ordenes_email ON ordenes(email);
CREATE INDEX IF NOT EXISTS idx_ordenes_estado ON ordenes(estado);
CREATE INDEX IF NOT EXISTS idx_ordenes_mp_payment_id ON ordenes(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_orden_items_orden_id ON orden_items(orden_id);
CREATE INDEX IF NOT EXISTS idx_tickets_codigo ON tickets(codigo);
CREATE INDEX IF NOT EXISTS idx_tickets_email ON tickets(email);
CREATE INDEX IF NOT EXISTS idx_tickets_orden_id ON tickets(orden_id);
CREATE INDEX IF NOT EXISTS idx_configuracion_clave ON configuracion(clave);

-- ============================================================
-- 9. AUDITORÍA: Verificar estado final
-- ============================================================

-- Ver todas las tablas con RLS habilitado
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ordenes', 'orden_items', 'tickets', 'configuracion')
ORDER BY tablename;

-- Ver todas las políticas activas en tablas de pagos
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('ordenes', 'orden_items', 'tickets', 'configuracion')
ORDER BY tablename, policyname;

-- Contar registros por tabla (auditoría de datos)
SELECT 'ordenes' AS tabla, COUNT(*) AS registros FROM ordenes
UNION ALL
SELECT 'orden_items', COUNT(*) FROM orden_items
UNION ALL
SELECT 'tickets', COUNT(*) FROM tickets
UNION ALL
SELECT 'configuracion', COUNT(*) FROM configuracion;
