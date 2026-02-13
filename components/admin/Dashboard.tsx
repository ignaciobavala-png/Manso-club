'use client';

import { useState } from 'react';
import { logoutAction } from '../../app/mansoadm/actions';
import { FormEvento } from './FormEvento';
import { FormProducto } from './FormProducto';
import { FormArtista } from './FormArtista';
import { ItemList } from './ItemList';
import { LogOut, Calendar, ShoppingBag, User } from 'lucide-react';

export function Dashboard() {
  const [tab, setTab] = useState<'eventos' | 'tienda' | 'artistas'>('eventos');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="p-8 max-w-5xl mx-auto min-h-screen pt-20">
        {/* Header Superior */}
        <div className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">Manso Admin_</h1>
            <p className="text-[10px] font-bold text-manso-cream/60 uppercase tracking-[0.3em]">Panel de Control Centralizado</p>
          </div>
          <form action={logoutAction}>
            <button 
              type="submit"
              className="flex items-center gap-2 px-4 py-2 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-white transition-all shadow-sm"
            >
              <LogOut size={14} />
              Salir
            </button>
          </form>
        </div>

        {/* Selector de Pestañas Estilizado */}
        <div className="flex gap-2 mb-10 bg-manso-cream/10 p-1 rounded-2xl w-fit">
          <button 
            onClick={() => setTab('eventos')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'eventos' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <Calendar size={14} />
            Agenda
          </button>
          <button 
            onClick={() => setTab('tienda')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'tienda' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <ShoppingBag size={14} />
            Tienda
          </button>
          <button 
            onClick={() => setTab('artistas')} 
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              tab === 'artistas' ? 'bg-manso-cream text-manso-black shadow-sm' : 'text-manso-cream/60 hover:text-manso-cream'
            }`}
          >
            <User size={14} />
            Artistas
          </button>
        </div>

        {/* Grid Principal: Formulario + Lista de Gestión */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Columna Izquierda: Formularios de Creación */}
          <div className="lg:col-span-5">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-6 ml-2">
              Nuevo {tab === 'eventos' ? 'Evento' : tab === 'tienda' ? 'Producto' : 'Artista'}
            </h2>
            <div className="sticky top-8">
              {tab === 'eventos' ? <FormEvento /> : tab === 'tienda' ? <FormProducto /> : <FormArtista />}
            </div>
          </div>

          {/* Columna Derecha: Listas de Gestión */}
          <div className="lg:col-span-7">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-manso-cream/60 mb-6 ml-2">
              Gestionar Existentes
            </h2>
            {tab === 'eventos' ? (
              <ItemList table="eventos" title="Eventos en Agenda" />
            ) : tab === 'tienda' ? (
              <ItemList table="productos" title="Inventario de Tienda" />
            ) : (
              <ItemList table="artistas" title="Comunidad de Artistas" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}