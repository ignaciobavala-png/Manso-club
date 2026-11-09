-- Charlas del asistente de IA del panel: cada admin conserva las suyas.
-- `mensajes` guarda la charla tal como se ve en pantalla (texto, propuestas y
-- el estado de cada tarjeta: pendiente / enviado / descartado).

create table if not exists public.ia_conversaciones (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  titulo     text not null default 'Charla nueva',
  mensajes   jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ia_conversaciones_user_idx on public.ia_conversaciones (user_id, updated_at desc);

alter table public.ia_conversaciones enable row level security;

drop policy if exists "Admin ve sus charlas ia" on public.ia_conversaciones;
create policy "Admin ve sus charlas ia" on public.ia_conversaciones
  for select to authenticated using (public.is_admin() and user_id = auth.uid());

drop policy if exists "Admin crea sus charlas ia" on public.ia_conversaciones;
create policy "Admin crea sus charlas ia" on public.ia_conversaciones
  for insert to authenticated with check (public.is_admin() and user_id = auth.uid());

drop policy if exists "Admin edita sus charlas ia" on public.ia_conversaciones;
create policy "Admin edita sus charlas ia" on public.ia_conversaciones
  for update to authenticated using (public.is_admin() and user_id = auth.uid())
  with check (public.is_admin() and user_id = auth.uid());

drop policy if exists "Admin borra sus charlas ia" on public.ia_conversaciones;
create policy "Admin borra sus charlas ia" on public.ia_conversaciones
  for delete to authenticated using (public.is_admin() and user_id = auth.uid());
