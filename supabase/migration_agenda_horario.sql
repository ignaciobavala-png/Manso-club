-- Agrega horario (hora de inicio) a los talleres/actividades de agenda,
-- para mostrarlo en el calendario unificado (/calendario).
alter table public.agenda add column if not exists horario time;
