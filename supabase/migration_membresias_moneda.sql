-- Las membresías se cargaban siempre en dólares, así que para publicar un
-- número exacto en pesos había que hacer la cuenta al revés. Ahora cada plan
-- guarda en qué moneda se cargó: ese número queda fijo y la otra moneda se
-- calcula con el blue (mismo criterio que productos.moneda).
--
-- Los planes que ya existen quedan en USD, que es como estaban cargados; el
-- panel arranca en pesos para los nuevos.
alter table public.membresias
  add column if not exists moneda text not null default 'USD';

alter table public.membresias
  drop constraint if exists membresias_moneda_check;

alter table public.membresias
  add constraint membresias_moneda_check check (moneda in ('USD', 'ARS'));
