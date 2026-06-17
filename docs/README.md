# Documentación — Manso Club

Documentación técnica completa del sitio. Cada archivo describe cómo funciona lo que ya está construido.

## Mapa del proyecto

```
docs/
├── README.md                         ← este archivo
├── progreso.md                       ← log de sesiones de desarrollo
│
├── paginas/                          ← documentación de cada ruta pública (1 archivo = 1 feature)
│   ├── home.md                       ← /
│   ├── about.md                      ← /about
│   ├── artistas.md                   ← /artistas + /artistas/[slug]
│   ├── agenda.md                     ← /agenda + /agenda/pagar
│   ├── tienda.md                     ← /tienda + /producto/[id]
│   ├── membresias.md                 ← /membresias + /membresias/pagar
│   ├── checkout.md                   ← /checkout
│   ├── ticket.md                     ← /ticket/[codigo]
│   ├── streaming.md                  ← /streaming + /streaming/[slug]
│   ├── multimedia.md                 ← /multimedia
│   ├── contenido-estatico.md         ← /manifiesto, /trabaja-con-nosotros, /presenta-tu-proyecto
│   ├── mi-cuenta.md                  ← /mi-cuenta
│   └── auth.md                       ← /login, /registro, /recuperar-contrasena, /actualizar-contrasena, /auth/callback
│
├── sistemas/                         ← features transversales (tocan múltiples páginas)
│   ├── navegacion.md                 ← Navbar + Footer
│   ├── reproductor-global.md         ← GlobalMusicPlayer + HomeMusicPlayer
│   ├── carrito.md                    ← Zustand useCart store
│   ├── autenticacion.md              ← Middleware, Supabase SSR, roles, sesión
│   ├── visibilidad.md                ← Sistema de 3 niveles (público/registrado/miembro)
│   ├── isr-revalidacion.md           ← ISR, /api/revalidate, mapa de rutas
│   └── api.md                        ← Catálogo de 16 endpoints
│
├── comunidad/                        ← planificación de la feature Comunidad
│   ├── README.md
│   ├── concepto-principal.md
│   ├── niveles-de-acceso.md
│   ├── switch-publico-comunidad.md
│   ├── perfil-de-usuario.md
│   ├── admin-comunidad-modulo.md
│   └── artistas-extension-privada.md
│
└── seguridad/                        ← auditorías y technical debt de seguridad
    └── auditoria-login.md            ← auditoría de auth: 14 issues (4 críticos, 4 altos)
```

## Páginas vs sistemas

| Tipo | Carpeta | Cuándo leer |
|------|---------|-------------|
| **Página** | `paginas/` | Para entender una ruta específica: qué renderiza, qué datos consume, qué DB toca |
| **Sistema** | `sistemas/` | Para entender una feature que cruza varias páginas: cómo funciona el carrito, el reproductor, la navegación |

Si una página usa un sistema, el doc de la página lo menciona y linkea al doc del sistema.

## Stack

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Supabase + Framer Motion + Zustand

## Guía rápida: ¿qué leer para...?

| Necesito... | Leo |
|-------------|-----|
| Entender el checkout | `paginas/checkout.md` → `sistemas/carrito.md` |
| Entender cómo se filtra contenido por nivel de usuario | `sistemas/visibilidad.md` |
| Saber qué endpoints existen | `sistemas/api.md` |
| Entender el flujo de login/registro | `paginas/auth.md` → `sistemas/autenticacion.md` |
| Arreglar un bug de auth | `seguridad/auditoria-login.md` (14 issues documentados) |
| Agregar una feature de comunidad | `comunidad/README.md` (planificación) |
| Entender cómo funciona el reproductor de música | `sistemas/reproductor-global.md` |
| Ver qué tablas toca una página | El doc de la página en `paginas/`, sección "DB involucrada" |
| Planificar una feature nueva sobre algo existente | El doc de la página/sistema correspondiente |

## Archivos fuente

| Qué | Dónde |
|-----|-------|
| Páginas | `app/**/page.tsx` |
| API routes | `app/api/**/route.ts` |
| Componentes | `components/` |
| Stores | `store/` |
| Hooks | `hooks/` |
| Tipos | `lib/types/` |
| Clientes Supabase | `lib/supabase.ts` |
| Middleware | `middleware.ts` |
| Migraciones SQL | `supabase/*.sql` |

## Estado de la documentación

| Carpeta | Archivos | Estado |
|---------|----------|--------|
| `paginas/` | 13 | Completo — todas las rutas públicas documentadas |
| `sistemas/` | 7 | Completo — todos los sistemas transversales documentados |
| `comunidad/` | 7 | Completo — planificación de la feature |
| `seguridad/` | 1 | Completo — auditoría de auth con 14 issues |
