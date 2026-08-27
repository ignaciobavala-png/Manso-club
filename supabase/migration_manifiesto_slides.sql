-- Las dos slides que abren el manifiesto, antes del texto.
--
-- Son dos y siempre las mismas, así que van como columnas de la única fila de
-- `manifiesto` y no como una tabla de slides: no hay que ordenarlas, agregar
-- ni borrarlas, y una tabla aparte obligaría a un join para leer una página
-- que hoy se resuelve con un `select *`.
--
--   slide1 = imagen de fondo + una frase encima
--   slide2 = solo imagen

alter table public.manifiesto
  add column if not exists slide1_imagen text,
  add column if not exists slide1_frase  text,
  add column if not exists slide2_imagen text;

comment on column public.manifiesto.slide1_imagen is 'Fondo de la primera slide; la frase va encima.';
comment on column public.manifiesto.slide1_frase  is 'Frase centrada sobre slide1_imagen.';
comment on column public.manifiesto.slide2_imagen is 'Segunda slide: solo la imagen, sin texto.';
