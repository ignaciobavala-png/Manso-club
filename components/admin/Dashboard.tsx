'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { FormEvento } from './FormEvento';
import { FormProducto } from './FormProducto';
import { ItemList } from './ItemList'; // Nuevo componente de gestión
import { LogOut, Calendar, ShoppingBag } from 'lucide-react';

export function Dashboard() {
  const [tab, setTab] = useState<'eventos' | 'tienda'>('eventos');

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen bg-zinc-50/30">
      {/* Header Superior */}
      <div className="flex justify-between items-center mb-12">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">Manso Admin_</h1>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Panel de Control Centralizado</p>
        </div>
        <button 
          onClick={() => supabase.auth.signOut()} 
          className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-100 rounded-xl text-xs font-bold uppercase hover:bg-red-50 hover:text-red-600 transition-all shadow-sm"
        >
          <LogOut size={14} />
          Salir
        </button>
      </div>

      {/* Selector de Pestañas Estilizado */}
      <div className="flex gap-2 mb-10 bg-zinc-100 p-1 rounded-2xl w-fit">
        <button 
          onClick={() => setTab('eventos')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'eventos' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <Calendar size={14} />
          Agenda
        </button>
        <button 
          onClick={() => setTab('tienda')} 
          className={`flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            tab === 'tienda' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-zinc-600'
          }`}
        >
          <ShoppingBag size={14} />
          Tienda
        </button>
      </div>

      {/* Grid Principal: Formulario + Lista de Gestión */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Columna Izquierda: Formularios de Creación */}
        <div className="lg:col-span-5">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 ml-2">
            Nuevo {tab === 'eventos' ? 'Evento' : 'Producto'}
          </h2>
          <div className="sticky top-8">
            {tab === 'eventos' ? <FormEvento /> : <FormProducto />}
          </div>
        </div>

        {/* Columna Derecha: Listas de Gestión (Borrado) */}
        <div className="lg:col-span-7">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 ml-2">
            Gestionar Existentes
          </h2>
          {tab === 'eventos' ? (
            <ItemList table="eventos" title="Eventos en Agenda" />
          ) : (
            <ItemList table="productos" title="Inventario de Tienda" />
          )}
        </div>
      </div>
    </div>
  );
}