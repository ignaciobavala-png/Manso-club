import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { ImageUploader } from './ImageUploader'; // Importamos el nuevo componente

export function FormEvento() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    fecha: '',
    descripcion: '',
    imagen_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await supabase.from('eventos').insert([formData]);

    if (error) alert(error.message);
    else {
      alert('¡Evento publicado en Manso Club!');
      setFormData({ titulo: '', fecha: '', descripcion: '', imagen_url: '' });
      window.location.reload(); // Recargamos para limpiar
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-200/50">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Aquí integramos el Drag & Drop */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Flyer / Arte del evento</label>
          <ImageUploader 
            onUpload={(url) => setFormData({...formData, imagen_url: url})} 
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <input 
            type="text" 
            placeholder="TÍTULO DEL EVENTO"
            className="w-full text-2xl font-black bg-zinc-50 p-4 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none"
            value={formData.titulo}
            onChange={e => setFormData({...formData, titulo: e.target.value})}
            required
          />
          
          <input 
            type="datetime-local"
            className="w-full p-4 bg-zinc-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none font-mono text-sm"
            value={formData.fecha}
            onChange={e => setFormData({...formData, fecha: e.target.value})}
            required
          />

          <textarea 
            placeholder="DESCRIPCIÓN Y LINE UP"
            className="w-full p-4 bg-zinc-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-500 outline-none h-32 resize-none"
            value={formData.descripcion}
            onChange={e => setFormData({...formData, descripcion: e.target.value})}
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Subiendo...' : 'Publicar en Agenda'}
        </button>
      </form>
    </div>
  );
}