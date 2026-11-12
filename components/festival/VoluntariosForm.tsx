'use client';

import { useEffect, useRef, useState } from 'react';
import { useIdioma } from '@/components/festival/Idioma';
import {
  AREAS,
  COMO_TE_ENTERASTE,
  IDIOMAS,
  ORDEN_CAMPOS,
  POSTULACION_VACIA,
  validarPostulacion,
  type CampoPostulacion,
  type Errores,
  type Postulacion,
} from '@/lib/festival-voluntarios';
import { TEXTOS_VOLUNTARIOS, llenar } from '@/lib/festival-voluntarios-textos';

/**
 * Formulario de /blurfestival/voluntarios: un solo paso, los 14 campos del brief.
 * Valida en el navegador con la misma función que la API (`validarPostulacion`).
 *
 * Sin librerías de formularios: `<label>` en cada campo, errores en texto
 * debajo (no solo color) y, al enviar con errores, el foco va al primero. Si
 * falla el envío no se borra nada. Los colores salen de `--fest-*`, así se
 * adapta a la franja en la que se ponga.
 */

interface Props {
  edadMinima: number;
  disponibilidad: string[];
  /** Mail de contacto para el mensaje de error de envío. */
  contacto: string;
  /** Usuario de Instagram (sin @) para la pantalla de éxito. */
  instagram: string;
}

const CAMPO =
  'w-full bg-transparent border border-[var(--fest-texto)]/40 focus:border-[var(--fest-texto)] focus:outline-none px-3 py-3 text-[16px] rounded-none placeholder:text-[var(--fest-texto)]/35 aria-[invalid=true]:border-[var(--fest-acento)] aria-[invalid=true]:border-2';
const ETIQUETA = 'block fest-mono text-[11px] uppercase tracking-[0.2em] mb-2';
const ERROR = 'mt-1.5 text-[13px] font-bold text-[var(--fest-acento)]';
const AYUDA = 'mt-1.5 text-[13px] opacity-70';

