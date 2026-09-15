'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CompactImageUploader } from './CompactImageUploader';
import { VisibilidadToggle } from './VisibilidadToggle';
import { Tag, DollarSign, Package, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import { CATEGORIAS_TIENDA } from '@/lib/constants';
import { useCurrency } from '@/store/useCurrency';
import { convertir, formatArs, formatUsd, type Moneda } from '@/lib/precios';

/** Fotos por producto. El carrusel de la tienda las rota en este orden. */
const MAX_FOTOS = 5;

/**
 * Umbrales para avisar que el precio parece cargado en la otra moneda.
 *
 * Nada del catálogo real llega a los cuatro dígitos en dólares ni baja de los
 * cuatro dígitos en pesos, así que un número fuera de rango casi siempre es la
 * moneda equivocada: una mochila cargada como 40000 con el selector en USD, o
 * como 40 con el selector en pesos.
 */
const PRECIO_USD_SOSPECHOSO = 1000;
const PRECIO_ARS_SOSPECHOSO = 1000;

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
    moneda: 'USD' as Moneda,
    descripcion: '',
    imagenes_urls: [] as string[],
    stock: 10,
    visibilidad: 'publico' as 'publico' | 'registrado' | 'miembro',
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
      moneda: (product.moneda === 'ARS' ? 'ARS' : 'USD') as Moneda,
      descripcion: product.descripcion || '',
      imagenes_urls: product.imagenes_urls || [],
      stock: product.stock || 10,
      visibilidad: product.visibilidad ?? 'publico',
    });
    setError(null);
    setSuccess(false);
  };

  /**
   * Escribe una foto en un hueco del producto (o la saca, con `url` en null).
   *
   * El array se compacta —nada de huecos en el medio— para que el orden del
   * panel sea el mismo que el del carrusel de la tienda y la primera siga
   * siendo la portada.
   */
  const cambiarFoto = (slot: number, url: string | null) => {
    setFormData(prev => {
      const fotos = [...prev.imagenes_urls];
      if (url) fotos[slot] = url;
      else fotos.splice(slot, 1);
      return { ...prev, imagenes_urls: fotos.filter(Boolean).slice(0, MAX_FOTOS) };
    });
    setError(null);
  };

  const resetForm = () => {
    setIsEditing(false);
    setEditingId(null);
    // La moneda se conserva: quien carga diez productos en pesos no tiene que
    // volver a elegirla en cada uno.
    setFormData(prev => ({
      nombre: '',
      categoria: categorias[0] || CATEGORIAS_TIENDA[0],
      precio: 0,
      moneda: prev.moneda,
      descripcion: '',
      imagenes_urls: [],
      stock: 10,
      visibilidad: 'publico' as 'publico' | 'registrado' | 'miembro',
    }));
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

  // La cotización es sólo informativa acá: el cobro real la recalcula en el
  // servidor (`lib/dolar.ts`), nunca con lo que diga el navegador.
  const { rate, fetchRate } = useCurrency();

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  const esDolares = formData.moneda === 'USD';
  const otraMoneda: Moneda = esDolares ? 'ARS' : 'USD';

  // El precio traducido a la otra moneda, para que se vea qué se va a publicar.
  const equivalente =
    formData.precio > 0
      ? convertir(formData.precio, formData.moneda, otraMoneda, rate)
      : null;
  const equivalenteTexto =
    equivalente === null ? null : otraMoneda === 'ARS' ? formatArs(equivalente) : formatUsd(equivalente);
  const precioTexto = esDolares ? formatUsd(formData.precio) : formatArs(formData.precio);

  const precioSospechoso = esDolares
    ? formData.precio >= PRECIO_USD_SOSPECHOSO
    : formData.precio > 0 && formData.precio < PRECIO_ARS_SOSPECHOSO;

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
        
        {/* Fotos del producto: un hueco por foto */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
            Fotos del producto ({formData.imagenes_urls.length}/{MAX_FOTOS})
          </label>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
            {Array.from({ length: MAX_FOTOS }, (_, slot) => {
              const url = formData.imagenes_urls[slot] ?? null;
              // Solo se habilita el hueco siguiente al último cargado: así el
              // array no queda con agujeros.
              const habilitado = slot <= formData.imagenes_urls.length;

              return (
                <div key={slot} className="relative">
                  {habilitado ? (
                    <CompactImageUploader
                      // La key fuerza el remonte al borrar, reemplazar o pasar
                      // a editar otro producto: el preview es estado interno
                      // del uploader.
                      key={`${editingId ?? 'nuevo'}-${url ?? `vacio-${slot}-${formData.imagenes_urls.length}`}`}
                      bucket="products"
                      height="h-20"
                      initialPreview={url}
                      onUpload={nueva => cambiarFoto(slot, nueva)}
                    />
                  ) : (
                    <div className="w-full h-20 rounded-xl border-2 border-dashed border-manso-cream/10 bg-manso-cream/[0.02]" />
                  )}

                  {url && (
                    <>
                      <button
                        type="button"
                        onClick={() => cambiarFoto(slot, null)}
                        title="Quitar foto"
                        className="absolute top-1 right-1 z-10 w-5 h-5 flex items-center justify-center rounded-md bg-manso-black/70 text-manso-cream/70 hover:text-manso-terra hover:bg-manso-black transition-colors"
                      >
                        <X size={11} />
                      </button>
                      {slot === 0 && (
                        <span className="absolute bottom-1 left-1 z-10 px-1.5 py-0.5 rounded bg-manso-black/70 text-[8px] font-black uppercase tracking-widest text-manso-cream/70">
                          Portada
                        </span>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-[10px] text-manso-cream/30 ml-2 leading-relaxed">
            La primera foto es la portada: es la que sale en la grilla de la
            tienda. Las demás se pasan con las flechas en la ficha del producto.
          </p>
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

          {/* Precio: se carga en la moneda de referencia que se elija */}
          <div className="space-y-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
              Precio de referencia
            </p>

            {/* Moneda: la que se elige acá es la que queda fija en la tienda */}
            <div className="flex gap-2">
              {([
                { id: 'USD' as Moneda, label: 'Dólares' },
                { id: 'ARS' as Moneda, label: 'Pesos' },
              ]).map(op => (
                <button
                  key={op.id}
                  type="button"
                  onClick={() => { setFormData({ ...formData, moneda: op.id }); setError(null); }}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                    formData.moneda === op.id
                      ? 'bg-manso-terra text-manso-cream border-manso-terra'
                      : 'bg-manso-cream/10 text-manso-cream/60 border-manso-cream/20 hover:border-manso-cream/40'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-manso-cream/60 w-4 h-4" size={16} />
              <input 
                type="number" 
                placeholder={esDolares ? 'PRECIO EN DÓLARES' : 'PRECIO EN PESOS'}
                className="w-full bg-manso-cream/10 p-3 sm:p-4 pl-10 sm:pl-12 rounded-2xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-mono font-bold text-manso-cream placeholder:text-manso-cream/40 text-sm sm:text-base"
                value={formData.precio === 0 ? '' : formData.precio}
                onChange={e => {
                  setFormData({...formData, precio: Number(e.target.value)});
                  setError(null); // Limpiar error al escribir precio
                }}
                required
              />
            </div>

            {precioSospechoso ? (
              <p className="text-[10px] font-bold text-manso-terra ml-2 leading-relaxed flex items-start gap-1.5">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>
                  ¿Seguro? Este precio está cargado en {esDolares ? 'dólares' : 'pesos'}:{' '}
                  {precioTexto} se publica como {equivalenteTexto ?? '—'} en la otra moneda.
                </span>
              </p>
            ) : (
              <p className="text-[10px] text-manso-cream/30 ml-2 leading-relaxed">
                {esDolares
                  ? 'Los dólares quedan fijos y los pesos se recalculan con el blue.'
                  : 'Los pesos quedan fijos y los dólares se recalculan con el blue.'}
                {' '}En la tienda se ve en la moneda que elija cada persona.
                {equivalenteTexto && formData.precio > 0 && ` Hoy, ${precioTexto} son ${equivalenteTexto}.`}
              </p>
            )}
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

        {/* Visibilidad */}
        <VisibilidadToggle
          value={formData.visibilidad}
          onChange={v => setFormData(f => ({ ...f, visibilidad: v }))}
        />

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