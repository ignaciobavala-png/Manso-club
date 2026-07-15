'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { CalendarioOcurrencia } from '@/lib/types/calendario';

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DIAS_SEMANA = ['LUN','MAR','MIÉ','JUE','VIE','SÁB','DOM'];

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
      <div className="grid grid-cols-7 gap-px mb-1">
        {DIAS_SEMANA.map(d => (
          <div key={d} className="text-center text-[9px] font-black uppercase tracking-widest text-manso-cream/30 py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Grilla del mes */}
      <div className="grid grid-cols-7 gap-px bg-manso-cream/8 border border-manso-cream/8">
        {celdas.map((dia, i) => {
          const esDelMes = dia.getMonth() === mesVisible.getMonth();
          const esHoy = mismodia(dia, hoy);
          const items = ocurrencias.filter(o => mismodia(o.fecha, dia));

          return (
            <div
              key={i}
              className={`min-h-[92px] md:min-h-[120px] p-1.5 md:p-2 bg-manso-black flex flex-col gap-1 ${!esDelMes ? 'opacity-30' : ''}`}
            >
              <span className={`text-xs font-black ${esHoy ? 'w-5 h-5 flex items-center justify-center rounded-full bg-manso-terra text-manso-cream' : 'text-manso-cream/50'}`}>
                {dia.getDate()}
              </span>
              <div className="flex flex-col gap-1 overflow-hidden">
                {items.slice(0, 3).map((item, idx) => (
                  <button
                    key={item.id + idx}
                    onClick={() => handleClick(item)}
                    className={`text-left text-[9px] md:text-[10px] font-black uppercase tracking-tight leading-tight px-1.5 py-1 rounded truncate transition-colors ${
                      item.tipo === 'evento'
                        ? 'bg-manso-terra/20 text-manso-terra hover:bg-manso-terra/30'
                        : 'bg-manso-cream/10 text-manso-cream/80 hover:bg-manso-cream/20'
                    }`}
                    title={item.titulo}
                  >
                    {item.titulo}
                  </button>
                ))}
                {items.length > 3 && (
                  <span className="text-[9px] text-manso-cream/30 font-black px-1.5">+{items.length - 3} más</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

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
            <h3 className="text-2xl font-black uppercase italic tracking-tighter text-manso-cream mb-4">
              {seleccionado.titulo}
            </h3>
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
