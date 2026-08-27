-- Vynil — la playlist general de Manso.
--
-- No es la lista de cada visitante: es una sola, común, que se va acumulando
-- con lo que deja la gente. Por eso vive en la base y no en localStorage ni en
-- la URL: lo que uno pone lo escucha el que entra después.
--
-- Reemplaza a `vynil_mixes` (un mix por persona), que queda sin uso.

create table if not exists public.vynil_temas (
  id         uuid primary key default gen_random_uuid(),
  fuente     text not null check (fuente in ('youtube', 'soundcloud')),
  -- Id de YouTube (11 chars) o path de SoundCloud ("artista/track").
  ref        text not null,
  titulo     text,
  autor      text,
  thumb      text,
  -- Solo si la persona estaba logueada; poner un tema no pide cuenta.
  user_id    uuid references auth.users(id) on delete set null,
  puesto_por text,
  -- Ana oculta desde el panel en vez de borrar: el tema deja de sonar pero
  -- queda el registro de que alguien lo puso.
  visible    boolean not null default true,
  created_at timestamptz not null default now(),
  -- El mismo tema no entra dos veces, lo pegue quien lo pegue.
  unique (fuente, ref)
);

create index if not exists vynil_temas_created_idx on public.vynil_temas (created_at desc);

alter table public.vynil_temas enable row level security;

-- Leer es público: la playlist suena para cualquiera que entre.
drop policy if exists "Cualquiera escucha la playlist" on public.vynil_temas;
create policy "Cualquiera escucha la playlist" on public.vynil_temas
  for select using (visible);

drop policy if exists "Admins ven todo" on public.vynil_temas;
create policy "Admins ven todo" on public.vynil_temas
  for select using (public.is_admin());

-- Poner un tema tampoco pide cuenta. Lo único que se valida es la forma del
-- ref: la moderación es a posteriori, ocultando.
drop policy if exists "Cualquiera pone un tema" on public.vynil_temas;
create policy "Cualquiera pone un tema" on public.vynil_temas
  for insert with check (
    visible
    and char_length(ref) between 3 and 200
    and char_length(coalesce(titulo, '')) <= 300
    and char_length(coalesce(puesto_por, '')) <= 80
  );

drop policy if exists "Admins editan temas" on public.vynil_temas;
create policy "Admins editan temas" on public.vynil_temas
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins borran temas" on public.vynil_temas;
create policy "Admins borran temas" on public.vynil_temas
  for delete using (public.is_admin());

-- Migración de lo poco que había en `vynil_mixes`: los temas sueltos de esos
-- mixes pasan a ser las primeras filas de la playlist general.
do $$
begin
  if to_regclass('public.vynil_mixes') is not null then
    insert into public.vynil_temas (fuente, ref, titulo, autor, thumb, user_id, created_at)
    select distinct on (t->>'fuente', t->>'ref')
           t->>'fuente', t->>'ref', t->>'titulo', t->>'autor', t->>'thumb',
           m.user_id, m.created_at
      from public.vynil_mixes m, jsonb_array_elements(m.temas) t
     where t->>'fuente' in ('youtube', 'soundcloud')
     order by t->>'fuente', t->>'ref', m.created_at
    on conflict (fuente, ref) do nothing;

    drop table public.vynil_mixes;
  end if;
end $$;
