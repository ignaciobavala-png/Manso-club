import { ArrowRight } from 'lucide-react';

// Tipado senior para los eventos
interface Evento {
  id: string;
  fecha: string;
  titulo: string;
  categoria: string;
  disponible: boolean;
}

// Mock inicial (luego lo reemplazamos por el fetch de Supabase)
const MOCK_EVENTS: Evento[] = [
  { id: '1', fecha: '12 FEB', titulo: 'Degustación & Vinilos', categoria: 'Club', disponible: true },
  { id: '2', fecha: '15 FEB', titulo: 'Techno Workshop: Ableton 12', categoria: 'Talleres', disponible: true },
  { id: '3', fecha: '22 FEB', titulo: 'Manso Live: Open Decks', categoria: 'Club', disponible: false },
  { id: '4', fecha: '01 MAR', titulo: 'Feria de Diseño & Libros', categoria: 'Tienda', disponible: true },
];

export const EventList = () => {
  return (
    <div className="flex flex-col w-full">
      {MOCK_EVENTS.map((event) => (
        <div 
          key={event.id} 
          className="group flex flex-col md:flex-row md:items-center justify-between py-6 border-b border-manso-black/10 hover:border-manso-terra transition-colors cursor-pointer"
        >
          <div className="flex flex-col md:flex-row md:items-baseline gap-1 md:gap-8">
            <span className="text-xs font-black text-manso-terra shrink-0 tracking-tighter">
              {event.fecha}
            </span>
            <div className="flex flex-col">
              <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tighter group-hover:italic transition-all leading-none">
                {event.titulo}
              </h4>
              <span className="text-[9px] uppercase tracking-widest text-manso-black/40 mt-1">
                {event.categoria}
              </span>
            </div>
          </div>

          <div className="mt-4 md:mt-0 flex items-center gap-4">
            {!event.disponible ? (
              <span className="text-[10px] uppercase font-bold text-manso-black/30 border border-manso-black/10 px-3 py-1">
                Sold Out
              </span>
            ) : (
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest group-hover:text-manso-terra transition-colors">
                Tickets <ArrowRight size={14} className="shrink-0" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};