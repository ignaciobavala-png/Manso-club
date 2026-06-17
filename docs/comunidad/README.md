# Sistema de comunidad — Manso Club

Planificación del sistema de comunidad desde el login hacia adentro.
Esta carpeta documenta la arquitectura, las decisiones y el roadmap
de todas las features orientadas a usuarios registrados y miembros.

---

## Jerarquía de usuarios

```
TEAM / ADMIN   → crean, curan, moderan, administran la plataforma
MIEMBROS       → pertenecen, apoyan, acceden a todo el contenido
REGISTRADOS    → cuenta gratuita, acceden a contenido free y están en el funnel hacia membresía
PÚBLICO        → ven la vidriera pública, no pueden entrar al contenido
```

Cada capa tiene un motivo para subir a la siguiente.
El diseño de cada feature debe tener en cuenta en qué capa vive y cómo empuja hacia arriba.

---

## Concepto

> La membresía convierte al consumidor en creador. No venís a ver. Venís a ser parte.
> — [`concepto-principal.md`](./concepto-principal.md)

## Documentos en esta carpeta

- [`niveles-de-acceso.md`](./niveles-de-acceso.md) — **Arquitectura central**: los 3 niveles (público / registrado / miembro) y cómo se aplican
- [`perfil-de-usuario.md`](./perfil-de-usuario.md) — Perfil personal (registrados) + perfil público con publicación de arte visual/audio (miembros)
- [`switch-publico-comunidad.md`](./switch-publico-comunidad.md) — **Arquitectura de contenido dual**: toggle público/comunidad en el admin, columna `visibilidad`, mapa de secciones
- [`admin-comunidad-modulo.md`](./admin-comunidad-modulo.md) — Nuevo tab "Comunidad" en el Dashboard: usuarios, membresías, moderación + gap de DB
- [`artistas-extension-privada.md`](./artistas-extension-privada.md) — Extender páginas públicas de artistas con contenido privado para registrados
- *(más documentos a medida que se planifiquen features)*

---

## El loop de crecimiento

```
Artista comparte su página en Manso (pública, indexable)
        ↓
Su audiencia llega y ve contenido público atractivo
        ↓
Se registran (gratis) para acceder a contenido exclusivo del artista
        ↓
Descubren el universo Manso — otros artistas, eventos, streaming
        ↓
Los que se enganchan se convierten en miembros
        ↓
Ingresos financian más contenido y eventos → más artistas quieren sumarse
```

---

## Principios de diseño

- **Reciclar antes de construir** — extender lo que existe antes de crear algo nuevo
- **Sin login walls agresivos** — mostrar valor público, expandir con sesión
- **Cada artista es un canal de adquisición** — su página es su landing de adquisición
- **La membresía es identidad, no solo acceso** — el miembro se siente parte de algo
