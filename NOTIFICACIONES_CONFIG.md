# Configuración de Variables de Entorno

Para que el sistema de notificaciones funcione correctamente, necesitas configurar las siguientes variables de entorno en tu archivo `.env`:

## Variables Requeridas

```env
# Supabase (ya deberías tener estas)
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key

# Email (Resend API)
RESEND_API_KEY=re_your_api_key_here

# Revalidación (ya deberías tener esta)
NEXT_PUBLIC_REVALIDATE_SECRET=tu_revalidate_secret
```

## Pasos para Configurar

### 1. Configurar Resend para Emails

1. Ve a [Resend.com](https://resend.com) y crea una cuenta
2. Obtén tu API key
3. Verifica tu dominio `manso.club` para enviar emails
4. Agrega la API key a tus variables de entorno

### 2. Ejecutar Migration de Base de Datos

Ejecuta el siguiente SQL en tu proyecto Supabase para crear la tabla de pedidos:

```sql
-- Puedes ejecutar el contenido del archivo:
-- supabase/migration_pedidos.sql
```

### 3. Configurar Email de Notificaciones

En el dashboard de admin, ve a la pestaña "Checkout" y configura:

- **Email para notificaciones**: El email donde Ana recibirá los pedidos (ej: `ana@manso.club`)
- **WhatsApp**: Número de WhatsApp para notificaciones
- **Datos bancarios**: CBU, alias, titular, etc.

## Flujo de Notificaciones

Cuando un cliente compra:

1. ✅ **Base de datos**: Se guarda el pedido con estado `pendiente_pago`
2. ✅ **Email**: Se envía email automático a Ana con detalles completos  
3. ✅ **WhatsApp**: Se envía notificación al número configurado
4. ✅ **Dashboard**: Ana puede ver todos los pedidos en la pestaña "Pedidos"

## Gestión de Pedidos

Desde el dashboard, Ana podrá:

- Ver todos los pedidos recibidos
- Actualizar estados (pendiente → pagado → enviado)
- Ver detalles de cliente y productos
- Confirmar qué notificaciones se enviaron

El sistema está completamente funcional una vez configuradas las variables de entorno.
