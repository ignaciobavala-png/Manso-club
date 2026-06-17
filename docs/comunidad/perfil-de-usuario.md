# Perfil de usuario

## La idea

El perfil tiene dos versiones según el nivel del usuario.
No son dos páginas distintas — es la misma página que se expande con la membresía.

---

## Nivel Registrado — perfil personal

Accesible desde `/perfil` (privado, solo el propio usuario lo edita).

Campos disponibles:
- Foto de perfil
- Nombre para mostrar (display_name)
- Bio corta
- Links a redes sociales

Es un perfil de identidad dentro de Manso. No es público todavía.
El usuario existe en la comunidad pero no publica nada.

---

## Nivel Miembro — perfil público + publicación de arte

El miembro desbloquea dos cosas nuevas:

**1. Perfil público**
Una página pública en `/comunidad/[username]` (o `/u/[username]`).
Indexable, compartible, es su presencia dentro de Manso.

**2. Publicación de arte**
Desde su perfil puede subir y mostrar su trabajo:

| Tipo | Descripción |
|---|---|
| Visual | Imágenes, fotos, ilustraciones, diseño — galería propia |
| Audio | Sets, tracks, música — reproductor embebido o archivo directo |

El contenido publicado aparece en su perfil público y potencialmente
en una sección "Comunidad" del sitio donde se descubre el arte de los miembros.

---

## Por qué esto es poderoso para el efecto red

- El miembro no solo consume — **produce y muestra**
- Su perfil se convierte en un portfolio dentro del ecosistema Manso
- Comparte su URL de perfil con su audiencia → trae tráfico nuevo a Manso
- Manso se convierte en el **hogar digital de artistas emergentes**, no solo un club de consumo
- Crea un pipeline natural: miembro con arte → artista oficial de Manso

---

## DB necesaria

```sql
-- En user_profiles (ya existe): display_name, foto de perfil (avatar_url)
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS avatar_url   TEXT,
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS username     TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS links        JSONB;  -- { instagram, soundcloud, spotify, web }

-- Nueva tabla para el arte publicado por miembros
CREATE TABLE perfil_publicaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  tipo         TEXT NOT NULL,  -- 'visual' | 'audio'
  titulo       TEXT,
  descripcion  TEXT,
  url          TEXT NOT NULL,  -- URL del archivo en Supabase Storage o embed externo
  thumbnail_url TEXT,
  orden        INT DEFAULT 0,
  activo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Flujo de publicación para el miembro

1. Entra a su perfil → sección "Mi arte"
2. Sube una imagen o un archivo de audio (Supabase Storage) o pega un link externo (SoundCloud, Mixcloud, etc.)
3. Agrega título y descripción opcional
4. Queda publicado en su perfil público inmediatamente

No hay moderación previa — la membresía es el filtro de confianza.
El admin puede ocultar publicaciones desde el módulo Comunidad si es necesario.

---

## La URL del perfil público

`/comunidad/[username]` — el miembro elige su username al activar la membresía.

Muestra:
- Foto, nombre, bio, links
- Galería de arte visual (si publicó)
- Reproductor de audio / sets (si publicó)
- Badge "Miembro Manso" con fecha desde cuándo

---

## Relación con otras features

- El pipeline miembro → artista oficial conecta con [[artistas-extension-privada]]
- La moderación de publicaciones va en el módulo [[admin-comunidad-modulo]]
- El nivel de acceso que habilita publicar está en [[niveles-de-acceso]]

---

## Estado

- [ ] Migración: `avatar_url`, `bio`, `username`, `links` en `user_profiles`
- [ ] Migración: tabla `perfil_publicaciones`
- [ ] Página `/perfil` — edición de datos personales (registrados y miembros)
- [ ] Sección "Mi arte" en `/perfil` — solo miembros, subida de visual/audio
- [ ] Página pública `/comunidad/[username]` — perfil público del miembro
- [ ] RLS: solo el propio usuario puede insertar/editar sus publicaciones
- [ ] Admin: moderación de publicaciones en módulo Comunidad
