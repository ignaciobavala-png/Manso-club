'use client';

import type { ProximaFechaCowork } from '@/app/membresias/MembresiasClient';

interface Props {
  fechas: ProximaFechaCowork[];
  onAbrir: () => void;
}

/**
 * Open Cowork: el encuentro gratuito con cupo que sirve de puerta de entrada
 * antes de pagar una membresía. Un bloque compacto y redondeado, oscuro con
 * brillos suaves de la paleta (terracota y azul) que derivan despacio por dentro,
 * en vez de un color plano, y
 * las próximas fechas como fichas de vidrio con los cupos reales a la vista,
 * que es lo que decide si alguien se anota.
 *
 * Tocar una ficha o el botón abre el mismo formulario de siempre.
 */
export function OpenCowork({ fechas, onAbrir }: Props) {
  return (
    <section className="relative isolate overflow-hidden rounded-3xl bg-manso-black text-manso-cream mb-10 sm:mb-12 p-5 sm:p-8 flex flex-col items-center gap-6 sm:gap-7">
      {/* Brillos de fondo: dan profundidad sin recurrir a un color plano. */}
      <div
        aria-hidden
        className="cowork-luz-a absolute -z-10 -top-24 -left-16 w-72 h-72 rounded-full bg-manso-terra/40 blur-3xl"
      />
      <div
        aria-hidden
        className="cowork-luz-b absolute -z-10 -bottom-28 right-0 w-80 h-80 rounded-full bg-[#2a1fd6]/30 blur-3xl"
      />

      <div className="flex flex-col items-center text-center gap-4">
        <span className="inline-flex items-center gap-2 rounded-full border border-manso-cream/20 bg-manso-cream/10 backdrop-blur px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]">
          <span aria-hidden className="size-1.5 rounded-full bg-manso-terra" />
          Gratis · Cupo limitado
        </span>
        <h2 className="font-black uppercase italic tracking-[-0.03em] leading-[0.95] text-[clamp(1.75rem,3.4vw,2.75rem)]">
          Open Cowork
        </h2>
        <p className="max-w-3xl mx-auto text-sm sm:text-[15px] leading-relaxed text-manso-cream/70">
          Abrimos el cowork para que vengan a conocer a otras personas de la comunidad,
          compartir ideas, proyectos, charlas.
        </p>
        <button
          type="button"
          onClick={onAbrir}
          className="group inline-flex items-center gap-2 rounded-full bg-manso-cream text-manso-black pl-5 pr-4 min-h-[40px] text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white transition-colors duration-200"
        >
          Anotarme
          <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
        </button>
      </div>

      <div className="flex flex-wrap justify-center gap-2.5 w-full">
        {fechas.length === 0 ? (
          <p className="text-sm text-manso-cream/60">
            Estamos definiendo las próximas fechas. Volvé pronto.
          </p>
        ) : (
          fechas.map((f) => <Ficha key={f.fecha} f={f} onAbrir={onAbrir} />)
        )}
      </div>
    </section>
  );
}

function Ficha({ f, onAbrir }: { f: ProximaFechaCowork; onAbrir: () => void }) {
  const d = new Date(`${f.fecha}T00:00:00`);
  const dia = d.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '');
  const num = d.getDate();
  const mes = d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', '');
  const lleno = f.restantes <= 0;
  const ocupado = f.total > 0 ? Math.min(100, ((f.total - f.restantes) / f.total) * 100) : 100;
  const quedan = f.restantes === 1 ? 'Queda 1 lugar' : `Quedan ${f.restantes} lugares`;

  return (
    <button
      type="button"
      onClick={onAbrir}
      disabled={lleno}
      className="group flex items-center gap-4 w-full md:w-[19rem] text-left rounded-2xl border border-manso-cream/15 bg-manso-cream/[0.07] backdrop-blur-md px-4 py-3 disabled:opacity-50 disabled:cursor-not-allowed enabled:hover:bg-manso-cream/[0.14] enabled:hover:border-manso-cream/30 transition-colors duration-200"
    >
      <div className="flex flex-col items-center justify-center shrink-0 w-14 leading-none">
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-manso-cream/60">{dia}</span>
        <span className="mt-1 text-3xl font-black tracking-[-0.04em]">{num}</span>
        <span className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-manso-cream/60">{mes}</span>
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-[0.15em]">
            {f.horario ? `${f.horario.slice(0, 5)} hs` : 'Open Cowork'}
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-[0.15em] ${lleno ? 'text-manso-cream/50' : 'text-manso-cream/80'}`}>
            {lleno ? 'Completo' : quedan}
          </span>
        </div>
        <div className="h-1 w-full rounded-full bg-manso-cream/15 overflow-hidden">
          <div className="h-full rounded-full bg-manso-terra" style={{ width: `${ocupado}%` }} />
        </div>
      </div>

      <span aria-hidden className="text-lg text-manso-cream/60 transition-transform duration-300 group-enabled:group-hover:translate-x-1">
        →
      </span>
    </button>
  );
}
