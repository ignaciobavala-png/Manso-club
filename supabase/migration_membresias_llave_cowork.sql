-- ============================================================
-- Cowork: que planes dan llave del espacio
--
-- Todos los planes tienen categoria = 'Cowork' (es el default de la
-- columna), asi que la categoria no sirve para distinguir: Cultural
-- Manso y OPEN COWORK tambien la tienen y no dan acceso al espacio.
--
-- Por eso una marca explicita. Arranca en false para todos y se
-- prende plan por plano: un plan nuevo no reparte llaves por olvido.
-- ============================================================

alter table membresias
  add column if not exists otorga_llave boolean not null default false;

comment on column membresias.otorga_llave is
  'Si al activarse esta membresia se emite una llave del cowork en Manso Gestion.';

-- Los tres que hoy dan acceso al espacio.
update membresias set otorga_llave = true
where nombre in ('FULL', 'LITE', 'Flex 1D');
