'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Trash2, Save, GripVertical } from 'lucide-react';

// ── Tipos ────────────────────────────────────────────────────

interface TipoEvento { id: string; label: string; icono: string; precio: number; orden: number; activo: boolean; }
interface Duracion    { id: string; label: string; multiplicador: number; orden: number; activo: boolean; }
interface Capacidad   { id: string; label: string; precio: number; orden: number; activo: boolean; }
interface Servicio    { id: string; label: string; precio: number; orden: number; activo: boolean; }

const ICONOS_DISPONIBLES = ['Music', 'Palette', 'Camera', 'Mic', 'Users', 'Calendar', 'Star', 'Video', 'BookOpen', 'Package'];

const inputCls = "bg-manso-cream/5 border border-manso-cream/15 rounded-xl px-3 py-2 text-manso-cream placeholder:text-manso-cream/20 text-sm focus:outline-none focus:border-manso-terra/50 transition-colors";
const labelCls = "text-[9px] font-black uppercase tracking-[0.4em] text-manso-terra";

// ── Componente genérico de fila editable ─────────────────────

function TipoRow({ item, onSave, onDelete }: {
  item: TipoEvento;
  onSave: (updated: TipoEvento) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(item);
  const dirty = JSON.stringify(local) !== JSON.stringify(item);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-manso-cream/5 border border-manso-cream/10 rounded-xl">
      <GripVertical size={14} className="text-manso-cream/20 shrink-0" />
      <input
        className={`${inputCls} flex-1 min-w-[140px]`}
        value={local.label}
        onChange={e => setLocal(p => ({ ...p, label: e.target.value }))}
        placeholder="Nombre del tipo"
      />
      <select
        className={`${inputCls} w-32`}
        value={local.icono}
        onChange={e => setLocal(p => ({ ...p, icono: e.target.value }))}
      >
        {ICONOS_DISPONIBLES.map(ic => <option key={ic} value={ic}>{ic}</option>)}
      </select>
      <div className="flex items-center gap-1">
        <span className="text-manso-cream/40 text-xs">$</span>
        <input
          type="number"
          className={`${inputCls} w-28`}
          value={local.precio}
          onChange={e => setLocal(p => ({ ...p, precio: Number(e.target.value) }))}
          min={0}
          step={1000}
        />
      </div>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={local.activo}
          onChange={e => setLocal(p => ({ ...p, activo: e.target.checked }))}
          className="accent-manso-terra"
        />
        <span className="text-[10px] text-manso-cream/50">Activo</span>
      </label>
      {dirty && (
        <button
          onClick={() => onSave(local)}
          className="p-2 bg-manso-terra/20 hover:bg-manso-terra/40 rounded-lg transition-all"
          title="Guardar"
        >
          <Save size={13} className="text-manso-terra" />
        </button>
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
        title="Eliminar"
      >
        <Trash2 size={13} className="text-red-400" />
      </button>
    </div>
  );
}

function MultiRow({ item, field, unit, onSave, onDelete }: {
  item: Duracion | Capacidad;
  field: 'multiplicador';
  unit: string;
  onSave: (updated: typeof item) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(item);
  const dirty = JSON.stringify(local) !== JSON.stringify(item);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-manso-cream/5 border border-manso-cream/10 rounded-xl">
      <GripVertical size={14} className="text-manso-cream/20 shrink-0" />
      <input
        className={`${inputCls} flex-1 min-w-[160px]`}
        value={local.label}
        onChange={e => setLocal(p => ({ ...p, label: e.target.value }))}
        placeholder="Descripción"
      />
      <div className="flex items-center gap-1">
        <span className="text-manso-cream/40 text-xs">{unit}</span>
        <input
          type="number"
          className={`${inputCls} w-20`}
          value={(local as any)[field]}
          onChange={e => setLocal(p => ({ ...p, [field]: Number(e.target.value) }))}
          min={0.1}
          step={0.1}
        />
      </div>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={local.activo}
          onChange={e => setLocal(p => ({ ...p, activo: e.target.checked }))}
          className="accent-manso-terra"
        />
        <span className="text-[10px] text-manso-cream/50">Activo</span>
      </label>
      {dirty && (
        <button
          onClick={() => onSave(local)}
          className="p-2 bg-manso-terra/20 hover:bg-manso-terra/40 rounded-lg transition-all"
        >
          <Save size={13} className="text-manso-terra" />
        </button>
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
      >
        <Trash2 size={13} className="text-red-400" />
      </button>
    </div>
  );
}

function CapacidadRow({ item, onSave, onDelete }: {
  item: Capacidad;
  onSave: (updated: Capacidad) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(item);
  const dirty = JSON.stringify(local) !== JSON.stringify(item);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-manso-cream/5 border border-manso-cream/10 rounded-xl">
      <GripVertical size={14} className="text-manso-cream/20 shrink-0" />
      <input
        className={`${inputCls} flex-1 min-w-[180px]`}
        value={local.label}
        onChange={e => setLocal(p => ({ ...p, label: e.target.value }))}
        placeholder="Nombre de la capacidad"
      />
      <div className="flex items-center gap-1">
        <span className="text-manso-cream/40 text-xs">$</span>
        <input
          type="number"
          className={`${inputCls} w-28`}
          value={local.precio}
          onChange={e => setLocal(p => ({ ...p, precio: Number(e.target.value) }))}
          min={0}
          step={1000}
        />
      </div>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={local.activo}
          onChange={e => setLocal(p => ({ ...p, activo: e.target.checked }))}
          className="accent-manso-terra"
        />
        <span className="text-[10px] text-manso-cream/50">Activo</span>
      </label>
      {dirty && (
        <button
          onClick={() => onSave(local)}
          className="p-2 bg-manso-terra/20 hover:bg-manso-terra/40 rounded-lg transition-all"
        >
          <Save size={13} className="text-manso-terra" />
        </button>
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
      >
        <Trash2 size={13} className="text-red-400" />
      </button>
    </div>
  );
}

function ServicioRow({ item, onSave, onDelete }: {
  item: Servicio;
  onSave: (updated: Servicio) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState(item);
  const dirty = JSON.stringify(local) !== JSON.stringify(item);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-manso-cream/5 border border-manso-cream/10 rounded-xl">
      <GripVertical size={14} className="text-manso-cream/20 shrink-0" />
      <input
        className={`${inputCls} flex-1 min-w-[180px]`}
        value={local.label}
        onChange={e => setLocal(p => ({ ...p, label: e.target.value }))}
        placeholder="Nombre del servicio"
      />
      <div className="flex items-center gap-1">
        <span className="text-manso-cream/40 text-xs">$</span>
        <input
          type="number"
          className={`${inputCls} w-28`}
          value={local.precio}
          onChange={e => setLocal(p => ({ ...p, precio: Number(e.target.value) }))}
          min={0}
          step={1000}
        />
      </div>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={local.activo}
          onChange={e => setLocal(p => ({ ...p, activo: e.target.checked }))}
          className="accent-manso-terra"
        />
        <span className="text-[10px] text-manso-cream/50">Activo</span>
      </label>
      {dirty && (
        <button
          onClick={() => onSave(local)}
          className="p-2 bg-manso-terra/20 hover:bg-manso-terra/40 rounded-lg transition-all"
        >
          <Save size={13} className="text-manso-terra" />
        </button>
      )}
      <button
        onClick={() => onDelete(item.id)}
        className="p-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-all"
      >
        <Trash2 size={13} className="text-red-400" />
      </button>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────

type SubTab = 'tipos' | 'duraciones' | 'capacidades' | 'servicios';

export function CotizadorConfigAdmin() {
  const [activeTab, setActiveTab] = useState<SubTab>('tipos');
  const [tipos, setTipos]         = useState<TipoEvento[]>([]);
  const [duraciones, setDuraciones] = useState<Duracion[]>([]);
  const [capacidades, setCapacidades] = useState<Capacidad[]>([]);
  const [servicios, setServicios]   = useState<Servicio[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const load = async () => {
      const [t, d, c, s] = await Promise.all([
        supabase.from('cotizador_tipos_evento').select('*').order('orden'),
        supabase.from('cotizador_duraciones').select('*').order('orden'),
        supabase.from('cotizador_capacidades').select('*').order('orden'),
        supabase.from('cotizador_servicios').select('*').order('orden'),
      ]);
      setTipos(t.data || []);
      setDuraciones(d.data || []);
      setCapacidades(c.data || []);
      setServicios(s.data || []);
      setLoading(false);
    };
    load();
  }, []);

  // ── Tipos ──
  const saveTipo = async (updated: TipoEvento) => {
    await supabase.from('cotizador_tipos_evento').update(updated).eq('id', updated.id);
    setTipos(prev => prev.map(t => t.id === updated.id ? updated : t));
  };
  const deleteTipo = async (id: string) => {
    if (!confirm('¿Eliminar este tipo de evento?')) return;
    await supabase.from('cotizador_tipos_evento').delete().eq('id', id);
    setTipos(prev => prev.filter(t => t.id !== id));
  };
  const addTipo = async () => {
    const orden = tipos.length + 1;
    const { data } = await supabase.from('cotizador_tipos_evento')
      .insert({ label: 'Nuevo tipo', icono: 'Music', precio: 0, orden })
      .select().single();
    if (data) setTipos(prev => [...prev, data]);
  };

  // ── Duraciones ──
  const saveDuracion = async (updated: Duracion) => {
    await supabase.from('cotizador_duraciones').update(updated).eq('id', updated.id);
    setDuraciones(prev => prev.map(d => d.id === updated.id ? updated : d));
  };
  const deleteDuracion = async (id: string) => {
    if (!confirm('¿Eliminar esta duración?')) return;
    await supabase.from('cotizador_duraciones').delete().eq('id', id);
    setDuraciones(prev => prev.filter(d => d.id !== id));
  };
  const addDuracion = async () => {
    const { data } = await supabase.from('cotizador_duraciones')
      .insert({ label: 'Nueva duración', multiplicador: 1, orden: duraciones.length + 1 })
      .select().single();
    if (data) setDuraciones(prev => [...prev, data]);
  };

  // ── Capacidades ──
  const saveCapacidad = async (updated: Capacidad) => {
    await supabase.from('cotizador_capacidades').update(updated).eq('id', updated.id);
    setCapacidades(prev => prev.map(c => c.id === updated.id ? updated : c));
  };
  const deleteCapacidad = async (id: string) => {
    if (!confirm('¿Eliminar esta capacidad?')) return;
    await supabase.from('cotizador_capacidades').delete().eq('id', id);
    setCapacidades(prev => prev.filter(c => c.id !== id));
  };
  const addCapacidad = async () => {
    const { data } = await supabase.from('cotizador_capacidades')
      .insert({ label: 'Nueva capacidad', precio: 0, orden: capacidades.length + 1 })
      .select().single();
    if (data) setCapacidades(prev => [...prev, data]);
  };

  // ── Servicios ──
  const saveServicio = async (updated: Servicio) => {
    await supabase.from('cotizador_servicios').update(updated).eq('id', updated.id);
    setServicios(prev => prev.map(s => s.id === updated.id ? updated : s));
  };
  const deleteServicio = async (id: string) => {
    if (!confirm('¿Eliminar este servicio?')) return;
    await supabase.from('cotizador_servicios').delete().eq('id', id);
    setServicios(prev => prev.filter(s => s.id !== id));
  };
  const addServicio = async () => {
    const { data } = await supabase.from('cotizador_servicios')
      .insert({ label: 'Nuevo servicio', precio: 0, orden: servicios.length + 1 })
      .select().single();
    if (data) setServicios(prev => [...prev, data]);
  };

  const TABS: { id: SubTab; label: string; count: number }[] = [
    { id: 'tipos',      label: 'Tipos de evento', count: tipos.length },
    { id: 'duraciones', label: 'Duraciones',       count: duraciones.length },
    { id: 'capacidades',label: 'Capacidades',      count: capacidades.length },
    { id: 'servicios',  label: 'Servicios adicionales', count: servicios.length },
  ];

  if (loading) return <div className="text-manso-cream/40 text-center py-8">Cargando configuración...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-black uppercase tracking-tighter text-manso-cream mb-1">
          Configuración del cotizador
        </h3>
        <p className="text-manso-cream/40 text-xs">
          Los cambios se aplican inmediatamente al formulario público.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 p-1 bg-manso-cream/5 rounded-xl">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 px-3 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-manso-terra text-manso-cream'
                : 'text-manso-cream/40 hover:text-manso-cream/70'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 opacity-60">({tab.count})</span>
          </button>
        ))}
      </div>

      {/* Contenido de cada tab */}
      <div className="space-y-2">
        {activeTab === 'tipos' && (
          <>
            <p className={`${labelCls} mb-3`}>
              El precio base se multiplica por duración y capacidad
            </p>
            {tipos.map(t => (
              <TipoRow key={t.id} item={t} onSave={saveTipo} onDelete={deleteTipo} />
            ))}
            <button
              onClick={addTipo}
              className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 hover:bg-manso-cream/10 border border-dashed border-manso-cream/20 rounded-xl text-manso-cream/50 text-xs font-bold uppercase tracking-wider transition-all w-full justify-center mt-2"
            >
              <Plus size={14} /> Agregar tipo de evento
            </button>
          </>
        )}

        {activeTab === 'duraciones' && (
          <>
            <p className={`${labelCls} mb-3`}>
              Multiplicador: 1× = precio base, 2× = doble, etc.
            </p>
            {duraciones.map(d => (
              <MultiRow key={d.id} item={d} field="multiplicador" unit="×" onSave={saveDuracion} onDelete={deleteDuracion} />
            ))}
            <button
              onClick={addDuracion}
              className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 hover:bg-manso-cream/10 border border-dashed border-manso-cream/20 rounded-xl text-manso-cream/50 text-xs font-bold uppercase tracking-wider transition-all w-full justify-center mt-2"
            >
              <Plus size={14} /> Agregar duración
            </button>
          </>
        )}

        {activeTab === 'capacidades' && (
          <>
            <p className={`${labelCls} mb-3`}>
              Precio fijo que se suma al total (como los servicios adicionales)
            </p>
            {capacidades.map(c => (
              <CapacidadRow key={c.id} item={c} onSave={saveCapacidad} onDelete={deleteCapacidad} />
            ))}
            <button
              onClick={addCapacidad}
              className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 hover:bg-manso-cream/10 border border-dashed border-manso-cream/20 rounded-xl text-manso-cream/50 text-xs font-bold uppercase tracking-wider transition-all w-full justify-center mt-2"
            >
              <Plus size={14} /> Agregar capacidad
            </button>
          </>
        )}

        {activeTab === 'servicios' && (
          <>
            <p className={`${labelCls} mb-3`}>
              Precio fijo que se suma al total (no se multiplica)
            </p>
            {servicios.map(s => (
              <ServicioRow key={s.id} item={s} onSave={saveServicio} onDelete={deleteServicio} />
            ))}
            <button
              onClick={addServicio}
              className="flex items-center gap-2 px-4 py-2.5 bg-manso-cream/5 hover:bg-manso-cream/10 border border-dashed border-manso-cream/20 rounded-xl text-manso-cream/50 text-xs font-bold uppercase tracking-wider transition-all w-full justify-center mt-2"
            >
              <Plus size={14} /> Agregar servicio
            </button>
          </>
        )}
      </div>
    </div>
  );
}
