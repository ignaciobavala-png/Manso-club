-- La tienda publicaba todo en USD y convertía a pesos con el blue. Ahora cada
-- producto guarda en qué moneda se cargó su precio: lo que se escribe en el
-- panel es el precio de referencia y la otra moneda es la que se calcula.
--
-- Los productos viejos quedan en USD, que es como estaban cargados.
alter table public.productos
  add column if not exists moneda text not null default 'USD';

alter table public.productos
  drop constraint if exists productos_moneda_check;

alter table public.productos
  add constraint productos_moneda_check check (moneda in ('USD', 'ARS'));
