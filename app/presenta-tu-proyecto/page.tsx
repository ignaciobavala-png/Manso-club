'use client';

import { useState } from 'react';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import { supabase } from '@/lib/supabase';
import { CheckCircle } from 'lucide-react';
import { CotizadorForm } from '@/components/Cotizador/CotizadorForm';

const inputCls = "w-full bg-manso-cream/5 border border-manso-cream/15 rounded-2xl px-5 py-4 text-manso-cream placeholder:text-manso-cream/30 text-sm font-light focus:outline-none focus:border-manso-terra/60 transition-colors";
const labelCls = "block text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-2";

export default function PresentaTuProyectoPage() {
  const [loading, setLoading]   = useState(false);
  const [enviado, setEnviado]   = useState(false);
  const [error, setError]       = useState('');
  const [activeTab, setActiveTab] = useState<'propuesta' | 'cotizador'>('propuesta');
  const [form, setForm]         = useState({
    nombre:      '',
    email:       '',
    tipo:        'artista',
    descripcion: '',
    links:       '',
  });

  const set = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: dbError } = await supabase
      .from('propuestas')
      .insert({
        nombre:      form.nombre,
        email:       form.email,
        tipo:        form.tipo,
        descripcion: form.descripcion,
        links:       form.links || null,
      });

    if (dbError) {
      setError('Hubo un problema al enviar. Intentá de nuevo.');
    } else {
      setEnviado(true);
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />

      <div className="relative z-10 max-w-2xl mx-auto px-6 md:px-12 pt-40 pb-32">
        <p className="text-[9px] font-black uppercase tracking-[0.6em] text-manso-terra mb-6">
          Manso Club
        </p>
        <h1 className="text-[clamp(2.5rem,7vw,5rem)] font-black uppercase italic tracking-tighter leading-none text-manso-cream mb-6">
          Presentá tu<br />proyecto
        </h1>
        <p className="text-manso-cream/50 font-light text-base mb-8 leading-relaxed">
          ¿Querés mostrar tu trabajo en Manso o dar un taller en nuestras instalaciones?
          Contanos quién sos y qué tenés en mente.
        </p>

        {/* Navegación de pestañas */}
        <div className="flex gap-1 mb-12 p-1 bg-manso-cream/5 rounded-2xl">
          <button
            onClick={() => setActiveTab('propuesta')}
            className={`flex-1 py-3 px-6 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all ${
              activeTab === 'propuesta'
                ? 'bg-manso-terra text-manso-cream'
                : 'text-manso-cream/40 hover:text-manso-cream/60'
            }`}
          >
            Propuesta
          </button>
          <button
            onClick={() => setActiveTab('cotizador')}
            className={`flex-1 py-3 px-6 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all ${
              activeTab === 'cotizador'
                ? 'bg-manso-terra text-manso-cream'
                : 'text-manso-cream/40 hover:text-manso-cream/60'
            }`}
          >
            Cotizador
          </button>
        </div>

        {/* Contenido de la pestaña activa */}
        {activeTab === 'propuesta' ? (
          <>
          {enviado ? (
          <div className="flex flex-col items-start gap-6 py-16">
            <CheckCircle size={48} className="text-manso-terra" />
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-manso-cream">
              ¡Recibimos tu propuesta!
            </h2>
            <p className="text-manso-cream/60 font-light leading-relaxed">
              Nuestro equipo la va a revisar y te contactamos a la brevedad.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Nombre o Alias</label>
                <input
                  type="text"
                  placeholder="Tu nombre artístico"
                  className={inputCls}
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Email de contacto</label>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  className={inputCls}
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelCls}>Tipo de propuesta</label>
              <select
                className={inputCls}
                value={form.tipo}
                onChange={e => set('tipo', e.target.value)}
              >
                <option value="artista">Mostrarme como artista en Manso</option>
                <option value="taller">Dar un taller en las instalaciones</option>
                <option value="residencia">Residencia artística</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label className={labelCls}>Descripción del proyecto</label>
              <textarea
                rows={5}
                placeholder="Contanos qué hacés, qué querés proponer y por qué encaja con Manso..."
                className={`${inputCls} resize-none`}
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                required
                minLength={30}
              />
            </div>

            <div>
              <label className={labelCls}>Links (portfolio, redes, etc.) — opcional</label>
              <input
                type="text"
                placeholder="https://... o @usuario"
                className={inputCls}
                value={form.links}
                onChange={e => set('links', e.target.value)}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-manso-terra text-manso-cream font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm"
            >
              {loading ? 'Enviando...' : 'Enviar propuesta'}
            </button>
          </form>
        )}
          </>
        ) : (
          <div className="py-12">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              Cotizador de Eventos
            </h2>
            <p className="text-manso-cream/60 font-light leading-relaxed mb-8">
              Respondé estas preguntas para obtener una cotización personalizada para tu evento.
            </p>
            <CotizadorForm />
          </div>
        )}
      </div>
    </div>
  );
}
