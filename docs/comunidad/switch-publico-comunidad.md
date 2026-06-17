# Switch Público / Comunidad — arquitectura de contenido dual

## La idea

Mismo sitio, mismas URLs, mismos componentes.
El contenido se expande según el nivel del usuario que mira.
No hay páginas nuevas ni redirecciones — solo más contenido visible para quien tiene sesión.

En el admin, cada tab tiene un toggle en la parte superior:

```
[ PÚBLICO ]  [ COMUNIDAD ]
```

- **Público** → editás lo que ven todos, incluso sin cuenta
- **Comunidad** → editás la extensión que solo ven los registrados (o miembros)

---

## Cómo funciona en la DB

Una sola columna nueva en las tablas de contenido existentes:

```sql
visibilidad TEXT NOT NULL DEFAULT 'publico'
-- valores posibles:
--   'publico'    → todos lo ven
--   'registrado' → requiere cuenta gratuita
--   'miembro'    → requiere membresía activa
```

Sin tablas nuevas. Sin duplicar estructura.
Cada fila de contenido sabe para quién es.

---

## Cómo funciona en el frontend

Cada página server component evalúa la sesión y filtra:

```
¿Hay sesión?
  No  → SELECT WHERE visibilidad = 'publico'
  Sí, sin membresía → SELECT WHERE visibilidad IN ('publico', 'registrado')
  Sí, con membresía → SELECT WHERE visibilidad IN ('publico', 'registrado', 'miembro')
```

El contenido de comunidad aparece como una sección extra al final de la misma página.
No reemplaza el contenido público — lo extiende.

---

## Mapa de secciones y su extensión

| Sección | URL | Público | Registrado | Miembro |
|---|---|---|---|---|
| Home | `/` | Eventos del home, hero, música | Eventos extra para registrados | Eventos VIP / anuncios anticipados |
| Artistas | `/artistas/[slug]` | Bio, foto, tracks | Sets completos, videos | Contenido especial, sesiones privadas |
| Agenda | `/agenda` | Eventos abiertos | Eventos solo para registrados | Eventos exclusivos para miembros |
| Tienda | `/tienda` | Productos actuales | Productos o descuentos exclusivos | Acceso anticipado a lanzamientos |
| Streaming | `/streaming` | Anuncio / teaser de lo que hay | Acceso completo al catálogo | Contenido marcado como exclusivo |
| Membresías | `/membresias` | Info pública de planes | — | — |

---

## La experiencia del usuario

El registrado entra a `/artistas/ana` y ve exactamente la misma página que conocía,
pero con una sección adicional más abajo.

- Misma URL
- Mismo diseño
- Sin redirección
- Simplemente hay más

Siente que **desbloqueó** algo, no que fue movido a otro lugar.

---

## El switch en el admin

En cada tab del Dashboard, un toggle arriba a la derecha:

```
Artistas   [ PÚBLICO ▼ ]
           [ COMUNIDAD  ]
```

- En modo **Público**: el formulario y la lista muestran solo contenido con `visibilidad = 'publico'`
- En modo **Comunidad**: muestran contenido con `visibilidad = 'registrado'` o `'miembro'`,
  con un selector adicional para elegir a cuál nivel pertenece el ítem

El toggle no cambia de página ni de componente — solo filtra qué datos se muestran
y qué valor se asigna al crear contenido nuevo.

---

## Tablas que necesitan la columna `visibilidad`

| Tabla | Prioridad |
|---|---|
| `streaming_contenido` | Alta — ya tiene lógica de acceso |
| `artistas` / tracks de artistas | Alta — caso de uso de Ana |
| `agenda` | Media |
| `eventos_home` | Media |
| `productos` | Media |
| `multimedia` | Media |

La migración es la misma para todas:

```sql
ALTER TABLE <tabla>
  ADD COLUMN IF NOT EXISTS visibilidad TEXT NOT NULL DEFAULT 'publico';
```

---

## Relación con otros documentos

- El nivel de acceso está definido en [[niveles-de-acceso]]
- El módulo admin que gestiona esto está en [[admin-comunidad-modulo]]
- El caso concreto de artistas está en [[artistas-extension-privada]]

---

## Estado

- [x] Decisión tomada — switch público/comunidad en admin + columna `visibilidad`
- [x] Migración: agregar `visibilidad` a `streaming_contenido`
- [x] Migración: agregar `visibilidad` a tablas restantes (agenda, eventos_home, productos, multimedia_videos, artistas, artistas_tracks)
- [ ] Actualizar formularios del admin para mostrar el toggle y el selector de visibilidad
- [ ] Actualizar queries del frontend para filtrar por visibilidad según nivel del usuario
- [ ] Definir diseño del bloque "contenido de comunidad" en cada página pública
