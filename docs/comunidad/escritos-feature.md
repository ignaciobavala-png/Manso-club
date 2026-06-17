# Escritos — Feature Design

## Concepto

Sección de escritura y lectura compartida entre la comunidad registrada de Manso. Los miembros (user_2) pueden publicar notas, ensayos y documentos. Todos los usuarios registrados (user_1 y user_2) pueden leer. Nadie sin cuenta conoce de su existencia.

Es el complemento intelectual del perfil de artista: mientras el perfil muestra quién sos, los escritos muestran cómo pensás.

---

## Modelo de acceso

| Usuario | Escribir | Leer |
|---|---|---|
| user_0 (no registrado) | ✗ | ✗ — ni ve la sección |
| user_1 (registrado) | ✗ | ✓ |
| user_2 (miembro) | ✓ | ✓ |

La sección `/escritos` no aparece en el navbar para user_0. Solo se vincula desde `/mi-cuenta` y desde el menú de usuarios registrados.

---

## Rutas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/escritos` | user_1 + user_2 | Listado de todos los escritos publicados |
| `/escritos/[slug]` | user_1 + user_2 | Lectura de un escrito individual |
| `/escritos/nuevo` | user_2 | Editor para crear escrito nuevo |
| `/escritos/[slug]/editar` | user_2 (autor) | Editar propio escrito |

---

## Base de datos

```sql
CREATE TABLE escritos (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users NOT NULL,
  titulo       text NOT NULL,
  slug         text UNIQUE NOT NULL,
  contenido    jsonb,           -- Tiptap JSON
  extracto     text,            -- ~200 chars plano para preview en listado
  publicado    boolean DEFAULT true,
  active       boolean DEFAULT true,  -- moderación reactiva por admin
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
```

**RLS:**
- `SELECT`: autenticados donde `active = true AND publicado = true`
- `INSERT`: solo user_2 (`membresia_activa = true` vigente)
- `UPDATE / DELETE`: ownership (`user_id = auth.uid()`) + user_2

**Slug:** generado automáticamente desde el título al guardar (kebab-case + sufijo único si colisión).

---

## Librería: Tiptap

**Por qué Tiptap:**
- Headless — sin estilos propios, se aplica el diseño de Manso directamente
- React-first, compatible con Next.js App Router
- MIT license, gratuita
- StarterKit cubre el 80% del caso de uso: párrafos, headings, listas, bold/italic, citas, código inline

**Paquetes a instalar:**
```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-link @tiptap/extension-character-count
```

---

## Componentes a crear

```
app/
  escritos/
    page.tsx                  — listado (server, fetch + auth check)
    [slug]/
      page.tsx                — lectura (server, auth check)
      editar/
        page.tsx              — editor (redirige si no es autor)
    nuevo/
      page.tsx                — editor (redirige si no es miembro)

components/
  escritos/
    EscritoCard.tsx           — card para el listado (título, extracto, autor, fecha)
    EscritoEditor.tsx         — Tiptap editor con toolbar custom estilo Manso
    EscritoViewer.tsx         — render del JSON de Tiptap a HTML con clases Manso
    EscritosList.tsx          — grid/lista de EscritoCard
```

---

## Moderación admin

En `UsuarioDrawer`, si el usuario tiene escritos publicados, aparece una sección con la lista de sus escritos y toggle Ocultar/Publicar por escrito — mismo patrón que el toggle de artistas.active.

---

## UX notable

- El editor ocupa toda la pantalla (fullscreen-like) con fondo manso-black y tipografía grande
- Autoguardado cada 30s en localStorage como borrador (no requiere DB hasta que el usuario publique)
- Contador de caracteres visible discretamente
- Al publicar, se genera el slug y redirige a `/escritos/[slug]`
- El user_1 que intenta ir a `/escritos/nuevo` ve un teaser con CTA a membresías

---

## Integración con Mi Cuenta

En `/mi-cuenta`, agregar tab **"Escritos"** para user_2:
- Lista los propios escritos con estado (publicado / borrador)
- Botón "Nuevo escrito" → `/escritos/nuevo`
- Desde cada item, editar o despublicar

---

## Lo que NO hace (fuera de scope)

- Comentarios en escritos (puede sumarse después)
- Escritos en el perfil público de artista (perfil es público, escritos son solo para registrados)
- Likes / reacciones (puede sumarse después)
- Imágenes dentro del editor (puede sumarse con extensión Tiptap Image)
