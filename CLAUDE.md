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

### Styling

Tailwind CSS v4 via PostCSS. Custom color palette — always use these tokens:
- `manso-black` (#1D1D1B), `manso-blue` (#030044), `manso-terra` (#BC2915)
- `manso-olive` (#868229), `manso-cream` (#FFFCDC), `manso-brown` (#542C1B)

Font: Helvetica Neue Pro (defined in global CSS).

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

### Image Uploads

Images are stored in Supabase Storage. `ImageUploader` and `CompactImageUploader` components handle upload; products support an array of image URLs.

### Environment Variables

Required vars are documented in `ENVIRONMENT_VARIABLES.md`. Key ones: Supabase URL/keys, Mercado Pago credentials + webhook secret (HMAC-SHA256 verified), Resend API key for email notifications.
