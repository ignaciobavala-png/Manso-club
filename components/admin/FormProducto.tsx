'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { Tag, DollarSign, Package, Plus, X } from 'lucide-react';
import { CATEGORIAS_TIENDA } from '@/lib/constants';

export function FormProducto() {
  const [loading, setLoading] = useState(false);
  const [categorias, setCategorias] = useState<string[]>([...CATEGORIAS_TIENDA]);
  const [catsConProductos, setCatsConProductos] = useState<Set<string>>(new Set());
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: CATEGORIAS_TIENDA[0] as string,
    precio: 0,
    imagen_url: ''
  });

  // Cargar categorias unicas desde la DB + las default
  useEffect(() => {
    async function fetchCategorias() {
      const { data } = await supabase
        .from('productos')
        .select('categoria');

      if (data) {
        const dbCats = [...new Set(data.map(p => p.categoria).filter(Boolean))] as string[];
        setCatsConProductos(new Set(dbCats));
        const defaultCats = [...CATEGORIAS_TIENDA] as string[];
        const merged = [...new Set([...defaultCats, ...dbCats])];
        setCategorias(merged);
      }
    }
    fetchCategorias();
  }, []);

  const handleAddCategory = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    if (categorias.includes(trimmed)) {
      alert('Esa categoria ya existe.');
      return;
    }
    setCategorias(prev => [...prev, trimmed]);
    setFormData({ ...formData, categoria: trimmed });
    setNewCatName('');
    setShowNewCat(false);
  };

  const handleDeleteCategory = (cat: string) => {
    if (catsConProductos.has(cat)) {
      alert(`No se puede eliminar "${cat}" porque tiene productos asociados.`);
      return;
    }
    const updated = categorias.filter(c => c !== cat);
    setCategorias(updated);
    if (formData.categoria === cat && updated.length > 0) {
      setFormData({ ...formData, categoria: updated[0] });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.imagen_url) {
      alert('Por favor, sube una imagen del producto.');
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('productos').insert([formData]);

    if (error) {
      alert(error.message);
    } else {
      alert('¡Producto sincronizado con la tienda!');
      setFormData({ 
        nombre: '', 
        categoria: categorias[0], 
        precio: 0, 
        imagen_url: '' 
      });
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-full sm:max-w-lg lg:max-w-2xl mx-auto bg-manso-cream/5 p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Zona de Carga de Imagen */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
            Imagen del Producto
          </label>
          <ImageUploader 
            bucket="products" 
            onUpload={(url) => setFormData({...formData, imagen_url: url})} 
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Nombre del Producto */}
          <div className="relative">
            <Package className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 sm:size-20" size={16} />
            <input 
              type="text" 
              placeholder="NOMBRE DEL ARTÍCULO"
              className="w-full bg-manso-cream/10 p-3 sm:p-4 pl-10 sm:pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all text-sm sm:text-base"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              required
            />
          </div>

          {/* Categoria: chips con X para borrar */}
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2 flex items-center gap-2">
              <Tag size={14} /> Categoria
            </p>
            <div className="flex flex-wrap gap-1 sm:gap-2">
              {categorias.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData({...formData, categoria: cat})}
                  className={`group flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all border ${
                    formData.categoria === cat
                      ? 'bg-manso-terra text-manso-cream border-manso-terra'
                      : 'bg-manso-cream/10 text-manso-cream/60 border-manso-cream/20 hover:border-manso-cream/40'
                  }`}
                >
                  {cat}
                  {!catsConProductos.has(cat) && (
                    <span
                      onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                      className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
                      title="Eliminar categoria"
                    >
                      <X size={8} className="sm:size-10" />
                    </span>
                  )}
                  {catsConProductos.has(cat) && (
                    <span className="ml-1 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-green-400 rounded-full" title="Tiene productos"></span>
                  )}
                </button>
              ))}
            </div>

            {!showNewCat ? (
              <button
                type="button"
                onClick={() => setShowNewCat(true)}
                className="flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-manso-terra hover:text-manso-cream transition-colors ml-2"
              >
                <Plus size={10} className="sm:size-12" /> Nueva categoria
              </button>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nombre de la categoria"
                  className="flex-1 bg-manso-cream/10 p-2 sm:p-3 rounded-xl border border-manso-terra/30 outline-none text-[10px] sm:text-xs font-bold text-manso-cream placeholder:text-manso-cream/40 focus:ring-2 focus:ring-manso-terra"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="px-2 sm:px-3 py-2 bg-manso-terra text-manso-cream rounded-xl text-[8px] sm:text-[9px] font-black uppercase hover:bg-manso-cream hover:text-manso-black transition-all"
                >
                  Crear
                </button>
                <button
                  type="button"
                  onClick={() => { setShowNewCat(false); setNewCatName(''); }}
                  className="px-2 sm:px-3 py-2 bg-manso-cream/10 text-manso-cream/60 rounded-xl text-[8px] sm:text-[9px] font-black uppercase hover:bg-manso-cream/20 transition-all"
                >
                  X
                </button>
              </div>
            )}
          </div>

          {/* Precio en Moneda */}
          <div className="relative">
            <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 sm:size-20" size={16} />
            <input 
              type="number" 
              placeholder="PRECIO"
              className="w-full bg-manso-cream/10 p-3 sm:p-4 pl-10 sm:pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono font-bold text-manso-cream placeholder:text-manso-cream/40 text-sm sm:text-base"
              value={formData.precio === 0 ? '' : formData.precio}
              onChange={e => setFormData({...formData, precio: Number(e.target.value)})}
              required
            />
          </div>
        </div>

        {/* Boton de Accion */}
        <button 
          disabled={loading}
          className="w-full bg-manso-terra text-manso-cream py-4 sm:py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? 'PROCESANDO...' : 'PUBLICAR PRODUCTO'}
        </button>
      </form>
    </div>
  );
}