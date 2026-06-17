# Artistas — extensión privada para registrados

## La idea

La página `/artistas/[slug]` ya existe y es pública. En lugar de crear una sección
separada de streaming por artista, **extender la misma URL** con contenido adicional
que solo aparece cuando el usuario tiene sesión activa.

Una URL, dos experiencias:

```
/artistas/ana  (pública, indexable, compartible)
│
├── Bio, foto, redes sociales           → todos ven (hoy ya existe)
├── Tracks / discografía preview        → todos ven (hoy ya existe)
│
└── [Solo si hay sesión]
    ├── Sets completos
    ├── Videos / grabaciones exclusivas
    └── CTA hacia próximo evento con la artista
```

## Por qué este patrón

- **No hay login wall agresivo** — el visitante llega a una página real, no a una puerta cerrada
- **El artista puede compartir su URL como link oficial** — funciona como landing pública y como hub privado al mismo tiempo
- **Reutiliza infraestructura existente** — la tabla `streaming_contenido` ya existe, solo necesita un campo `artista_slug` para vincular contenido a un artista
- **SEO** — la página pública es indexable por Google, el contenido privado no necesita serlo

## Caso de uso principal: Ana

Ana tiene sets grabados para compartir con quienes crean una cuenta en Manso (sin
requerir membresía paga). Su flujo natural:

1. Ana comparte `mansoclub.com.ar/artistas/ana` en Instagram
2. Sus seguidores llegan y ven su perfil público completo
3. Los interesados se registran para acceder a sus sets
4. Una vez registrados, descubren el resto del universo Manso

## Lo que hay que construir

### DB
- Agregar columna `artista_slug` (o `artista_id`) en `streaming_contenido`
- Permite vincular un video/set a un artista específico

### Backend
- En `/artistas/[slug]/page.tsx`: detectar sesión con Supabase SSR (patrón ya usado en el resto del proyecto)
- Si hay sesión: hacer un segundo fetch a `streaming_contenido` filtrando por `artista_slug`

### UI
- Sección nueva al final de la página de artista, solo renderizada si `user` existe
- Si no hay sesión: mostrar un bloque sutil ("Registrate para acceder al contenido exclusivo de Ana")
- Diseño consistente con el resto del streaming (misma estética de cards)

## Estado

- [ ] Decidir si el contenido de artistas es para **registrados** (free) o solo **miembros**
- [ ] Agregar `artista_slug` a la tabla `streaming_contenido`
- [ ] Implementar la sección condicional en `/artistas/[slug]/page.tsx`
- [ ] Cargar los sets de Ana desde el admin

## Relación con otras features

- Alimenta el loop de adquisición descrito en `README.md`
- Sienta las bases para comentarios/reacciones por video (próxima feature)