export function VoluntariosForm({ edadMinima, disponibilidad, contacto, instagram }: Props) {
  const idioma = useIdioma();
  const t = TEXTOS_VOLUNTARIOS[idioma].form;
  const exito = TEXTOS_VOLUNTARIOS[idioma].exito;

  const [p, setP] = useState<Postulacion>(POSTULACION_VACIA);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);
  const [fallo, setFallo] = useState(false);
  const [enviado, setEnviado] = useState<{ nombre: string; email: string } | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [cargadoEn] = useState(() => Date.now());
  const refs = useRef<Partial<Record<CampoPostulacion, HTMLElement | null>>>({});
  const raiz = useRef<HTMLDivElement>(null);

  const poner = <K extends CampoPostulacion>(campo: K, valor: Postulacion[K]) => {
    setP(prev => ({ ...prev, [campo]: valor }));
    // El error de un campo se va cuando se toca, no recién al reenviar.
    setErrores(prev => {
      if (!prev[campo]) return prev;
      const resto = { ...prev };
      delete resto[campo];
      return resto;
    });
  };

  const alternar = (campo: 'areas' | 'disponibilidad' | 'idiomas', valor: string) =>
    poner(campo, p[campo].includes(valor) ? p[campo].filter(v => v !== valor) : [...p[campo], valor]);

  const mensaje = (campo: CampoPostulacion) => {
    const c = errores[campo];
    return c ? llenar(t.errores[c], { edad: edadMinima }) : null;
  };

  const id = (campo: string) => `vol-${campo}`;
  const err = (campo: CampoPostulacion) => (errores[campo] ? `${id(campo)}-err` : undefined);

  // Atributos comunes de un campo de texto: label asociado, error y estado inválido.
  const props = (campo: CampoPostulacion) =>
    ({
      id: id(campo),
      'aria-invalid': errores[campo] ? true : undefined,
      'aria-describedby': err(campo),
      ref: (el: HTMLElement | null) => {
        refs.current[campo] = el;
      },
    }) as const;

  const textoError = (campo: CampoPostulacion) =>
    mensaje(campo) && (
      <p id={err(campo)} className={ERROR} role="alert">
        {mensaje(campo)}
      </p>
    );

  // Al "empezar" no hay evento propio: la medición de la página ya cuenta clicks y tiempo.
  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setFallo(false);

    const encontrados = validarPostulacion(p, { edad_minima: edadMinima, disponibilidad });
    if (Object.keys(encontrados).length > 0) {
      setErrores(encontrados);
      const primero = ORDEN_CAMPOS.find(c => encontrados[c]);
      // Esperar al render: recién ahí aparece el mensaje y el campo ya marca aria-invalid.
      requestAnimationFrame(() => {
        const el = primero && refs.current[primero];
        el?.focus();
        el?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      });
      return;
    }

    setEnviando(true);
    try {
      const q = new URLSearchParams(window.location.search);
      const res = await fetch('/api/festival/voluntarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...p,
          idioma,
          ms: Date.now() - cargadoEn,
          sitio_web: (raiz.current?.querySelector('[name=sitio_web]') as HTMLInputElement | null)?.value ?? '',
          utm_source: q.get('utm_source') ?? '',
          utm_medium: q.get('utm_medium') ?? '',
          utm_campaign: q.get('utm_campaign') ?? '',
        }),
      });
      if (res.status === 400) {
        // Algo que el navegador dejó pasar y el servidor no: se muestra donde corresponde.
        const j = await res.json().catch(() => null);
        if (j?.errores) {
          setErrores(j.errores);
          return;
        }
      }
      if (!res.ok) throw new Error(String(res.status));
      setEnviado({ nombre: p.nombre.trim().split(/\s+/)[0], email: p.email.trim() });
    } catch {
      setFallo(true);
    } finally {
      setEnviando(false);
    }
  };

  // Lleva al principio del bloque cuando se reemplaza el formulario por el éxito.
  useEffect(() => {
    if (enviado) raiz.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [enviado]);

  if (enviado) {
    const url = `${window.location.origin}${window.location.pathname}`;
    return (
      <div ref={raiz} role="status" className="space-y-5 py-4">
        <h3 className="fest-angosta text-[clamp(30px,5vw,52px)] leading-none">
          {llenar(exito.titulo, { nombre: enviado.nombre })}
        </h3>
        <p className="text-[17px] leading-[1.5]">
          {llenar(exito.texto, { email: enviado.email, instagram })}
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(url);
                setCopiado(true);
                setTimeout(() => setCopiado(false), 2500);
              } catch {
                /* sin portapapeles: queda el botón de WhatsApp */
              }
            }}
            className="fest-menu text-[17px] border border-[var(--fest-texto)] px-4 py-2 hover:bg-[var(--fest-texto)] hover:text-[var(--fest-fondo)] transition-colors"
          >
            {copiado ? exito.copiado : exito.compartir}
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(llenar(exito.whatsapp, { url }))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="fest-menu text-[17px] border border-[var(--fest-texto)] px-4 py-2 hover:bg-[var(--fest-texto)] hover:text-[var(--fest-fondo)] transition-colors"
          >
            WhatsApp
          </a>
        </div>
      </div>
    );
  }

  const motivo = p.motivo.trim().length;
  const detalle = p.experiencia_detalle.trim().length;
  const mail = contacto || 'comercial@mansoclub.com.ar';

  return (
    <div ref={raiz}>
      <form onSubmit={enviar} noValidate className="space-y-9">
        {/* Señuelo anti-bot: una persona no lo ve ni lo alcanza con el teclado. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Sitio web
            <input type="text" name="sitio_web" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {/* ── Datos personales ── */}
        <fieldset className="space-y-5">
          <legend className="fest-rotulo mb-5">{t.grupos.personales}</legend>

          <div>
            <label htmlFor={id('nombre')} className={ETIQUETA}>{t.campos.nombre} *</label>
            <input {...props('nombre')} type="text" autoComplete="name" required maxLength={120}
              value={p.nombre} onChange={e => poner('nombre', e.target.value)} className={CAMPO} />
            {textoError('nombre')}
          </div>

          <div>
            <label htmlFor={id('email')} className={ETIQUETA}>{t.campos.email} *</label>
            <input {...props('email')} type="email" autoComplete="email" inputMode="email" required
              value={p.email} onChange={e => poner('email', e.target.value)} className={CAMPO} />
            {textoError('email')}
          </div>

          <div>
            <label htmlFor={id('whatsapp')} className={ETIQUETA}>{t.campos.whatsapp} *</label>
            <input {...props('whatsapp')} type="tel" autoComplete="tel" inputMode="tel" required
              value={p.whatsapp} onChange={e => poner('whatsapp', e.target.value)} className={CAMPO} />
            <p className={AYUDA}>{t.campos.whatsappAyuda}</p>
            {textoError('whatsapp')}
          </div>

          <div>
            <label htmlFor={id('fecha_nacimiento')} className={ETIQUETA}>{t.campos.fecha_nacimiento} *</label>
            <input {...props('fecha_nacimiento')} type="date" autoComplete="bday" required
              min="1900-01-01" max="2026-12-31"
              value={p.fecha_nacimiento} onChange={e => poner('fecha_nacimiento', e.target.value)}
              className={`${CAMPO} block min-w-0 max-w-full appearance-none`} />
            {textoError('fecha_nacimiento')}
          </div>

        </fieldset>

        {/* ── Participación ── */}
        <fieldset className="space-y-6">
          <legend className="fest-rotulo mb-5">{t.grupos.participacion}</legend>

          <Grupo
            etiqueta={`${t.campos.areas} *`}
            opciones={AREAS.map(a => ({ valor: a, texto: etiquetaArea(idioma, a) }))}
            marcadas={p.areas}
            alternar={v => alternar('areas', v)}
            campo="areas"
            error={mensaje('areas')}
            refs={refs}
            idBase={id('areas')}
          />

          <Grupo
            etiqueta={`${t.campos.disponibilidad} *`}
            opciones={disponibilidad.map(d => ({ valor: d, texto: d }))}
            marcadas={p.disponibilidad}
            alternar={v => alternar('disponibilidad', v)}
            campo="disponibilidad"
            error={mensaje('disponibilidad')}
            refs={refs}
            idBase={id('disponibilidad')}
          />

          <div>
            <fieldset aria-describedby={err('experiencia')}>
              <legend className={ETIQUETA}>{t.campos.experiencia} *</legend>
              <div className="flex gap-6">
                {(['si', 'no'] as const).map((v, i) => (
                  <label key={v} className="flex items-center gap-2 text-[16px] cursor-pointer">
                    <input
                      type="radio"
                      name="experiencia"
                      value={v}
                      checked={p.experiencia === v}
                      onChange={() => poner('experiencia', v)}
                      ref={i === 0 ? el => { refs.current.experiencia = el; } : undefined}
                      aria-invalid={errores.experiencia ? true : undefined}
                      className="w-5 h-5 accent-[var(--fest-acento)]"
                    />
                    {v === 'si' ? t.campos.si : t.campos.no}
                  </label>
                ))}
              </div>
            </fieldset>
            {textoError('experiencia')}
            {p.experiencia === 'si' && (
              <div className="mt-4">
                <label htmlFor={id('experiencia_detalle')} className={ETIQUETA}>{t.campos.experiencia_detalle}</label>
                <textarea {...props('experiencia_detalle')} rows={3}
                  value={p.experiencia_detalle} onChange={e => poner('experiencia_detalle', e.target.value)}
                  className={CAMPO} />
                <p className={AYUDA}>{llenar(t.campos.caracteres, { n: detalle, max: 500 })}</p>
                {textoError('experiencia_detalle')}
              </div>
            )}
          </div>

          <Grupo
            etiqueta={t.campos.idiomas}
            opciones={IDIOMAS.map(i => ({ valor: i, texto: etiquetaIdioma(idioma, i) }))}
            marcadas={p.idiomas}
            alternar={v => alternar('idiomas', v)}
            campo="idiomas"
            error={null}
            refs={refs}
            idBase={id('idiomas')}
          />
          {p.idiomas.includes('Otro') && (
            <div>
              <label htmlFor={id('idiomas_otro')} className={ETIQUETA}>{t.campos.idiomas_otro}</label>
              <input {...props('idiomas_otro')} type="text" maxLength={80}
                value={p.idiomas_otro} onChange={e => poner('idiomas_otro', e.target.value)} className={CAMPO} />
            </div>
          )}
        </fieldset>

        {/* ── Sobre vos ── */}
        <fieldset className="space-y-5">
          <legend className="fest-rotulo mb-5">{t.grupos.sobreVos}</legend>

          <div>
            <label htmlFor={id('motivo')} className={ETIQUETA}>{t.campos.motivo} *</label>
            <textarea {...props('motivo')} rows={5} required
              value={p.motivo} onChange={e => poner('motivo', e.target.value)} className={CAMPO} />
            <p className={`${AYUDA} ${motivo > 600 ? 'text-[var(--fest-acento)] font-bold opacity-100' : ''}`}>
              {llenar(t.campos.caracteres, { n: motivo, max: 600 })}
            </p>
            {textoError('motivo')}
          </div>

          <div>
            <label htmlFor={id('con_quien')} className={ETIQUETA}>{t.campos.con_quien}</label>
            <input {...props('con_quien')} type="text" maxLength={300}
              value={p.con_quien} onChange={e => poner('con_quien', e.target.value)} className={CAMPO} />
            <p className={AYUDA}>{t.campos.con_quien_ayuda}</p>
          </div>

          <div>
            <label htmlFor={id('como_te_enteraste')} className={ETIQUETA}>{t.campos.como_te_enteraste} *</label>
            <select {...props('como_te_enteraste')} required
              value={p.como_te_enteraste} onChange={e => poner('como_te_enteraste', e.target.value)} className={CAMPO}>
              <option value="">{t.campos.elegir}</option>
              {COMO_TE_ENTERASTE.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {textoError('como_te_enteraste')}
          </div>
        </fieldset>

        {/* ── Consentimiento ── */}
        <fieldset className="space-y-4">
          <legend className="fest-rotulo mb-5">{t.grupos.consentimiento}</legend>

          <div>
            <label className="flex items-start gap-3 text-[15px] leading-[1.45] cursor-pointer">
              <input
                type="checkbox"
                checked={p.acepta_datos}
                onChange={e => poner('acepta_datos', e.target.checked)}
                ref={el => { refs.current.acepta_datos = el; }}
                aria-invalid={errores.acepta_datos ? true : undefined}
                aria-describedby={err('acepta_datos')}
                className="mt-0.5 w-5 h-5 shrink-0 accent-[var(--fest-acento)]"
              />
              <span>{t.campos.acepta_datos} *</span>
            </label>
            {textoError('acepta_datos')}
            <details className="mt-3 text-[13px]">
              <summary className="cursor-pointer underline underline-offset-2">{t.campos.privacidad}</summary>
              <p className="mt-2 opacity-80 leading-[1.5]">{llenar(t.campos.privacidadTexto, { mail })}</p>
            </details>
          </div>

          <label className="flex items-start gap-3 text-[15px] leading-[1.45] cursor-pointer">
            <input
              type="checkbox"
              checked={p.novedades}
              onChange={e => poner('novedades', e.target.checked)}
              className="mt-0.5 w-5 h-5 shrink-0 accent-[var(--fest-acento)]"
            />
            <span>{t.campos.novedades}</span>
          </label>
        </fieldset>

        <div aria-live="polite">
          {Object.keys(errores).length > 0 && <p className={ERROR}>{t.errorGeneral}</p>}
          {fallo && <p className={ERROR} role="alert">{llenar(t.errorEnvio, { mail })}</p>}
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="fest-menu w-full sm:w-auto text-[19px] bg-[var(--fest-acento)] text-[var(--fest-fondo)] hover:bg-[var(--fest-texto)] transition-colors px-8 py-3 disabled:opacity-50 disabled:cursor-wait"
        >
          {enviando ? t.enviando : t.enviar}
        </button>
      </form>
    </div>
  );
}

