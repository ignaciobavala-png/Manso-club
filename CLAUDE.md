# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server with Turbopack
pnpm build        # Production build
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

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

### Image Uploads

Images are stored in Supabase Storage. `ImageUploader` and `CompactImageUploader` components handle upload; products support an array of image URLs.

### Environment Variables

Required vars are documented in `ENVIRONMENT_VARIABLES.md`. Key ones: Supabase URL/keys, Mercado Pago credentials + webhook secret (HMAC-SHA256 verified), Resend API key for email notifications.
