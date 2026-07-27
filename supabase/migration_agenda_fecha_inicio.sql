-- Fecha de inicio explícita para talleres/actividades de agenda.
-- Hasta ahora el calendario unificado (/calendario) anclaba la recurrencia a created_at
-- (fecha de alta del registro en la DB), no a cuándo arranca realmente el ciclo,
-- generando ocurrencias imprecisas cuando un taller se carga con anticipación.
alter table public.agenda add column if not exists fecha_inicio date;
