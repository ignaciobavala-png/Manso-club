# Navegación — Navbar + Footer

**Archivos fuente:**
- Navbar: `components/Layout/Navbar.tsx:1-307`
- Footer: `components/Layout/Footer.tsx:1-74`
- Root layout: `app/layout.tsx:60-86` (donde se montan)

---

## Navbar

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component (`'use client'`) |
| Posición | `fixed top-0 w-full z-40` |
| Dependencias | `usePathname`, `useCart`, `useUser` |

### Estados de scroll

```typescript
// components/Layout/Navbar.tsx:36-40
const isScrolled = window.scrollY > 20;
```

- **Top de página** (`!isScrolled && !isCartOpen && !isLightBgPage`): fondo transparente, texto `manso-cream`, logo blanco
- **Scrolleado** (`isScrolled || isCartOpen || isLightBgPage`): fondo blanco con blur, texto `manso-black`, logo negro

La página `/checkout` activa `isLightBgPage` (`components/Layout/Navbar.tsx:34`).

### Logo

Doble versión según estado:
- Claro: `/manso-logo-white.png` + `/manso-name-white.png`
- Oscuro: `/manso-logo-black.png` + `/manso-name-black.png`

Ambos dentro de un `<Link href="/">`.

### Navegación desktop (5 links principales)

```typescript
// components/Layout/Navbar.tsx:59-65
{ name: 'about us',   href: '/about' },
{ name: 'membresias', href: '/membresias' },
{ name: 'agenda',     href: '/agenda' },
{ name: 'artistas',   href: '/artistas' },
{ name: 'tienda',     href: '/tienda' },
```

Estilo: `text-[10px] font-black uppercase tracking-[0.4em]`. Hover: `text-orange-600`.

### Link LIVE (streaming)

```typescript
// components/Layout/Navbar.tsx:119-127
<Link href="/streaming" className="text-manso-terra">
  <Play /> LIVE
</Link>
```

Solo visible después del montaje (`hasMounted`). Siempre visible en desktop y mobile.

### Sidebar izquierdo (burger "más")

```typescript
// components/Layout/Navbar.tsx:11-16
const sidebarLinks = [
  { name: 'Manifiesto',           href: '/manifiesto' },
  { name: 'Multimedia',           href: '/multimedia' },
  { name: 'Presentá tu proyecto', href: '/presenta-tu-proyecto' },
  { name: 'Trabajá con nosotros', href: '/trabaja-con-nosotros' },
];
```

- Botón "más" con ícono hamburger → abre sidebar desde la izquierda
- Overlay negro con blur (`bg-black/50 backdrop-blur-sm`)
- Panel: `w-72`, fondo `bg-manso-black`, transición `translate-x`
- Links en tipografía grande (`text-2xl font-black italic`)
- Footer del sidebar: "Buenos Aires — 2026"
- Se cierra al hacer hover fuera (`onMouseLeave`)

### Auth button (desktop)

```typescript
// components/Layout/Navbar.tsx:146-171
```

- **Logueado**: botón con avatar circular (inicial del `display_name`) + nombre truncado → link a `/mi-cuenta` o `/mansoadm` según rol
- **No logueado**: botón "Login" → `/login`
- Solo visible después del montaje (`hasMounted && !userLoading`)

### Carrito

```typescript
// components/Layout/Navbar.tsx:26-27
const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
```

- Ícono `ShoppingBag` con badge numérico (naranja) si `itemCount > 0`
- Click → abre `CartSidebar` (`components/shop/CartSidebar.tsx`)
- El sidebar se cierra automáticamente al scrollear más de 300px

### Menú mobile

```typescript
// components/Layout/Navbar.tsx:248-304
```

- Fullscreen, fondo blanco
- Header: "Menú" + botón X
- Sección auth: perfil del usuario (si logueado) + link a Mi Cuenta / Panel Admin
- Links principales + LIVE
- Separador + links secundarios (sidebar links)

### Comportamiento en cambio de ruta

```typescript
// components/Layout/Navbar.tsx:54-57
useEffect(() => {
  setIsSidebarOpen(false);
  setIsMenuOpen(false);
}, [pathname]);
```

Sidebar y menú mobile se cierran automáticamente al navegar.

---

## Footer

### Componente

| Detalle | Valor |
|---------|-------|
| Tipo | Client component |
| Posición | Fuera del `<main>` en el layout |

### Secciones

**Branding:**
- "Manso Club" en grande
- Dirección: "Cdad. de la Paz 601, C1426, CABA" (link a Google Maps)
- Instagram: `@manso___club` con ícono

**Links rápidos (2 columnas):**

| Manso | Servicios |
|-------|-----------|
| Nosotros (`/about`) | Membresías (`/membresias`) |
| Artistas (`/artistas`) | Tienda (`/tienda`) |
| Agenda (`/agenda`) | |
| Eventos (`/#eventos-section`) | |

**Créditos:**
- "Sitio desarrollado por Petra-Labs" (link a `petralabs.xyz`)
