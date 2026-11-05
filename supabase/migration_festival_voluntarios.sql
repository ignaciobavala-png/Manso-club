-- Voluntarios de BLUR (/blur/voluntarios): el formulario público y su panel.
--
-- El brief proponía una Google Sheet como "panel"; acá las postulaciones caen
-- directo en el dashboard de Festival (misma base, mismo login de admin).
--
-- Escribe solo el servidor (/api/festival/voluntarios, con service role): las
-- tablas no tienen insert público, así que nadie puede cargar filas desde el
-- navegador saltándose la validación ni el anti-spam. Leer es solo admin: hay
-- mail, teléfono y fecha de nacimiento de gente real.

-- ── Parámetros de la convocatoria (una sola fila, se editan desde el panel) ──
CREATE TABLE IF NOT EXISTS festival_voluntarios_config (
  id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  -- Interruptor general. Apagada (o pasada la fecha de cierre) el formulario se
  -- reemplaza por "Convocatoria cerrada" con un solo campo de mail.
  abierta boolean NOT NULL DEFAULT true,
  cierre timestamptz,
  edad_minima smallint NOT NULL DEFAULT 18 CHECK (edad_minima BETWEEN 0 AND 99),
  -- Datos que el brief dejó "A DEFINIR": vacíos, la línea no se muestra en la
  -- página (así no sale con huecos tipo "Turnos de [X] horas").
  turnos text,
  montaje text,
  desmontaje text,
  traslado text,
  induccion text,
  -- Opciones del campo "Disponibilidad" del formulario. Las fechas exactas las
  -- define producción; se guarda el texto tal cual en cada postulación.
  disponibilidad text[] NOT NULL DEFAULT ARRAY[
    'Montaje (días previos)',
    'Sábado 12/12 tarde',
    'Sábado 12/12 noche',
    'Desmontaje domingo 13/12'
  ],
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO festival_voluntarios_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE festival_voluntarios_config ENABLE ROW LEVEL SECURITY;

-- La página la lee con el cliente con cookies, igual que festival_config: sin
-- publicar, solo la ve un admin. No tiene nada sensible.
DROP POLICY IF EXISTS festival_voluntarios_config_read ON festival_voluntarios_config;
CREATE POLICY festival_voluntarios_config_read
  ON festival_voluntarios_config FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM festival_config WHERE publicado) OR public.is_admin());
DROP POLICY IF EXISTS festival_voluntarios_config_admin_write ON festival_voluntarios_config;
CREATE POLICY festival_voluntarios_config_admin_write
  ON festival_voluntarios_config FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Postulaciones ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS festival_voluntarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Lo que completa la persona (los 14 campos del brief).
  nombre text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  fecha_nacimiento date NOT NULL,
  instagram text,
  ciudad text NOT NULL,
  areas text[] NOT NULL,
  disponibilidad text[] NOT NULL,
  experiencia boolean NOT NULL,
  experiencia_detalle text,
  idiomas text[] NOT NULL DEFAULT '{}',
  idiomas_otro text,
  motivo text NOT NULL,
  con_quien text,
  como_te_enteraste text NOT NULL,
  acepta_datos boolean NOT NULL,
  novedades boolean NOT NULL DEFAULT false,

  -- Ocultos: de dónde llegó y en qué idioma vio la página.
  utm_source text,
  utm_medium text,
  utm_campaign text,
  idioma_pagina text,

  -- Mismo mail ya cargado antes: se acepta igual y se marca (la persona no ve error).
  duplicado boolean NOT NULL DEFAULT false,

  -- Lo que completa el equipo desde el panel.
  estado text NOT NULL DEFAULT 'nuevo'
    CHECK (estado IN ('nuevo', 'contactado', 'confirmado', 'en_espera', 'descartado')),
  area_asignada text,
  turno_asignado text,
  notas text,

  -- Cuándo salió el mail de confirmación a la persona; null = no salió (Resend
  -- sin clave, tope diario del plan free, etc.).
  mail_confirmacion_at timestamptz
);

CREATE INDEX IF NOT EXISTS festival_voluntarios_created_idx ON festival_voluntarios (created_at DESC);
CREATE INDEX IF NOT EXISTS festival_voluntarios_email_idx ON festival_voluntarios (lower(email));

ALTER TABLE festival_voluntarios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS festival_voluntarios_admin ON festival_voluntarios;
CREATE POLICY festival_voluntarios_admin
  ON festival_voluntarios FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ── Avisos para la próxima edición (convocatoria cerrada) ─────────────────
CREATE TABLE IF NOT EXISTS festival_voluntarios_aviso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Un mail una sola vez, sin importar mayúsculas.
CREATE UNIQUE INDEX IF NOT EXISTS festival_voluntarios_aviso_email_idx
  ON festival_voluntarios_aviso (lower(email));

ALTER TABLE festival_voluntarios_aviso ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS festival_voluntarios_aviso_admin ON festival_voluntarios_aviso;
CREATE POLICY festival_voluntarios_aviso_admin
  ON festival_voluntarios_aviso FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());
