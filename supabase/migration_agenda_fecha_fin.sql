-- Fecha de finalización de la recurrencia de un taller/actividad de agenda.
-- Sin este dato, el calendario unificado (/calendario) expandía las ocurrencias
-- indefinidamente hacia el futuro, haciendo parecer que el taller se repite para siempre.
alter table public.agenda add column if not exists fecha_fin date;
