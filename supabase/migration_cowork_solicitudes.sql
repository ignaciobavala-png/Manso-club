-- ============================================================================
-- Cowork: fechas de Open Cowork + solicitudes de inscripción
--
-- El formulario de inscripción es público (lo completa gente sin cuenta), así
-- que la inserción es abierta y la lectura queda reservada a admins: los datos
-- de contacto no pueden quedar expuestos al cliente anónimo.
-- ============================================================================

-- ── Fechas de Open Cowork ────────────────────────────────────────────────────
create table if not exists public.cowork_fechas (
  id             uuid primary key default gen_random_uuid(),
  fecha          date not null,
  horario        time,
  cupos_maximos  int not null default 20 check (cupos_maximos > 0),
  activo         boolean not null default true,
  created_at     timestamptz not null default now()
);

create index if not exists cowork_fechas_fecha_idx on public.cowork_fechas (fecha);

alter table public.cowork_fechas enable row level security;

drop policy if exists "Fechas activas son públicas" on public.cowork_fechas;
create policy "Fechas activas son públicas" on public.cowork_fechas
  for select using (activo);

drop policy if exists "Admins gestionan fechas" on public.cowork_fechas;
create policy "Admins gestionan fechas" on public.cowork_fechas
  for all using (public.is_admin()) with check (public.is_admin());

-- ── Solicitudes ──────────────────────────────────────────────────────────────
create table if not exists public.cowork_solicitudes (
  id                uuid primary key default gen_random_uuid(),
  -- De dónde vino: el botón SELECCIONAR de un plan, o el botón Open Cowork.
  origen            text not null default 'membresia'
                    check (origen in ('membresia', 'open_cowork')),
  membresia_nombre  text,   -- plan elegido, cuando origen = 'membresia'
  fecha_id          uuid references public.cowork_fechas(id) on delete set null,

  nombre            text not null,
  email             text not null,
  whatsapp          text not null,
  dedicacion        text not null,   -- ¿A qué te dedicás?
  proyecto          text,            -- Proyecto / empresa
  busca             text,            -- ¿Qué buscás en un espacio de cowork?

  estado            text not null default 'pendiente'
                    check (estado in ('pendiente', 'aprobado', 'rechazado')),
  notas_admin       text,
  user_id           uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now()
);

create index if not exists cowork_solicitudes_estado_idx  on public.cowork_solicitudes (estado, created_at desc);
create index if not exists cowork_solicitudes_fecha_idx   on public.cowork_solicitudes (fecha_id);

alter table public.cowork_solicitudes enable row level security;

-- Cualquiera puede enviar el formulario, incluso sin cuenta.
drop policy if exists "Cualquiera puede solicitar" on public.cowork_solicitudes;
create policy "Cualquiera puede solicitar" on public.cowork_solicitudes
  for insert with check (true);

-- Solo admins leen y gestionan: acá hay mail y teléfono de gente real.
drop policy if exists "Admins leen solicitudes" on public.cowork_solicitudes;
create policy "Admins leen solicitudes" on public.cowork_solicitudes
  for select using (public.is_admin());

drop policy if exists "Admins gestionan solicitudes" on public.cowork_solicitudes;
create policy "Admins gestionan solicitudes" on public.cowork_solicitudes
  for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins borran solicitudes" on public.cowork_solicitudes;
create policy "Admins borran solicitudes" on public.cowork_solicitudes
  for delete using (public.is_admin());

-- ── Cupos disponibles ────────────────────────────────────────────────────────
-- El formulario público necesita saber cuántos lugares quedan, pero no puede
-- leer la tabla de solicitudes. Esta función expone solo el conteo.
-- Una solicitud rechazada libera el lugar; pendiente y aprobada lo ocupan.
create or replace function public.cowork_cupos()
returns table (fecha_id uuid, ocupados bigint, cupos_maximos int)
language sql
security definer
set search_path = public
stable
as $$
  select f.id,
         count(s.id) filter (where s.estado in ('pendiente', 'aprobado')),
         f.cupos_maximos
  from public.cowork_fechas f
  left join public.cowork_solicitudes s on s.fecha_id = f.id
  where f.activo
  group by f.id, f.cupos_maximos;
$$;

grant execute on function public.cowork_cupos() to anon, authenticated;

-- ── Agenda: días múltiples (Lunes a Jueves / Lunes a Viernes) ────────────────
-- dia_semana es un smallint 0-6 y no puede representar un rango. Agregamos un
-- array; el calendario genera una ocurrencia por cada día que contenga.
-- dia_semana se mantiene con el primer día del rango para no romper lo viejo.
alter table public.agenda add column if not exists dias_semana smallint[];

comment on column public.agenda.dias_semana is
  'Días de cursada (0 = lunes ... 6 = domingo). Un rango como "Lunes a Viernes" se guarda como {0,1,2,3,4}. Si está vacío, manda dia_semana.';

-- ── Plan solicitado por id ───────────────────────────────────────────────────
-- La card mandaba solo el nombre del plan como texto. Guardamos también el id:
-- el nombre queda como foto del momento (si el plan se renombra, la solicitud
-- vieja sigue diciendo cómo se llamaba), y el id permite agrupar de verdad.
alter table public.cowork_solicitudes
  add column if not exists membresia_id uuid references public.membresias(id) on delete set null;

create index if not exists cowork_solicitudes_membresia_idx
  on public.cowork_solicitudes (membresia_id);

comment on column public.cowork_solicitudes.membresia_nombre is
  'Nombre del plan al momento de la solicitud. Snapshot: no sigue los renombres del plan.';
