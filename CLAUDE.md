# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server (webpack, port 3000) — NOT Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm email        # React Email preview server for the templates in emails/
pnpm mails:preview # Render the institucionales set to one static HTML file
npx tsc --noEmit  # Type check
npx eslint .      # Lint — `pnpm lint` is broken (see below)
```

`pnpm lint` runs `next lint`, which Next 16 removed: it fails with "Invalid
project directory provided, no such directory: ./lint". Use `npx eslint .`
until the script is migrated.

## Architecture

**Stack:** Next.js (App Router) + React 19 + TypeScript + Tailwind CSS v4 + Supabase + Framer Motion + Zustand

### Routing & Pages

- `app/` — App Router pages. Public routes: `/`, `/about`, `/artistas/[slug]`, `/agenda`, `/tienda`, `/membresias`, `/checkout`, `/ticket/[codigo]`
- `app/mansoadm/` — Protected admin dashboard (requires admin role). Tab-based UI with CRUD for artists, events, products, gallery, about us, orders, checkout config
- `app/api/` — API routes for checkout (Mercado Pago), orders, tickets, ISR revalidation, and a daily cron ping

### Auth & Middleware

`middleware.ts` protects `/mansoadm/*`. It uses Supabase SSR to check session, then calls an RPC (`get_user_roles`) to verify admin role. Login at `/login` redirects based on role.

### Key Directories

- `components/Home/` — Page sections (Hero, Gallery, Eventos, Membresias, Tienda preview)
- `components/Layout/` — Navbar, Footer, GlobalMusicPlayer
- `components/admin/` — 20+ admin components; each follows a `Form*` + `*List` pattern
- `lib/` — Supabase client, TypeScript types, static config (gallery, hero slides, site config)
- `store/useCart.ts` — Zustand cart store with localStorage persistence
- `hooks/` — `useAdminForm.ts` (generic CRUD with Supabase), `useArtistTrack.ts`
- `supabase/` — SQL migration files (source of truth for DB schema)

`agenda.dia_semana` es un `smallint` 0-6 (0 = lunes) y no puede representar un
rango. Para "Lunes a Viernes" está `agenda.dias_semana` (array); el calendario
expande una ocurrencia por cada día que contenga, y `dia_semana` se mantiene con
el primer día del rango para no romper lo viejo.

### Styling

Tailwind CSS v4 via PostCSS. Custom color palette — always use these tokens:
- `manso-black` (#000000 — negro puro; era #1D1D1B hasta que Ana pidió sacarle el gris), `manso-blue` (#030044), `manso-terra` (#BC2915)
- `manso-olive` (#868229), `manso-cream` (#FFFCDC), `manso-brown` (#542C1B)

Font: Helvetica Neue Pro (defined in global CSS). El título del hero del home
usa **Neue Montreal** (`font-montreal` / `TYPE.hero`): es paga y los `.woff2`
no están versionados — ver `public/fonts/README.md`. Sin los archivos cae a
Helvetica sin romper nada.

El hero (`HeroCarousel`) va centrado y sin tag ni descripción desde que Ana
pidió "que sea sólo el título": el carrusel sigue rotando imagen/video y
título, pero el copy largo no se muestra aunque esté cargado en el panel.

### Data Flow

- Content (artists, events, products, gallery) lives in Supabase and is fetched server-side in page components
- Admin mutations go through `useAdminForm` hook → Supabase JS client directly
- Cart state is client-side only (Zustand + localStorage)
- Payment flow: cart → `/checkout` → `/api/checkout/config` (Mercado Pago preference) → webhook at `/api/checkout/notify`
- ISR revalidation is triggered via `/api/revalidate/*` after admin saves

### Emails

Two families of templates live in `emails/`, and they are built for different
authors:

- `campania-generica.tsx` — the campaign template. The admin draws the piece as
  blocks (`BloqueMailing`) in `FormMailingCampania`, and the template renders
  whatever came out of the panel. Used by `lib/mailing-send.ts`,
  `/api/mailing/preview` and `/api/mailing/send-test`.
- `institucionales/` — fixed transactional pieces (`bienvenida`, `fecha`,
  `curso`, `descuento`). The design is closed in `layout/Institucional.tsx`
  (black 560px piece on a white page, banner + footer image, white pill button)
  and each template only supplies copy and a CTA, so they stay ~15 lines. Change
  the identity in the layout, not in the four templates.

The institucionales are **not wired to any send path yet** — they render and
preview, but nothing calls them. `emails/bienvenida.tsx` at the root is the older
standalone version, also unused; `institucionales/bienvenida.tsx` supersedes it.

`pnpm mails:preview` (`scripts/preview-institucionales.tsx`) renders the four
pieces with sample data into a single HTML file (default
`~/Escritorio/mails-manso.html`, or pass a path), each inside its own `srcdoc`
iframe so the styles can't bleed. Banner and footer point at the public URL, so
the script inlines them from `public/assets/emails/` as base64 to make the file
work offline.

### Cowork (solicitudes de inscripción)

El alta al cowork **no cobra nada**: todo entra como solicitud y Ana aprueba a
mano desde el panel. `/membresias/pagar` y el flujo de Mercado Pago siguen
existiendo pero ya no los linkea nadie.

Un único formulario (`components/ui/CoworkForm.tsx`) servido en un modal
(`CoworkModal.tsx`) con dos entradas:

- El botón `SELECCIONAR` de cada `MembresiaCard` — guarda `membresia_id` (para
  agrupar) y `membresia_nombre` (snapshot: no sigue los renombres del plan).
- El botón `OPEN COWORK` de `/membresias`, entre las cards y la galería —
  encuentro gratuito con cupo, la persona elige fecha en un acordeón.

El modal se puede abrir por link: `?form=open-cowork` o `?form=<membresia_id>`.
El parámetro se lee de `window.location.search` y **no** con `useSearchParams`,
porque `/membresias` se prerenderiza estática y el hook obligaría a un Suspense.

**Tablas** (`supabase/migration_cowork_solicitudes.sql`): `cowork_fechas` y
`cowork_solicitudes`. RLS: insertar es público (el formulario no pide login),
leer es solo admin — ahí hay mail y teléfono de gente real. Como el acordeón
público necesita mostrar los cupos restantes sin poder leer las solicitudes, el
conteo sale de `cowork_cupos()`, una función `security definer` que expone solo
números. Ocupan cupo las pendientes y aprobadas; una rechazada lo libera.

**Panel** (`MembresiasAdmin` → sección *Solicitudes*): dos pestañas porque son
dos circuitos distintos.

- `CoworkOpenCowork.tsx` — se ordena **por fecha**: cada encuentro es un bloque
  con sus cupos y sus anotados adentro. Filtro de ventana temporal (próximas /
  último mes / dos meses / todas) porque el archivo de fechas crece rápido. Las
  fechas se editan inline y **no se pueden borrar si tienen anotados** (la FK es
  `SET NULL`: no se perdería a la persona pero sí el dato de para qué día se
  anotó); para eso está *Ocultar*.
- `CoworkMembresias.tsx` — se ordena **por card**, con filtro por plan. No hay
  estado "pagado": para Ana pagado es *tener la membresía activa*, así que cada
  solicitud cruza el mail contra `user_profiles` y muestra la verdad (sin cuenta
  / registrado / membresía activa). Otorgar reusa `UsuarioDrawer`; si la persona
  no tiene cuenta, el botón ofrece copiar el link de registro.

### Festival — Subreal (`/festival`)

Sitio chico de un festival que nace de Manso pero con **identidad propia**:
`ChromeManso` (en el root layout) le saca navbar, footer y flotantes. La
estructura copia basilarfestival.com (pedido de Ana): un menú `> HOME > VISIÓN >
LOCACIÓN > LINE UP > TICKETS > INFO & FAQ` en `app/festival/layout.tsx` y una
página por sección. Todas leen por `lib/festival.ts` (cacheado por request).

- `/festival` — solo el hero, sin pie (`FueraDelHome`): la foto `fixed` a pantalla completa y **sin filtros** (`banner_url`,
  o `public/festival/hero-cabina.jpg` si el panel no tiene banner), el título y
  dos cajitas (fecha + horario, `lema`). El título dice **BLUR**
  (`TITULO_HERO`) con el filtro difuso de `TituloDifuso`, no `config.nombre`,
  que sigue siendo "Subreal" y es el que sale en la pestaña y el pie. Si BLUR
  pasa a ser el nombre, cambiarlo en el panel y volver a leerlo de ahí.
- `/vision` — texto del panel por `TextoResaltado`: `*así*` va en
  `color_resalte` y `**así**` en `color_acento`. No es Markdown, a propósito.
  `/locacion` no muestra su texto del panel (repetía la barra de datos): solo
  la barra (lugar, fecha, horario) y un mosaico de fotos (`GaleriaLocacion`, como la
  página Location de Basilar) que sale de `festival_config.locacion_fotos`
  (text[], ordenado desde el panel). `foto_url` quedó obsoleta.
- `/line-up` — en escalera; cada nombre lleva a `/line-up/[slug]`, que copia la
  estructura de `/speakers/[slug]` de la bitconf. Un B2B son dos filas de
  `festival_artistas` y la segunda tiene `b2b = true` ("con el de arriba").
  `festival_escenarios.artistas` (text[]) quedó obsoleta.
- `/tickets` — tabla de venta (modelo Passline): `en_venta` muestra contador; el
  resto, su estado. Los packs son una fila con `entradas_por_unidad` > 1.
- `/info` — `festival_faq` en tres columnas.

Diseño: fusión Basilar + Manso. Los colores vienen del panel
(`festival_config.color_*`) y por defecto son la paleta de Manso llevada a
oscuro (fondo `#1C1410`, cream, terra encendida `#E2532B`, oliva `#B9B23E`).
Tipografía: **Archivo** variable en ancho (ancha para el nombre del festival y
del artista, angosta para el menú y el line-up; clases `fest-*` en
`festival.css`), Helvetica para el texto corrido y Plex Mono para los datos.
El menú y el botón TICKETS van en **Space Mono** Bold (`.fest-menu`), con el
estilo del menú de Basilar (chevron dibujado con una máscara SVG en
`.fest-chevron`) pero más chico: 18px en escritorio en vez de sus 23,3px. Basilar en realidad usa Space Grotesk; el
equipo eligió la Mono.
El título del hero imita el logo de Basilar con Archivo y un filtro SVG
(`TituloDifuso`). Se probó el logo PNG de la diseñadora
(`public/festival/blur-logo.png`) y no gustó: volvió el filtro.
COMPRAR y los botones de pago van en la tipografía de TICKETS (`.fest-menu`),
un poco más grandes que él, no en Archivo a 24px.

**No publicada por RLS, no por código**: mientras `festival_config.publicado`
sea false, las tablas del festival (`supabase/migration_festival*.sql`) solo las lee un
admin, así que la página —que usa el cliente con cookies— da 404 a cualquier
otro. No está enlazada desde el sitio ni en el sitemap, y va `noindex`.

**Cobro: Mercado Pago, transferencia y cripto**, cada uno con su perilla en el
panel (Festival → Cobro). Se ofrece un medio solo si está prendido *y*
configurado (`mediosDePago` en `lib/festival-compra.ts`): MP necesita
`MP_ACCESS_TOKEN`, transferencia un CBU o alias en `checkout_config`, cripto las
wallets. Los tres terminan en `festival_emitir_orden` (marca pagada + un ticket
por persona) y el mismo mail con el link a `/festival/compra/[id]`.

- **Mercado Pago**: la API crea la preferencia con `external_reference =
  festival:<orden>` (el prefijo la separa de los pedidos de la tienda). Confirman
  `/api/festival/mp-webhook` y la vuelta del comprador (`?payment_id=`), leyendo
  el pago de la API de MP con nuestro token; por eso no depende de
  `MP_WEBHOOK_SECRET`, que no está cargado en Vercel.
- **Transferencia**: la compra muestra alias/CBU y un botón de WhatsApp con el
  código (8 primeros caracteres de la orden). Ana confirma en Festival → Ventas
  (`/api/festival/ordenes/[id]/confirmar`). No vencen.
- **Cripto** (apagado hasta tener wallet), directo a la wallet de Manso. **Solo
USDT, en BNB Smart Chain (BEP20) y Ethereum (ERC20)**: Ana pidió una sola forma
para no marear (07/10). Ethereum está porque Bitso saca USDT solo por ERC20 o
TRC20; BEP20 porque es la barata y Lemon/Binance la tienen. Verificado
leyendo la blockchain: sin pasarela, sin servidor propio y sin comisiones
(Bitcart se descartó porque necesita un VPS). Esquema y razones en
`supabase/migration_festival_cripto.sql` (y `_cripto_dos_redes.sql`, que sacó
Tron, Polygon, Base y USDC).

1. COMPRAR pide nombre y mail → `/api/festival/compra` arma la orden en
   `festival_ordenes` (pesos del panel ÷ blue, resuelto en el servidor).
2. `/festival/compra/[id]` (`PagoCripto`): el comprador elige red (BSC o
   Ethereum) y recibe un **monto único** —total + 1 a 99 centavos— que no
   comparte con ninguna otra pendiente de esa red (índice único). Es lo que
   permite reconocer el pago sin pedirle nada.
3. `sincronizarRed` (`lib/festival-compra.ts`) lee las transferencias que
   entraron a la wallet (`lib/cripto-escaner.ts`: `eth_getLogs`, sin
   librerías) y acredita la de monto exacto. La disparan
   la pantalla de pago (cada 8 s, con freno de 10 s por red) y el cron
   `/api/festival/conciliar` (cada 10 min).
4. Si el monto no coincide (el exchange descontó la comisión), el comprador
   pega el hash: se acepta si llegó al menos lo pedido; si llegó menos queda en
   `observacion` para que lo resuelva Ana.

- `festival_acreditar_pago` reclama la transferencia, marca la orden y crea
  los tickets (uno por persona: un pack x3 da tres) en una sola transacción.
- Los contratos de `lib/cripto-redes.ts` están verificados contra la cadena.
  **No editarlos de memoria**: el de USDC en Base se escribió mal de memoria
  (`4a71` por `4f71`) y apuntaba a una dirección vacía.
- Sin `FESTIVAL_WALLET_EVM` cripto no se ofrece aunque la perilla esté
  prendida. La misma dirección 0x sirve en las dos redes.
- `/festival/compra/demo` muestra la pantalla con datos inventados (sin API ni
  cadena, y con una "dirección" que no es una dirección) para enseñarla sin
  wallets; `?estado=pagada` muestra las entradas.
- Una orden vence a los 60 min de elegir red, pero un pago exacto que llegue
  dentro de las 24 h igual la acredita.

### Precios de la tienda

Cada producto guarda su **moneda de referencia** en `productos.moneda`
(`'USD' | 'ARS'`, default `'USD'` para lo que ya estaba cargado). El número que
se escribe en el panel es el que queda fijo; el precio en la otra moneda se
calcula con el blue al mostrarlo o al cobrar. Toda la conversión y el formato
pasan por `lib/precios.ts` — no multiplicar por la cotización a mano.

El cobro siempre es en pesos y la cotización se resuelve en el servidor
(`lib/dolar.ts`), nunca con la que manda el navegador. Si dolarapi no responde,
un carrito enteramente en pesos igual puede comprar; con un producto en dólares
adentro, el checkout devuelve 503.

### SEO

El dominio oficial es **mansoclub.com.ar** (`SITE_URL` en `lib/constants.ts`).
`manso.club` aparecía en el código pero nunca fue de Manso: da 404.

- Canonical: el root layout pone `canonical: './'` con `metadataBase`, así que
  cada ruta se canoniza sola. No poner una URL fija ahí.
- Open Graph: usar `og({ title, description })` de `lib/seo.ts`. Next
  **reemplaza** el `openGraph` del layout en vez de mezclarlo, y sin el helper
  la página pierde imagen, siteName y url al compartirse.
- Descripciones que vienen de la DB pasan por `descripcion()` (limpia saltos de
  línea y corta en ~160).
- Datos estructurados con `<JsonLd>` (escapa `<`): LocalBusiness en el layout,
  Person en artistas, Service en planes, Product en productos, y Event en
  `/agenda/[slug]` solo si tiene fecha, no terminó y dura ≤ 180 días.
- `/llms.txt` (resumen para asistentes de IA) y el sitemap salen de la DB y
  solo incluyen lo público.

### Image Uploads

Images are stored in Supabase Storage. `ImageUploader` and `CompactImageUploader` components handle upload; products support an array of image URLs.

### Environment Variables

Required vars are documented in `ENVIRONMENT_VARIABLES.md`. Key ones: Supabase URL/keys, Mercado Pago credentials + webhook secret (HMAC-SHA256 verified), Resend API key for email notifications.
