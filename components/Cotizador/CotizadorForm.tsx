'use client';

import { useState, useEffect } from 'react';
import { Calculator, Clock, Users, Music, Camera, Palette, Mic, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const inputCls = "w-full bg-manso-cream/5 border border-manso-cream/15 rounded-2xl px-5 py-4 text-manso-cream placeholder:text-manso-cream/30 text-sm font-light focus:outline-none focus:border-manso-terra/60 transition-colors";
const labelCls = "block text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-2";
const radioCls = "sr-only";
const radioLabelCls = (selected: boolean) =>
  `flex items-center p-4 rounded-xl cursor-pointer transition-all border ${
    selected
      ? 'bg-manso-terra/20 border-manso-terra/60'
      : 'bg-manso-cream/5 border-manso-cream/15 hover:bg-manso-cream/10'
  }`;

// Mapa de nombres de ícono → componente Lucide
const ICONOS: Record<string, React.ElementType> = {
  Music, Camera, Palette, Mic, Users, Clock, Calculator,
};

interface TipoEvento {
  id: string; label: string; icono: string; precio: number; orden: number;
}
interface Duracion {
  id: string; label: string; precio: number; orden: number;
}
interface Capacidad {
  id: string; label: string; precio: number; orden: number;
}
interface Servicio {
  id: string; label: string; precio: number; orden: number;
}

interface ContactoData {
  nombre: string; email: string; telefono: string; fecha: string; hora: string;
}

export function CotizadorForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [enviado, setEnviado] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Config desde Supabase
  const [tipos, setTipos] = useState<TipoEvento[]>([]);
  const [duraciones, setDuraciones] = useState<Duracion[]>([]);
  const [capacidades, setCapacidades] = useState<Capacidad[]>([]);
  const [servicios, setServicios] = useState<Servicio[]>([]);

  // Selecciones del usuario
  const [tipoId, setTipoId] = useState('');
  const [duracionId, setDuracionId] = useState('');
  const [capacidadId, setCapacidadId] = useState('');
  const [serviciosIds, setServiciosIds] = useState<string[]>([]);
  const [contacto, setContacto] = useState<ContactoData>({
    nombre: '', email: '', telefono: '', fecha: '', hora: '',
  });

  // Precio calculado reactivamente
  const [precioEstimado, setPrecioEstimado] = useState(0);

  useEffect(() => {
    const fetchConfig = async () => {
      const [t, d, c, s] = await Promise.all([
        supabase.from('cotizador_tipos_evento').select('*').eq('activo', true).order('orden'),
        supabase.from('cotizador_duraciones').select('*').eq('activo', true).order('orden'),
        supabase.from('cotizador_capacidades').select('*').eq('activo', true).order('orden'),
        supabase.from('cotizador_servicios').select('*').eq('activo', true).order('orden'),
      ]);
      setTipos(t.data || []);
      setDuraciones(d.data || []);
      setCapacidades(c.data || []);
      setServicios(s.data || []);
      setLoading(false);
    };
    fetchConfig();
  }, []);

  // Recalcular precio cuando cambia cualquier selección
  useEffect(() => {
    const tipo = tipos.find(t => t.id === tipoId);
    const dur  = duraciones.find(d => d.id === duracionId);
    const cap  = capacidades.find(c => c.id === capacidadId);

    if (!tipo || !dur || !cap) { setPrecioEstimado(0); return; }

    const extras = serviciosIds.reduce((sum, id) => {
      return sum + (servicios.find(s => s.id === id)?.precio || 0);
    }, 0);
    setPrecioEstimado(Math.round(tipo.precio + dur.precio + cap.precio + extras));
  }, [tipoId, duracionId, capacidadId, serviciosIds, tipos, duraciones, capacidades, servicios]);

  const toggleServicio = (id: string) => {
    setServiciosIds(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const nextStep = () => { if (currentStep < 6) setCurrentStep(s => s + 1); };
  const prevStep = () => { if (currentStep > 1) setCurrentStep(s => s - 1); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const tipo     = tipos.find(t => t.id === tipoId);
    const duracion = duraciones.find(d => d.id === duracionId);
    const capacidad = capacidades.find(c => c.id === capacidadId);
    const serviciosLabels = serviciosIds.map(id => servicios.find(s => s.id === id)?.label || '');

    const { error } = await supabase.from('cotizaciones').insert({
      nombre:           contacto.nombre,
      email:            contacto.email,
      telefono:         contacto.telefono,
      tipo_evento_id:   tipoId,
      tipo_evento_label: tipo?.label || '',
      duracion_id:      duracionId,
      duracion_label:   duracion?.label || '',
      capacidad_id:     capacidadId,
      capacidad_label:  capacidad?.label || '',
      servicios_ids:    serviciosIds,
      servicios_labels: serviciosLabels,
      fecha:            contacto.fecha || null,
      hora:             contacto.hora || null,
      precio_estimado:  precioEstimado,
    });

    setSubmitting(false);
    if (!error) setEnviado(true);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-manso-cream/40">
      <Loader2 className="w-6 h-6 animate-spin mr-3" />
      Cargando cotizador...
    </div>
  );

  if (enviado) return (
    <div className="flex flex-col items-start gap-6 py-16">
      <CheckCircle size={48} className="text-manso-terra" />
      <h2 className="text-3xl font-black uppercase italic tracking-tighter text-manso-cream">
        ¡Cotización enviada!
      </h2>
      <p className="text-manso-cream/60 font-light leading-relaxed">
        Nuestro equipo comercial va a revisar tu solicitud y te contactamos a la brevedad.
      </p>
      <p className="text-manso-cream/40 text-sm">
        Precio estimado: <span className="text-manso-terra font-black">${precioEstimado.toLocaleString('es-AR')}</span>
      </p>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Qué tipo de evento querés organizar?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tipos.map((tipo) => {
                const Icon = ICONOS[tipo.icono] || Music;
                const selected = tipoId === tipo.id;
                return (
                  <label key={tipo.id} className={radioLabelCls(selected)}>
                    <input
                      type="radio"
                      name="tipoEvento"
                      value={tipo.id}
                      checked={selected}
                      onChange={() => setTipoId(tipo.id)}
                      className={radioCls}
                    />
                    <Icon className={`w-6 h-6 mr-3 shrink-0 ${selected ? 'text-manso-terra' : 'text-manso-cream/50'}`} />
                    <div>
                      <p className={`font-medium ${selected ? 'text-manso-cream' : 'text-manso-cream/70'}`}>{tipo.label}</p>
                      <p className="text-xs text-manso-cream/60">
                        Desde ${tipo.precio.toLocaleString('es-AR')}
                      </p>
                    </div>
                    {selected && <div className="ml-auto w-2 h-2 rounded-full bg-manso-terra shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Cuánto tiempo durará el evento?
            </h3>
            <div className="space-y-3">
              {duraciones.map((dur) => {
                const selected = duracionId === dur.id;
                return (
                  <label key={dur.id} className={radioLabelCls(selected)}>
                    <input
                      type="radio"
                      name="duracion"
                      value={dur.id}
                      checked={selected}
                      onChange={() => setDuracionId(dur.id)}
                      className={radioCls}
                    />
                    <Clock className={`w-5 h-5 mr-3 shrink-0 ${selected ? 'text-manso-terra' : 'text-manso-cream/50'}`} />
                    <div>
                      <p className={selected ? 'text-manso-cream font-medium' : 'text-manso-cream/70'}>{dur.label}</p>
                      <p className="text-xs text-manso-cream/60">+${dur.precio.toLocaleString('es-AR')}</p>
                    </div>
                    {selected && <div className="ml-auto w-2 h-2 rounded-full bg-manso-terra shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Cuántas personas esperás?
            </h3>
            <div className="space-y-3">
              {capacidades.map((cap) => {
                const selected = capacidadId === cap.id;
                return (
                  <label key={cap.id} className={radioLabelCls(selected)}>
                    <input
                      type="radio"
                      name="cantidadPersonas"
                      value={cap.id}
                      checked={selected}
                      onChange={() => setCapacidadId(cap.id)}
                      className={radioCls}
                    />
                    <Users className={`w-5 h-5 mr-3 shrink-0 ${selected ? 'text-manso-terra' : 'text-manso-cream/50'}`} />
                    <div>
                      <p className={selected ? 'text-manso-cream font-medium' : 'text-manso-cream/70'}>{cap.label}</p>
                      <p className="text-xs text-manso-cream/60">
                        +${cap.precio.toLocaleString('es-AR')}
                      </p>
                    </div>
                    {selected && <div className="ml-auto w-2 h-2 rounded-full bg-manso-terra shrink-0" />}
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Qué servicios adicionales necesitás?
            </h3>
            <p className="text-manso-cream/60 text-sm -mt-4">Seleccioná todos los que apliquen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {servicios.map((serv) => {
                const checked = serviciosIds.includes(serv.id);
                return (
                  <label key={serv.id} className={radioLabelCls(checked)}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleServicio(serv.id)}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 border-2 rounded mr-3 shrink-0 flex items-center justify-center transition-colors ${
                      checked ? 'bg-manso-terra border-manso-terra' : 'border-manso-cream/30'
                    }`}>
                      {checked && <div className="w-2 h-2 bg-manso-cream rounded-full" />}
                    </div>
                    <div>
                      <p className="text-manso-cream">{serv.label}</p>
                      <p className="text-xs text-manso-cream/60">
                        +${serv.precio.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Cuándo querés realizar el evento?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Fecha</label>
                <input
                  type="date"
                  value={contacto.fecha}
                  onChange={(e) => setContacto(p => ({ ...p, fecha: e.target.value }))}
                  className={inputCls}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <label className={labelCls}>Hora de inicio</label>
                <input
                  type="time"
                  value={contacto.hora}
                  onChange={(e) => setContacto(p => ({ ...p, hora: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              Tus datos de contacto
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nombre completo</label>
                <input
                  type="text"
                  value={contacto.nombre}
                  onChange={(e) => setContacto(p => ({ ...p, nombre: e.target.value }))}
                  className={inputCls}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={contacto.email}
                  onChange={(e) => setContacto(p => ({ ...p, email: e.target.value }))}
                  className={inputCls}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  type="tel"
                  value={contacto.telefono}
                  onChange={(e) => setContacto(p => ({ ...p, telefono: e.target.value }))}
                  className={inputCls}
                  placeholder="+54 9 11 1234-5678"
                  required
                />
              </div>
            </div>

            {/* Resumen */}
            <div className="bg-manso-terra/10 border border-manso-terra/30 rounded-2xl p-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-black uppercase text-manso-cream">Resumen</h4>
                <Calculator className="w-6 h-6 text-manso-terra" />
              </div>
              <div className="space-y-2 text-sm">
                {tipoId && (
                  <div className="flex justify-between text-manso-cream/80">
                    <span>Tipo:</span>
                    <span>{tipos.find(t => t.id === tipoId)?.label}</span>
                  </div>
                )}
                {duracionId && (
                  <div className="flex justify-between text-manso-cream/80">
                    <span>Duración:</span>
                    <span>{duraciones.find(d => d.id === duracionId)?.label}</span>
                  </div>
                )}
                {capacidadId && (
                  <div className="flex justify-between text-manso-cream/80">
                    <span>Capacidad:</span>
                    <span>{capacidades.find(c => c.id === capacidadId)?.label}</span>
                  </div>
                )}
                {serviciosIds.length > 0 && (
                  <div className="flex justify-between text-manso-cream/80">
                    <span>Servicios adicionales:</span>
                    <span>{serviciosIds.length} seleccionados</span>
                  </div>
                )}
              </div>
              <div className="border-t border-manso-cream/20 mt-4 pt-4 flex justify-between items-center">
                <span className="text-lg font-black text-manso-cream">Precio estimado:</span>
                <span className="text-2xl font-black text-manso-terra">
                  ${precioEstimado.toLocaleString('es-AR')}
                </span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress bar */}
      <div className="flex items-center mb-8">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div key={step} className="flex items-center flex-1 last:flex-none">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all shrink-0 ${
              currentStep >= step
                ? 'bg-manso-terra text-manso-cream'
                : 'bg-manso-cream/10 text-manso-cream/40'
            }`}>
              {step}
            </div>
            {step < 6 && (
              <div className={`h-0.5 flex-1 mx-1 transition-all ${
                currentStep > step ? 'bg-manso-terra' : 'bg-manso-cream/10'
              }`} />
            )}
          </div>
        ))}
      </div>

      {renderStep()}

      {/* Navegación */}
      <div className="flex gap-4 pt-8">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 py-4 bg-manso-cream/10 border border-manso-cream/20 text-manso-cream font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-manso-cream/20 transition-all text-sm"
          >
            Anterior
          </button>
        )}
        {currentStep < 6 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={
              (currentStep === 1 && !tipoId) ||
              (currentStep === 2 && !duracionId) ||
              (currentStep === 3 && !capacidadId)
            }
            className="flex-1 py-4 bg-manso-terra text-manso-cream font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50 text-sm"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting || !contacto.nombre || !contacto.email || !contacto.telefono}
            className="flex-1 py-4 bg-manso-terra text-manso-cream font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? 'Enviando...' : 'Enviar cotización'}
          </button>
        )}
      </div>
    </form>
  );
}
