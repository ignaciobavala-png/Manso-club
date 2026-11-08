-- Asistente de IA del panel (sección "IA").
--
-- El asistente NO tiene una conexión propia a la base: cada consulta corre con
-- la sesión de la persona admin que lo está usando, así que las políticas RLS
-- existentes siguen mandando (si algo no lo puede leer un admin, tampoco el
-- asistente). Lo único nuevo es esta bitácora: cada vez que el asistente
-- propone o ejecuta algo queda un renglón, para poder auditarlo después.

create table if not exists public.ai_agent_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  evento      text not null check (evento in ('consulta', 'propuesta', 'ejecutado', 'error')),
  herramienta text,
  detalle     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists ai_agent_log_created_idx on public.ai_agent_log (created_at desc);

alter table public.ai_agent_log enable row level security;

-- Solo admins leen la bitácora, y cada admin solo puede escribir renglones a su nombre.
drop policy if exists "Admins leen bitacora ia" on public.ai_agent_log;
create policy "Admins leen bitacora ia" on public.ai_agent_log
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins escriben bitacora ia" on public.ai_agent_log;
create policy "Admins escriben bitacora ia" on public.ai_agent_log
  for insert to authenticated with check (public.is_admin() and user_id = auth.uid());
