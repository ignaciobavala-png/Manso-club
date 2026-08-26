-- Listas de Vynil publicadas por los visitantes.
--
-- La reproducción no necesita esta tabla: el mix propio vive en localStorage y
-- el compartido viaja en la URL. Esto existe solo para que Ana pueda escuchar
-- lo que deja la gente. Se guarda al compartir, que es el momento en que la
-- persona decide publicarla — no se recolecta en silencio mientras arma.

create table if not exists public.vynil_mixes (
  id         uuid primary key default gen_random_uuid(),
  -- [{ fuente: 'youtube'|'soundcloud', ref, titulo, autor }]
  temas      jsonb not null,
  -- Solo si la persona estaba logueada; el formulario no lo pide.
  user_id    uuid references auth.users(id) on delete set null,
  autor      text,
  created_at timestamptz not null default now()
);

create index if not exists vynil_mixes_created_idx on public.vynil_mixes (created_at desc);

alter table public.vynil_mixes enable row level security;

drop policy if exists "Cualquiera puede publicar un mix" on public.vynil_mixes;
create policy "Cualquiera puede publicar un mix" on public.vynil_mixes
  for insert with check (jsonb_array_length(temas) between 1 and 5);

drop policy if exists "Admins leen los mixes" on public.vynil_mixes;
create policy "Admins leen los mixes" on public.vynil_mixes
  for select using (public.is_admin());

drop policy if exists "Admins borran mixes" on public.vynil_mixes;
create policy "Admins borran mixes" on public.vynil_mixes
  for delete using (public.is_admin());
