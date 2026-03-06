'use client';

import { useState, useEffect } from 'react';
import { getAboutUs, updateAboutUs, uploadAboutUsPhoto, deleteAboutUsPhoto, AboutUsContent } from '@/lib/aboutUs';
import { CompactImageUploader } from './CompactImageUploader';
import { FileText, Image as ImageIcon, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';

export function FormAboutUs() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [aboutUsData, setAboutUsData] = useState<AboutUsContent | null>(null);
  const [imageKeys, setImageKeys] = useState({
    main: 0,
    gallery: 0
  });
  const [formData, setFormData] = useState({
    subtitle: '',
    description: '',
    main_photo_url: '',
    gallery_photos: [] as string[]
  });

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAboutUs();
        setAboutUsData(data);
        setFormData({
          subtitle: data.subtitle,
          description: data.description,
          main_photo_url: data.main_photo_url || '',
          gallery_photos: data.gallery_photos || []
        });
      } catch (error: any) {
        setError(error.message);
      }
    };
    fetchData();
  }, []);

  const resetError = () => setError(null);
  const resetSuccess = () => setSuccess(false);

  // Validar formulario
  const validateForm = (): boolean => {
    if (!formData.subtitle.trim()) {
      setError('El subtítulo es requerido');
      return false;
    }

    if (!formData.description.trim() || formData.description.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres');
      return false;
    }

    if (!formData.main_photo_url) {
      setError('La foto principal es requerida');
      return false;
    }

    if (formData.gallery_photos.length > 3) {
      setError('La galería puede tener máximo 3 fotos');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    if (!aboutUsData) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateAboutUs({
        id: aboutUsData.id,
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        main_photo_url: formData.main_photo_url,
        gallery_photos: formData.gallery_photos
      });

      // Revalidar página
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/about' })
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      setError(error.message);
    }

    setLoading(false);
  };

  const handleMainPhotoUpload = async (url: string) => {
    setFormData({ ...formData, main_photo_url: url });
    setImageKeys({ ...imageKeys, main: imageKeys.main + 1 });
  };

  const handleMainPhotoDelete = async () => {
    if (formData.main_photo_url) {
      try {
        // Eliminar del storage
        await deleteAboutUsPhoto(formData.main_photo_url, 'main');
        
        // Actualizar la base de datos para remover la URL
        if (aboutUsData) {
          await updateAboutUs({
            id: aboutUsData.id,
            subtitle: formData.subtitle,
            description: formData.description,
            main_photo_url: '', // Limpiar la URL
            gallery_photos: formData.gallery_photos
          });
        }
        
        setFormData({ ...formData, main_photo_url: '' });
        setImageKeys({ ...imageKeys, main: imageKeys.main + 1 });
        
        // Revalidar página
        await fetch('/api/revalidate-internal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: '/about' })
        });
        
        // Mostrar éxito
        setSuccess(true);
        setTimeout(() => setSuccess(false), 2000);
      } catch (error: any) {
        setError(error.message);
      }
    }
  };

  const handleGalleryPhotoUpload = async (url: string) => {
    if (formData.gallery_photos.length >= 3) {
      setError('La galería puede tener máximo 3 fotos');
      return;
    }
    setFormData({ 
      ...formData, 
      gallery_photos: [...formData.gallery_photos, url] 
    });
    setImageKeys({ ...imageKeys, gallery: imageKeys.gallery + 1 });
  };

  const handleGalleryPhotoDelete = async (index: number) => {
    const photoToDelete = formData.gallery_photos[index];
    try {
      // Eliminar del storage
      await deleteAboutUsPhoto(photoToDelete, 'gallery');
      
      // Actualizar la base de datos
      const updatedGalleryPhotos = formData.gallery_photos.filter((_, i) => i !== index);
      if (aboutUsData) {
        await updateAboutUs({
          id: aboutUsData.id,
          subtitle: formData.subtitle,
          description: formData.description,
          main_photo_url: formData.main_photo_url,
          gallery_photos: updatedGalleryPhotos
        });
      }
      
      setFormData({
        ...formData,
        gallery_photos: updatedGalleryPhotos
      });
      setImageKeys({ ...imageKeys, gallery: imageKeys.gallery + 1 });
      
      // Revalidar página
      await fetch('/api/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/about' })
      });
      
      // Mostrar éxito
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (error: any) {
      setError(error.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-manso-cream/5 p-4 md:p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl">
        <div className="mb-4 md:mb-6">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-manso-cream mb-1">
            Editar About Us
          </h2>
          <p className="text-xs text-manso-cream/60">
            Modifica el contenido de la sección About Us
          </p>
        </div>

        {/* Banners compactos */}
        {error && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
            <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
            <p className="text-red-300 text-xs flex-1">{error}</p>
            <button onClick={resetError} className="text-red-400 hover:text-red-300">
              <X size={14} />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
            <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
            <p className="text-green-300 text-xs flex-1">¡About Us actualizado!</p>
            <button onClick={resetSuccess} className="text-green-400 hover:text-green-300">
              <X size={14} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
            {/* Subtítulo */}
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/60" size={18} />
              <input 
                type="text" 
                placeholder="SUBTÍTULO"
                className="w-full bg-manso-cream/10 p-3 pl-10 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-bold text-manso-cream placeholder:text-manso-cream/40 transition-all text-sm"
                value={formData.subtitle}
                onChange={e => setFormData({...formData, subtitle: e.target.value})}
                required
              />
            </div>

            {/* Layout de Foto Principal y Descripción */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Columna izquierda: Foto Principal */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
                  Foto Principal <span className="text-red-400">*</span>
                </label>
                {formData.main_photo_url ? (
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden">
                    <img
                      src={formData.main_photo_url}
                      alt="Foto principal actual"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleMainPhotoDelete}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1 rounded-full hover:bg-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <div className="aspect-[4/3] bg-manso-cream/10 rounded-lg border border-manso-cream/20 flex items-center justify-center">
                    <p className="text-xs text-manso-cream/60 text-center">
                      📷 Sube una foto principal
                    </p>
                  </div>
                )}
                <div className="h-20">
                  <CompactImageUploader
                    key={imageKeys.main}
                    bucket="team-photos"
                    folder="about-main"
                    maxWidth={1200}
                    onUpload={handleMainPhotoUpload}
                    height="h-20"
                  />
                </div>
              </div>

              {/* Columna derecha: Descripción */}
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
                  Descripción (mínimo 10 caracteres)
                </label>
                <div className="relative">
                  <textarea
                    placeholder="Describe qué es Manso Club..."
                    className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none font-medium text-manso-cream placeholder:text-manso-cream/40 transition-all resize-none min-h-[200px] max-h-[400px] overflow-y-auto text-sm"
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    required
                    minLength={10}
                  />
                </div>
                <p className="text-[10px] text-manso-cream/40 text-right">
                  {formData.description.length} caracteres
                </p>
              </div>
            </div>

            {/* Galería de Fotos */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-manso-cream/60 ml-2">
                Galería de Fotos (máximo 3)
              </label>
              
              {formData.gallery_photos.length === 0 && (
                <div className="p-3 bg-manso-cream/10 rounded-lg border border-manso-cream/20">
                  <p className="text-xs text-manso-cream/60 text-center">
                    🖼️ Sube hasta 3 fotos para la galería de About
                  </p>
                </div>
              )}
              
              {/* Grid de fotos actuales */}
              {formData.gallery_photos.length > 0 && (
                <div className="grid grid-cols-3 gap-1 mb-2 max-h-20 overflow-hidden">
                  {formData.gallery_photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded overflow-hidden group">
                      <img
                        src={photo}
                        alt={`Galería ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleGalleryPhotoDelete(index)}
                        className="absolute top-1 right-1 bg-red-500/80 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload buttons compactos */}
              {formData.gallery_photos.length < 3 && (
                <div className="flex gap-1">
                  {Array.from({ length: 3 - formData.gallery_photos.length }, (_, i) => (
                    <div key={i} className="flex-1">
                      <div className="h-14">
                        <CompactImageUploader
                          key={`${imageKeys.gallery}-${i}`}
                          bucket="team-photos"
                          folder="about-gallery"
                          maxWidth={800}
                          onUpload={handleGalleryPhotoUpload}
                          height="h-14"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botón Guardar */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-manso-terra text-manso-cream py-3 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm"
            >
              {loading ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
            </button>
        </form>
      </div>
    </div>
  );
}
