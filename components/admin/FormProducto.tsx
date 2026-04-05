'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ImageUploader } from './ImageUploader';
import { Tag, DollarSign, Package, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { CATEGORIAS_TIENDA } from '@/lib/constants';

export function FormProducto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [categorias, setCategorias] = useState<string[]>([...CATEGORIAS_TIENDA]);
  const [catsConProductos, setCatsConProductos] = useState<Set<string>>(new Set());
  const [showNewCat, setShowNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: CATEGORIAS_TIENDA[0] as string,
    precio: 0,
    descripcion: '',
    imagenes_urls: [] as string[],
    stock: 10 // Stock por defecto
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
      setError('Esa categoria ya existe.');
      return;
    }
    setCategorias(prev => [...prev, trimmed]);
    setFormData({ ...formData, categoria: trimmed });
    setNewCatName('');
    setShowNewCat(false);
    setError(null);
  };

  const handleDeleteCategory = (cat: string) => {
    if (catsConProductos.has(cat)) {
      setError(`No se puede eliminar "${cat}" porque tiene productos asociados.`);
      return;
    }
    const updated = categorias.filter(c => c !== cat);
    setCategorias(updated);
    if (formData.categoria === cat && updated.length > 0) {
      setFormData({ ...formData, categoria: updated[0] });
    }
    setError(null);
  };

  const loadProductForEdit = (product: any) => {
    setIsEditing(true);
    setEditingId(product.id);
    setFormData({
      nombre: product.nombre || '',
      categoria: product.categoria || CATEGORIAS_TIENDA[0],
      precio: product.precio || 0,
      descripcion: product.descripcion || '',
      imagenes_urls: product.imagenes_urls || [],
      stock: product.stock || 10 // Stock por defecto si no existe
    });
    setError(null);
    setSuccess(false);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      nombre: '',
      categoria: categorias[0] || CATEGORIAS_TIENDA[0],
      precio: 0,
      descripcion: '',
      imagenes_urls: [],
      stock: 10 // Stock por defecto
    });
    setError(null);
    setSuccess(false);
  };

  // Exponer función de edición globalmente
  useEffect(() => {
    (window as any).editProduct = loadProductForEdit;
    return () => {
      delete (window as any).editProduct;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validaciones
    if (!formData.nombre.trim()) {
      setError('Por favor, ingresa el nombre del producto.');
      return;
    }
    
    if (!formData.imagenes_urls || formData.imagenes_urls.length === 0) {
      setError('Por favor, sube al menos una imagen del producto.');
      return;
    }
    
    if (formData.precio <= 0) {
      setError('Por favor, ingresa un precio válido mayor a 0.');
      return;
    }

    setLoading(true);

    let dbError;
    if (isEditing && editingId) {
      // Actualizar producto existente
      ({ error: dbError } = await supabase
        .from('productos')
        .update(formData)
        .eq('id', editingId));
    } else {
      // Crear nuevo producto
      ({ error: dbError } = await supabase
        .from('productos')
        .insert([formData]));
    }

    if (dbError) {
      setError(dbError.message);
    } else {
      setSuccess(true);
      resetForm();
      window.dispatchEvent(new CustomEvent('dashboardRefresh'));
      
      // Ocultar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(false), 3000);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-full sm:max-w-lg lg:max-w-2xl mx-auto bg-manso-cream/5 p-4 sm:p-6 lg:p-8 rounded-[2.5rem] border border-manso-cream/10 shadow-xl">
      {/* Header con indicador de modo edición */}
      <div className="mb-6">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-manso-cream mb-2">
          {isEditing ? 'EDITAR PRODUCTO' : 'NUEVO PRODUCTO'}
        </h2>
        <p className="text-sm text-manso-cream/60">
          {isEditing ? 'Modifica los datos del producto seleccionado' : 'Agrega un nuevo producto a la tienda'}
        </p>
        {isEditing && (
          <button
            type="button"
            onClick={resetForm}
            className="mt-3 text-xs text-manso-terra hover:text-manso-cream transition-colors"
          >
            ← Cancelar edición
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Banners de Error y Success */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-2xl flex items-center gap-3">
            <AlertCircle size={16} className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}
        
        {success && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-3 rounded-2xl flex items-center gap-3">
            <CheckCircle size={16} className="w-4 h-4" />
            <span className="text-sm font-medium">
              {isEditing ? '¡Producto actualizado correctamente!' : '¡Producto sincronizado con la tienda!'}
            </span>
          </div>
        )}
        
        {/* Zona de Carga de Imágenes */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
            Imágenes del Producto ({formData.imagenes_urls.length}/5)
          </label>
          <div className="space-y-3">
            <ImageUploader 
              bucket="products" 
              onUpload={(url) => {
                if (formData.imagenes_urls.length < 5) {
                  setFormData({...formData, imagenes_urls: [...formData.imagenes_urls, url]});
                  setError(null); // Limpiar error al subir imagen exitosamente
                } else {
                  setError('Máximo 5 imágenes por producto');
                }
              }} 
            />
            
            {/* Previsualización de imágenes cargadas */}
            {formData.imagenes_urls.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {formData.imagenes_urls.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-20 object-cover rounded-lg border border-manso-cream/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newUrls = formData.imagenes_urls.filter((_, i) => i !== index);
                        setFormData({...formData, imagenes_urls: newUrls});
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    >
                      <X size={12} className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {/* Nombre del Producto */}
          <div className="relative">
            <Package className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 w-4 h-4" size={16} />
            <input 
              type="text" 
              placeholder="NOMBRE DEL ARTÍCULO"
              className="w-full bg-manso-cream/10 p-3 sm:p-4 pl-10 sm:pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all text-sm sm:text-base"
              value={formData.nombre}
              onChange={e => {
                setFormData({...formData, nombre: e.target.value});
                setError(null); // Limpiar error al escribir
              }}
              required
            />
          </div>

          {/* Descripción del Producto */}
          <div className="relative">
            <textarea 
              placeholder="BREVE DESCRIPCIÓN DEL PRODUCTO (opcional)"
              className="w-full bg-manso-cream/10 p-3 sm:p-4 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-medium text-manso-cream placeholder:text-manso-cream/40 transition-all text-sm sm:text-base resize-none h-20"
              value={formData.descripcion}
              onChange={e => {
                setFormData({...formData, descripcion: e.target.value});
                setError(null); // Limpiar error al escribir
              }}
              maxLength={200}
            />
            <div className="text-[8px] text-manso-cream/40 text-right mt-1">
              {formData.descripcion.length}/200 caracteres
            </div>
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
                      <X size={12} className="w-3 h-3" />
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
                <Plus size={14} className="w-4 h-4" /> Nueva categoria
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
            <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 w-4 h-4" size={16} />
            <input 
              type="number" 
              placeholder="PRECIO"
              className="w-full bg-manso-cream/10 p-3 sm:p-4 pl-10 sm:pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono font-bold text-manso-cream placeholder:text-manso-cream/40 text-sm sm:text-base"
              value={formData.precio === 0 ? '' : formData.precio}
              onChange={e => {
                setFormData({...formData, precio: Number(e.target.value)});
                setError(null); // Limpiar error al escribir precio
              }}
              required
            />
          </div>

          {/* Stock */}
          <div className="relative">
            <Package className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 w-4 h-4" size={16} />
            <input 
              type="number" 
              placeholder="STOCK"
              className="w-full bg-manso-cream/10 p-3 sm:p-4 pl-10 sm:pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono font-bold text-manso-cream placeholder:text-manso-cream/40 text-sm sm:text-base"
              value={formData.stock === 0 ? '' : formData.stock}
              onChange={e => {
                setFormData({...formData, stock: Number(e.target.value)});
                setError(null); // Limpiar error al escribir stock
              }}
              min="0"
              required
            />
          </div>
        </div>

        {/* Boton de Accion */}
        <button 
          disabled={loading}
          className="w-full bg-manso-terra text-manso-cream py-4 sm:py-5 rounded-3xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm sm:text-base"
        >
          {loading ? 'PROCESANDO...' : isEditing ? 'ACTUALIZAR PRODUCTO' : 'PUBLICAR PRODUCTO'}
        </button>
      </form>
    </div>
  );
}