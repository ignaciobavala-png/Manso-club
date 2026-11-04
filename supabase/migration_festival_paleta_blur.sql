-- Paleta de BLUR (PDF "BLUR - paleta", 04/11/2026).
-- Antes: fondo #1C1410, texto #FFFCDC, acento #E2532B, resalte #B9B23E.
-- Los colores se siguen editando desde el panel (Festival); esto solo fija los
-- valores por defecto y carga la fila actual. Ya aplicado en producción.

ALTER TABLE festival_config ALTER COLUMN color_fondo   SET DEFAULT '#003009';
ALTER TABLE festival_config ALTER COLUMN color_texto   SET DEFAULT '#FFFCDC';
ALTER TABLE festival_config ALTER COLUMN color_acento  SET DEFAULT '#F65200';
ALTER TABLE festival_config ALTER COLUMN color_resalte SET DEFAULT '#FFA7FE';

UPDATE festival_config
SET color_fondo = '#003009', color_texto = '#FFFCDC',
    color_acento = '#F65200', color_resalte = '#FFA7FE'
WHERE id = 1;
