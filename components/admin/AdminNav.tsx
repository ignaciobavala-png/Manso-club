'use client';

import { LogOut, User, ExternalLink, ChevronDown } from 'lucide-react';
import { logoutAction } from '../../app/mansoadm/actions';
import { GRUPOS, grupoDe, type SeccionId } from './adminNav';

interface Props {
  tab: SeccionId;
  onChange: (id: SeccionId) => void;
  userEmail: string | null;
}

/**
 * Barra del panel: ocupa todo el ancho y se queda fija arriba.
 * Fila 1: marca y cuenta. Fila 2: los grupos. Fila 3: las secciones del grupo
 * activo (solo si tiene más de una).
 */
export function AdminNav({ tab, onChange, userEmail }: Props) {
  const grupo = grupoDe(tab);
  const visibles = grupo.secciones.filter(s => !s.escondida);
  const escondidas = grupo.secciones.filter(s => s.escondida);
  const escondidaActiva = escondidas.find(s => s.id === tab);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-manso-cream/10 bg-manso-black/95 backdrop-blur">
      {/* Fila 1 — marca y cuenta */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 sm:px-6 lg:px-10 pt-5 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-manso-cream leading-none">
            Manso Admin_
          </h1>
          <p className="mt-1.5 text-[12px] font-bold uppercase tracking-[0.2em] text-manso-cream/60">
            {grupo.label}
            {grupo.secciones.length > 1 && <> · {grupo.secciones.find(s => s.id === tab)?.label}</>}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {userEmail && (
            <span className="hidden md:flex items-center gap-2 px-3 py-2 text-[13px] text-manso-cream/70">
              <User size={14} aria-hidden />
              <span className="truncate max-w-[220px]">{userEmail}</span>
            </span>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-manso-cream/20 text-[13px] font-bold uppercase tracking-wider text-manso-cream/80 hover:bg-manso-cream/10 transition-colors"
          >
            <ExternalLink size={14} aria-hidden /> Ver sitio
          </a>
          <a
            href="/login?force=true"
            className="px-3 py-2 rounded-xl border border-manso-cream/20 text-[13px] font-bold uppercase tracking-wider text-manso-cream/80 hover:bg-manso-cream/10 transition-colors"
            title="Cambiar de usuario"
          >
            Cambiar usuario
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-manso-cream text-manso-black text-[13px] font-bold uppercase tracking-wider hover:opacity-80 transition-opacity"
            >
              <LogOut size={14} aria-hidden /> Salir
            </button>
          </form>
        </div>
      </div>

      {/* Fila 2 — grupos */}
      <nav aria-label="Grupos del panel" className="px-4 sm:px-6 lg:px-10">
        <ul className="flex gap-1 overflow-x-auto scrollbar-hide">
          {GRUPOS.map(g => {
            const activo = g.id === grupo.id;
            const Icon = g.icon;
            return (
              <li key={g.id} className="shrink-0">
                <button
                  type="button"
                  onClick={() => onChange(activo ? tab : g.secciones[0].id)}
                  aria-current={activo ? 'page' : undefined}
                  className={`flex items-center gap-2 px-4 sm:px-5 py-3 -mb-px border-b-2 text-[14px] font-black uppercase tracking-widest transition-colors ${
                    activo
                      ? 'border-manso-terra text-manso-cream'
                      : 'border-transparent text-manso-cream/60 hover:text-manso-cream'
                  }`}
                >
                  <Icon size={16} aria-hidden />
                  {g.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Fila 3 — secciones del grupo */}
      {grupo.secciones.length > 1 && (
        <div className="border-t border-manso-cream/10 bg-manso-cream/[0.04]">
          <ul className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-10 py-2.5">
            {visibles.map(s => {
              const activo = s.id === tab;
              const Icon = s.icon;
              return (
                <li key={s.id} className="shrink-0">
                  <button
                    type="button"
                    onClick={() => onChange(s.id)}
                    aria-current={activo ? 'page' : undefined}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[14px] font-bold transition-colors ${
                      activo
                        ? 'bg-manso-terra text-white'
                        : 'text-manso-cream/70 hover:bg-manso-cream/10 hover:text-manso-cream'
                    }`}
                  >
                    <Icon size={15} aria-hidden />
                    {s.label}
                  </button>
                </li>
              );
            })}

            {escondidas.length > 0 && (
              <li className="relative shrink-0">
                <details className="group">
                  <summary
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[14px] font-bold cursor-pointer list-none select-none transition-colors [&::-webkit-details-marker]:hidden ${
                      escondidaActiva
                        ? 'bg-manso-terra text-white'
                        : 'text-manso-cream/62 hover:bg-manso-cream/10 hover:text-manso-cream'
                    }`}
                  >
                    {escondidaActiva ? escondidaActiva.label : 'Más…'}
                    <ChevronDown size={14} aria-hidden className="transition-transform group-open:rotate-180" />
                  </summary>
                  <ul className="absolute left-0 top-full mt-2 z-50 min-w-[200px] rounded-2xl border border-manso-cream/15 bg-zinc-950 p-1.5 shadow-xl">
                    {escondidas.map(s => {
                      const Icon = s.icon;
                      return (
                        <li key={s.id}>
                          <button
                            type="button"
                            onClick={(e) => {
                              onChange(s.id);
                              (e.currentTarget.closest('details') as HTMLDetailsElement | null)?.removeAttribute('open');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-[14px] font-bold text-manso-cream/80 hover:bg-manso-cream/10 hover:text-manso-cream"
                          >
                            <Icon size={15} aria-hidden />
                            {s.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </details>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