/** Las áreas se guardan siempre en castellano; en inglés se muestra la traducción de la tarjeta. */
function etiquetaArea(idioma: 'es' | 'en', valor: string): string {
  if (idioma === 'es') return valor;
  const mapa: Record<string, string> = {
    'Técnica y producción': 'Technical and production',
    'Barra y gastronomía': 'Bar and food',
    'Donde me necesiten': 'Wherever you need me',
  };
  return mapa[valor] ?? valor;
}

function etiquetaIdioma(idioma: 'es' | 'en', valor: string): string {
  if (idioma === 'es') return valor;
  const mapa: Record<string, string> = {
    Español: 'Spanish',
    Inglés: 'English',
    Portugués: 'Portuguese',
    Francés: 'French',
    Otro: 'Other',
  };
  return mapa[valor] ?? valor;
}

/** Grupo de checkboxes con su leyenda y su error. El foco por error va al primero. */
function Grupo({
  etiqueta,
  opciones,
  marcadas,
  alternar,
  campo,
  error,
  refs,
  idBase,
}: {
  etiqueta: string;
  opciones: { valor: string; texto: string }[];
  marcadas: string[];
  alternar: (valor: string) => void;
  campo: CampoPostulacion;
  error: string | null;
  refs: React.MutableRefObject<Partial<Record<CampoPostulacion, HTMLElement | null>>>;
  idBase: string;
}) {
  return (
    <fieldset aria-describedby={error ? `${idBase}-err` : undefined}>
      <legend className={ETIQUETA}>{etiqueta}</legend>
      <div className="grid gap-2.5">
        {opciones.map((o, i) => (
          <label key={o.valor} className="flex items-start gap-3 text-[16px] leading-[1.35] cursor-pointer">
            <input
              type="checkbox"
              checked={marcadas.includes(o.valor)}
              onChange={() => alternar(o.valor)}
              ref={i === 0 ? el => { refs.current[campo] = el; } : undefined}
              aria-invalid={error ? true : undefined}
              className="mt-0.5 w-5 h-5 shrink-0 accent-[var(--fest-acento)]"
            />
            <span>{o.texto}</span>
          </label>
        ))}
      </div>
      {error && (
        <p id={`${idBase}-err`} className={ERROR} role="alert">
          {error}
        </p>
      )}
    </fieldset>
  );
}
