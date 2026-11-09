-- Plan interno del festival BLUR (foto de la planilla "Control Room" al 08/11/2026).
-- Lo lee el asistente de IA con la herramienta plan_festival. Solo admins.
-- Los datos se cargaron una vez desde el HTML de la planilla; no hay panel para editarlos.

create table if not exists public.festival_plan_tareas (
  id text primary key, area text not null, frente text, tarea text not null, subtarea_de text,
  responsable text, estado text, prioridad text, next_step text, entregable text,
  inicio date, deadline date, notas text, origen text, updated_at timestamptz not null default now()
);
create index if not exists festival_plan_tareas_area_idx on public.festival_plan_tareas (area, estado);

create table if not exists public.festival_plan_hitos (
  fecha date not null, hito text not null, tipo text, tareas text, primary key (fecha, hito)
);

alter table public.festival_plan_tareas enable row level security;
alter table public.festival_plan_hitos enable row level security;

drop policy if exists "Admins gestionan plan festival" on public.festival_plan_tareas;
create policy "Admins gestionan plan festival" on public.festival_plan_tareas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "Admins gestionan hitos festival" on public.festival_plan_hitos;
create policy "Admins gestionan hitos festival" on public.festival_plan_hitos
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
