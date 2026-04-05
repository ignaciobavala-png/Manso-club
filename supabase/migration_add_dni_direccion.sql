-- Agregar campos DNI y Dirección a tabla pedidos
-- Migration: 2024_03_09_add_dni_direccion_to_pedidos.sql

ALTER TABLE pedidos 
ADD COLUMN IF NOT EXISTS cliente_dni TEXT,
ADD COLUMN IF NOT EXISTS cliente_direccion TEXT;

-- Comentarios sobre los nuevos campos
COMMENT ON COLUMN pedidos.cliente_dni IS 'DNI del cliente (formato Argentina: 8 dígitos)';
COMMENT ON COLUMN pedidos.cliente_direccion IS 'Dirección completa del cliente para envío';

-- Actualizar política de inserción para incluir los nuevos campos
-- (La política actual ya permite inserción, solo necesitamos asegurarnos de que los campos sean opcionales)

-- Opcional: Crear índices si se van a buscar por estos campos frecuentemente
-- CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_dni ON pedidos(cliente_dni);
-- CREATE INDEX IF NOT EXISTS idx_pedidos_cliente_direccion ON pedidos(cliente_direccion);
