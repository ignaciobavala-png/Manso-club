create table if not exists newsletter_suscriptores (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_suscriptores enable row level security;

-- Solo admins pueden leer
create policy "Admins can read newsletter" on newsletter_suscriptores
  for select using (
    exists (
      select 1 from user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Cualquiera puede insertar (suscripción pública)
create policy "Anyone can subscribe" on newsletter_suscriptores
  for insert with check (true);
