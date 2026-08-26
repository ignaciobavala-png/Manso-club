# Vynil — juego social de playlists

> Boceto. Nada de esto está implementado todavía.
> Rama: `vynil-social`. Boceto visual: `docs/vynil-social/boceto.html`.

## La idea en una línea

Cada usuario tiene un **crate** (bandeja de 12 vinilos). Un vinilo = un tema de
YouTube + una línea contando por qué. El crate se comparte con un link, y quien
lo abre escucha; para devolver la gentileza tiene que loguearse.

## Por qué esto y no "una playlist más"

- La restricción es el juego: **12 lugares**. Para meter uno nuevo hay que sacar
  otro. Eso convierte la lista en una declaración de identidad, no en un archivo.
- El texto de 140 caracteres es lo que se comparte de verdad. La gente no manda
  links de temas, manda *el motivo*.
- El objeto (el vinilo girando sobre la bandeja) es lo que hace que se screenshotee.

## Mecánicas

| Mecánica | Qué hace | Para qué |
|---|---|---|
| **Cargar** | pegás link de YouTube → se toma título, canal y miniatura (oEmbed, sin API key) | fricción cero |
| **Etiqueta de momento** | amanecer / previa / pico / bajón / viaje | filtra y da tema de conversación |
| **Robar** | copia un tema a tu crate citando a quien lo puso | viralización interna sin plagio |
| **Fuego** | el "me gusta"; ordena los rankings | señal barata |
| **Duelo de crates** | dos usuarios, 6 temas cada uno, la comunidad vota una semana | evento recurrente |
| **Crate de la casa** | Manso arma uno semanal con lo más pinchado y sale en el mail | conecta con el mailing existente |

## Reproducción

Embed de YouTube (IFrame API) en un player chico y persistente. **No** descargar
ni cachear audio: se reproduce en el embed oficial, así el juego queda del lado
correcto de los términos de YouTube y las views se las lleva el artista.

## El embudo

```
alguien comparte el crate (story / WhatsApp)
        ↓
/vynil/[usuario] público — se escucha sin cuenta
        ↓
querés robar un tema o armar el tuyo → registro
        ↓
crate armado = perfil social lleno (/usuario/[id] ya existe)
        ↓
un tema con 3+ fuegos abre hilo en /foro
```

Los dos últimos pasos son el punto: hoy `/usuario/[id]` muestra bio y los
últimos hilos del foro, y queda vacío para casi todos. El crate lo llena solo.

## Modelo de datos (primer tiro)

```sql
-- un crate por usuario (por ahora)
vynil_crates (
  id uuid pk,
  user_id uuid fk auth.users unique,
  slug text unique,            -- /vynil/[slug]
  titulo text,                 -- "para el amanecer"
  publico bool default true,
  created_at, updated_at
)

vynil_temas (
  id uuid pk,
  crate_id uuid fk,
  youtube_id text not null,    -- normalizado, no la url cruda
  titulo text, canal text, thumb_url text,   -- cacheado de oEmbed
  comentario text check (char_length(comentario) <= 140),
  momento text check (momento in ('amanecer','previa','pico','bajon','viaje')),
  posicion int,                -- 1..12
  robado_de uuid fk vynil_temas null,        -- crédito al original
  created_at,
  unique (crate_id, youtube_id)
)

vynil_fuegos (tema_id, user_id, created_at, pk (tema_id, user_id))
```

- Tope de 12 con un trigger o un check por `posicion between 1 and 12`.
- RLS: lectura pública si `crate.publico`; escritura solo del dueño.
- `foro_threads` gana una FK opcional `vynil_tema_id` para el hilo automático.

## Rutas

- `/vynil` — tu bandeja (editar) · requiere login
- `/vynil/[slug]` — crate público, server component, ISR
- `/vynil/explorar` — más pinchados de la semana, crates nuevos
- `/api/vynil/oembed` — resuelve un link de YouTube a título/canal/thumb
- OG image dinámica del crate con Satori (`/vynil/[slug]/opengraph-image`)

## Fases

1. **Boceto** ← estamos acá. UI del deck + concepto.
2. **MVP**: tablas, `/vynil` editable, `/vynil/[slug]` público, player embed.
3. **Social**: fuegos, robar, OG image, botón compartir.
4. **Comunidad**: hilo automático en el foro, duelos, crate de la casa en el mail.

## Preguntas abiertas

- ¿12 es el número? Podría ser 10 (una cara de LP) o 7 (un EP).
- ¿Un crate por usuario o varios (uno por momento)? Uno solo pega más fuerte,
  varios retienen más. Arrancaría con uno.
- ¿El crate es de la membresía o de cualquier registrado? Diría cualquiera —
  el juego necesita volumen antes que exclusividad.
- ¿Los artistas del sitio tienen crate destacado en `/artistas/[slug]`?
