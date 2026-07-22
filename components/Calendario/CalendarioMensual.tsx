'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarioOcurrencia } from '@/lib/types/calendario';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];

// Patrones fijos (no aleatorios en cada render) para romper la uniformidad del grid: líneas de grosor
// desparejo entre celdas y chips de evento con una leve rotación tipo recorte pegado.
const GROSORES_BORDE = [1, 1, 2, 1, 3, 1, 2];
const ROTACIONES_CHIP = [-2, 1, -1, 2, -3];

function mismodia(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

interface Props {
  ocurrencias: CalendarioOcurrencia[];
  mesVisible: Date;
  onCambiarMes: (fecha: Date) => void;
}

export function CalendarioMensual({ ocurrencias, mesVisible, onCambiarMes }: Props) {
  const router = useRouter();
  const [seleccionado, setSeleccionado] = useState<CalendarioOcurrencia | null>(null);
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);

  const celdas = useMemo(() => {
    const anio = mesVisible.getFullYear();
    const mes = mesVisible.getMonth();
    const primerDia = new Date(anio, mes, 1);
    const ultimoDia = new Date(anio, mes + 1, 0);

    // Lunes = 0 ... Domingo = 6
    const offsetInicio = (primerDia.getDay() + 6) % 7;

    const dias: Date[] = [];
    for (let i = 0; i < offsetInicio; i++) {
      dias.push(new Date(anio, mes, 1 - (offsetInicio - i)));
    }
    for (let d = 1; d <= ultimoDia.getDate(); d++) {
      dias.push(new Date(anio, mes, d));
    }
    while (dias.length % 7 !== 0) {
      dias.push(new Date(anio, mes, ultimoDia.getDate() + (dias.length - offsetInicio - ultimoDia.getDate() + 1)));
    }
    return dias;
  }, [mesVisible]);

  const hoy = new Date();

  // Al cambiar de mes: si el mes visible es el actual, arrancar con hoy seleccionado.
  useEffect(() => {
    const esMesActual = mesVisible.getFullYear() === hoy.getFullYear() && mesVisible.getMonth() === hoy.getMonth();
    setDiaSeleccionado(esMesActual ? new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesVisible]);

  const itemsDelDia = diaSeleccionado
    ? ocurrencias.filter(o => mismodia(o.fecha, diaSeleccionado))
    : [];

  const handleClick = (item: CalendarioOcurrencia) => {
    if (item.href) {
      router.push(item.href);
    } else if (item.linkExterno) {
      window.open(item.linkExterno, '_blank', 'noopener,noreferrer');
    } else {
      setSeleccionado(item);
    }
  };

  return (
    <div>
      {/* Header mes + navegación */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => onCambiarMes(new Date(mesVisible.getFullYear(), mesVisible.getMonth() - 1, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-manso-cream/15 text-manso-cream hover:bg-manso-cream/10 transition-colors"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-manso-cream">
          {MESES[mesVisible.getMonth()]} <span className="text-manso-cream/40">{mesVisible.getFullYear()}</span>
        </h2>
        <button
          onClick={() => onCambiarMes(new Date(mesVisible.getFullYear(), mesVisible.getMonth() + 1, 1))}
          className="w-10 h-10 flex items-center justify-center rounded-full border border-manso-cream/15 text-manso-cream hover:bg-manso-cream/10 transition-colors"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Encabezado días de la semana */}
      <div className="grid grid-cols-7 gap-px mb-2 border-b-2 border-manso-cream/25">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[11px] md:text-xs font-black uppercase tracking-widest text-manso-cream py-2.5">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla del mes: cada celda es un día real; alto según contenido y bordes desparejos rompen la uniformidad sin perder la alineación por columna */}
      <div className="grid grid-cols-7 items-start border-l border-t border-manso-cream/20">
        {celdas.map((dia, i) => {
          const esDelMes = dia.getMonth() === mesVisible.getMonth();
          const esHoy = mismodia(dia, hoy);
          const esSeleccionado = diaSeleccionado !== null && mismodia(dia, diaSeleccionado);
          const items = ocurrencias.filter(o => mismodia(o.fecha, dia));
          const grosorBorde = GROSORES_BORDE[i % GROSORES_BORDE.length];

          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`${dia.getDate()} de ${MESES[dia.getMonth()]}${items.length ? `, ${items.length} ${items.length === 1 ? 'actividad' : 'actividades'}` : ''}`}
              onClick={() => setDiaSeleccionado(new Date(dia))}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setDiaSeleccionado(new Date(dia)); } }}
              style={{
                borderRightWidth: grosorBorde,
                borderBottomWidth: grosorBorde,
                transform: esSeleccionado ? 'rotate(-1deg) scale(1.03)' : undefined,
              }}
              className={`relative border-manso-cream/20 p-1.5 md:p-2 bg-manso-black flex flex-col gap-1 cursor-pointer transition-all ${
                items.length > 0
                  ? 'min-h-[56px] md:min-h-[104px] bg-manso-cream/[0.02]'
                  : 'min-h-[36px] md:min-h-[52px] justify-center items-center'
              } ${!esDelMes ? 'opacity-30' : ''} ${
                esSeleccionado ? 'z-10 !border-manso-terra/70 bg-manso-terra/[0.06]' : 'hover:bg-manso-cream/[0.04]'
              }`}
            >
              {/* Número de día gigante de fondo, clippeado al tamaño de la celda para que no desborde a la fila de abajo */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <span
                  aria-hidden
                  className={`select-none absolute left-1 bottom-0 font-black italic leading-none ${
                    items.length > 0 ? 'text-[40px] md:text-[76px] text-manso-cream/20' : 'text-[24px] md:text-[36px] text-manso-cream/8'
                  }`}
                >
                  {dia.getDate()}
                </span>
              </div>

              {esHoy && (
                <span className="absolute top-1 right-1 z-10 text-[9px] font-black uppercase tracking-widest text-manso-black bg-manso-cream px-1.5 py-0.5 -rotate-2 shadow-[2px_2px_0_rgba(0,0,0,0.35)]">
                  Hoy
                </span>
              )}

              {/* Mobile: puntitos que señalan actividad (el detalle se ve abajo) */}
              <div className="relative flex md:hidden flex-wrap items-center gap-1 px-0.5">
                {items.slice(0, 4).map((item, idx) => (
                  <span
                    key={item.id + idx}
                    className={`w-1.5 h-1.5 rounded-full ${item.tipo === 'evento' ? 'bg-manso-terra' : 'bg-manso-cream/50'}`}
                  />
                ))}
                {items.length > 4 && (
                  <span className="text-[8px] font-black text-manso-cream/40 leading-none">+</span>
                )}
              </div>

              {/* Desktop: chips clickeables, como recortes de flyer pegados torcidos */}
              <div className="relative hidden md:flex flex-col gap-1.5">
                {items.slice(0, 3).map((item, idx) => {
                  const rot = ROTACIONES_CHIP[(i + idx) % ROTACIONES_CHIP.length];
                  return (
                    <div key={item.id + idx} className="group/chip relative">
                      <button
                        onClick={e => { e.stopPropagation(); setDiaSeleccionado(new Date(dia)); handleClick(item); }}
                        style={{ transform: `rotate(${rot}deg)` }}
                        className={`w-full text-left text-[10px] font-black uppercase tracking-tight leading-tight px-1.5 py-1 truncate border transition-transform hover:rotate-0 hover:scale-[1.03] hover:z-10 shadow-[2px_2px_0_rgba(0,0,0,0.35)] ${
                          item.tipo === 'evento'
                            ? 'bg-manso-terra text-manso-cream border-manso-cream/20'
                            : 'bg-manso-cream/10 text-manso-cream/80 border-manso-cream/15'
                        }`}
                      >
                        {item.hora && <span className="opacity-60 mr-1">{item.hora}</span>}
                        {item.titulo}
                      </button>

                      {/* Adelanto grande al pasar el mouse: le damos protagonismo al evento, no es un detalle chico */}
                      <div className="pointer-events-none absolute left-0 top-full mt-2 w-80 max-w-[85vw] z-30 rounded-2xl border border-manso-cream/15 bg-manso-black overflow-hidden opacity-0 scale-95 origin-top-left transition-all duration-200 group-hover/chip:opacity-100 group-hover/chip:scale-100 shadow-2xl">
                        {item.tipo === 'evento' && item.imagen_url && (
                          <div className="relative w-full h-36 bg-manso-blue/30">
                            <Image
                              src={item.imagen_url}
                              alt={item.titulo}
                              fill
                              sizes="320px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-1.5">
                            <p className={`text-[9px] font-black uppercase tracking-[0.3em] ${item.tipo === 'evento' ? 'text-manso-terra' : 'text-manso-cream/40'}`}>
                              {item.categoria || (item.tipo === 'evento' ? 'Evento' : 'Agenda')}
                            </p>
                            {item.hora && (
                              <p className="text-[10px] font-black text-manso-cream/50 tabular-nums">{item.hora} hs</p>
                            )}
                          </div>
                          <p className="text-lg font-black uppercase italic tracking-tighter text-manso-cream leading-tight mb-1.5">
                            {item.titulo}
                          </p>
                          {item.descripcion && (
                            <p className="text-[13px] text-manso-cream/60 font-light leading-relaxed line-clamp-4">
                              {item.descripcion}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {items.length > 3 && (
                  <button
                    onClick={e => { e.stopPropagation(); setDiaSeleccionado(new Date(dia)); }}
                    className="text-left text-[9px] text-manso-cream/40 hover:text-manso-cream/70 font-black px-1.5 transition-colors"
                  >
                    +{items.length - 3} más
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detalle del día seleccionado */}
      {diaSeleccionado && (
        <div className="mt-8">
          <div className="flex items-center gap-4 mb-5">
            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra">
              {diaSeleccionado.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <div className="flex-1 h-px bg-manso-cream/10" />
          </div>

          {itemsDelDia.length === 0 ? (
            <p className="text-sm text-manso-cream/30 font-light">
              Sin actividades este día.
            </p>
          ) : (
            <div className="space-y-px">
              {itemsDelDia.map((item, idx) => {
                const esEvento = item.tipo === 'evento';
                const soldOut = esEvento && item.disponible === false;
                const tieneDestino = Boolean(item.href || (item.linkExterno && !soldOut));
                return (
                  <div
                    key={item.id + idx}
                    onClick={tieneDestino ? () => handleClick(item) : undefined}
                    className={`group flex items-start gap-4 md:gap-6 bg-manso-cream/[0.04] px-4 md:px-6 py-4 md:py-5 first:rounded-t-2xl last:rounded-b-2xl ${
                      tieneDestino ? 'cursor-pointer hover:bg-manso-cream/[0.08] transition-colors' : ''
                    }`}
                  >
                    {/* Flyer del evento */}
                    {esEvento && item.imagen_url && (
                      <div className="relative shrink-0 w-20 md:w-28 aspect-[3/4] rounded-xl overflow-hidden bg-manso-blue/30">
                        <Image
                          src={item.imagen_url}
                          alt={item.titulo}
                          fill
                          sizes="112px"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                        />
                        {soldOut && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/90 bg-black/60 px-2 py-1">
                              Sold out
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <p className={`text-[9px] font-black uppercase tracking-[0.4em] ${
                          esEvento ? 'text-manso-terra' : 'text-manso-cream/40'
                        }`}>
                          {item.categoria || (esEvento ? 'Evento' : 'Agenda')}
                        </p>
                        {item.hora && (
                          <p className="text-[10px] font-black text-manso-cream/50 tabular-nums">
                            {item.hora} hs
                          </p>
                        )}
                      </div>
                      <h3 className={`text-base md:text-lg font-black uppercase italic tracking-tighter leading-tight text-manso-cream ${
                        tieneDestino ? 'group-hover:text-manso-terra transition-colors' : ''
                      }`}>
                        {item.titulo}
                      </h3>
                      {item.descripcion && (
                        <p className={`text-xs text-manso-cream/40 font-light leading-relaxed mt-1.5 ${
                          esEvento ? 'line-clamp-4' : 'line-clamp-2'
                        }`}>
                          {esEvento
                            ? item.descripcion
                            : item.descripcion.split('\n').map(p => p.trim()).find(p => p.length > 0)}
                        </p>
                      )}

                      {/* CTA del evento */}
                      {esEvento && (
                        <div className="mt-3">
                          {soldOut ? (
                            <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest bg-manso-cream/10 text-manso-cream/40 px-4 py-2 rounded-full">
                              Sold out
                            </span>
                          ) : item.linkExterno ? (
                            <span className="inline-flex items-center text-[9px] font-black uppercase tracking-widest bg-manso-terra text-manso-cream px-4 py-2 rounded-full group-hover:bg-manso-cream group-hover:text-manso-black transition-colors">
                              Comprar tickets →
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* CTA de talleres/agenda */}
                    {!esEvento && tieneDestino && (
                      <span className="shrink-0 self-center text-[9px] font-black uppercase tracking-widest text-manso-cream/40 group-hover:text-manso-terra transition-colors whitespace-nowrap">
                        Ver detalle →
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal simple para ítems sin destino (sin slug ni link) */}
      {seleccionado && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-6"
          onClick={() => setSeleccionado(null)}
        >
          <div
            className="bg-manso-black border border-manso-cream/15 rounded-3xl p-8 max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-3">
              {seleccionado.tipo === 'evento' ? 'Evento' : 'Agenda'}
            </p>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-manso-cream mb-2">
              {seleccionado.titulo}
            </h3>
            <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/40 mb-4">
              {seleccionado.fecha.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
              {seleccionado.hora && ` · ${seleccionado.hora} hs`}
            </p>
            {seleccionado.descripcion && (
              <p className="text-sm text-manso-cream/50 font-light leading-relaxed mb-6">
                {seleccionado.descripcion}
              </p>
            )}
            <button
              onClick={() => setSeleccionado(null)}
              className="bg-manso-cream text-manso-black px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
