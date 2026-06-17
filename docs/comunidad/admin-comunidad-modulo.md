# Módulo Admin — Comunidad

## Qué es

Nueva pestaña "Comunidad" en el Dashboard admin (`/mansoadm`).
Centraliza todo lo relacionado a usuarios, membresías, comunicación y moderación.
Es el panel de control de la red — desde acá el admin ve y gestiona quién está dentro,
en qué nivel, y puede actuar sobre cualquier persona con un click.

---

## Gap de DB a resolver primero

Hoy `user_profiles` tiene:

```sql
role user_role  -- ENUM: 'admin' | 'member'
```

El ENUM no distingue entre **registrado gratis** y **miembro pago**.
Todo el que se registra queda como `'member'` — no hay forma de saber si pagó.

### Solución: agregar campo de membresía

```sql
ALTER TABLE user_profiles
  ADD COLUMN membresia_activa BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN membresia_hasta  TIMESTAMPTZ,
  ADD COLUMN membresia_tipo   TEXT;  -- 'mensual', 'anual', 'vitalicio'
```

Con esto el nivel de acceso se determina así:

| Condición | Nivel |
|---|---|
| `role = 'admin'` | Admin |
| `membresia_activa = TRUE` y `membresia_hasta > now()` (o null si vitalicio) | Miembro |
| Autenticado, sin membresía activa | Registrado |
| Sin sesión | Público |

`role` sigue siendo solo para permisos de admin.
`membresia_activa` es el switch de acceso a contenido exclusivo.

---

## Estructura del módulo

El tab "Comunidad" tiene cinco sub-secciones con navegación interna.

---

### 1. Usuarios

Vista central. Tabla de todos los `user_profiles` con:

- Email, display_name, fecha de registro
- Origen del registro: Google OAuth o email/contraseña
- Badge de nivel: `Registrado` / `Miembro` / `Admin`
- Último acceso
- Buscador por email o nombre

**Acción principal**: click en un usuario abre un panel lateral (drawer) con su
ficha completa y todas las acciones posibles sobre él sin salir de la pantalla.

```
┌─────────────────────────────────────┐
│  ana@gmail.com                      │
│  Registrada: 15 mar 2026 — Google   │
│  Nivel: Registrada (sin membresía)  │
│                                     │
│  [Activar membresía ▼]              │
│  [Enviar email]                     │
│                                     │
│  Último acceso: hace 2 días         │
│  Videos vistos: 4                   │
└─────────────────────────────────────┘
```

---

### 2. Membresías

Vista enfocada en el estado económico de la red:

- Lista de membresías activas ordenada por vencimiento más próximo
- Alertas visuales: vencen en < 7 días (amarillo), ya vencidas (rojo)
- Activar membresía a un usuario: elegir tipo (mensual / anual / vitalicio) + fecha
- Revocar o extender con un click
- Contador en tiempo real: cuántos miembros activos hay hoy

---

### 3. Comunicación

El puente hacia los usuarios — hoy completamente ausente en el admin:

- Lista unificada de emails: registrados + suscriptores de newsletter,
  con indicador de solapamiento (quién está en ambas listas)
- Segmentación rápida:
  - "Todos los registrados"
  - "Solo miembros activos"
  - "Registrados sin membresía" ← el segmento más valioso para convertir
  - "Suscriptores de newsletter no registrados"
- Export CSV por segmento
- Futuro: botón "Enviar notificación" a un segmento → dispara email por Resend

---

### 4. Actividad

El pulso de la comunidad — visibilidad de si la red crece o no:

- Nuevos registros por semana (gráfico simple de barras)
- Membresías activadas / vencidas este mes
- Contenido más visto en streaming
- Futuro: comentarios recientes, reacciones por video

No necesita ser complejo. Solo necesita responder la pregunta:
**¿la comunidad está creciendo esta semana?**

---

### 5. Moderación

Panel preparado para cuando existan comentarios (no bloquea el resto):

- Cola de comentarios recientes en videos de streaming
- Acciones por comentario: ocultar, borrar, marcar usuario
- Filtros: reportados / recientes / por video
- Futuro: sistema de reportes de usuarios entre sí

---

## Componentes a crear

```
components/admin/
├── ComunidadAdmin.tsx           ← contenedor del tab con sub-navegación interna
├── UsuariosList.tsx             ← tabla de todos los usuarios con buscador
├── UsuarioDrawer.tsx            ← panel lateral con ficha completa + acciones
├── FormActivarMembresia.tsx     ← form para activar/editar membresía de un usuario
├── MembresiaActivasList.tsx     ← tabla de activas con alertas de vencimiento
├── ComunidadComunicacion.tsx    ← listas segmentadas + export CSV
└── ComunidadActividad.tsx       ← métricas y gráfico de crecimiento
```

---

## Integración en Dashboard.tsx

1. Agregar `'comunidad'` al tipo del estado `tab`
2. Agregar botón en la barra de tabs con ícono `Network` o `Users2`
3. Renderizar `<ComunidadAdmin />` cuando `tab === 'comunidad'`

---

## RLS necesaria

El admin ya puede leer todos los `user_profiles` (política `admins_read_all_profiles` existe).
Falta política de UPDATE para que el admin pueda modificar `membresia_activa`:

```sql
CREATE POLICY "admins_update_profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));
```

---

## Orden de construcción sugerido

1. Migración de DB (`membresia_activa`, `membresia_hasta`, `membresia_tipo`) + RLS de UPDATE
2. `UsuariosList` + `UsuarioDrawer` + `FormActivarMembresia` → sección Usuarios funcional
3. `MembresiaActivasList` → sección Membresías
4. `ComunidadComunicacion` → sección Comunicación con export CSV
5. `ComunidadActividad` → métricas básicas
6. Moderación → cuando existan comentarios

---

## Estado

- [ ] Migración: agregar `membresia_activa`, `membresia_hasta`, `membresia_tipo`
- [ ] RLS: política `admins_update_profiles`
- [ ] `ComunidadAdmin.tsx` con sub-navegación interna
- [ ] `UsuariosList.tsx`
- [ ] `UsuarioDrawer.tsx`
- [ ] `FormActivarMembresia.tsx`
- [ ] `MembresiaActivasList.tsx`
- [ ] `ComunidadComunicacion.tsx`
- [ ] `ComunidadActividad.tsx`
- [ ] Integrar en `Dashboard.tsx`
- [ ] Actualizar lógica de acceso en `/streaming` y `/artistas/[slug]`
