'use client';

import { useState } from 'react';
import { Briefcase, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useAdminForm } from '@/hooks/useAdminForm';

const initialData = {
  area: '',
  descripcion: '',
  activo: true,
  orden: 0,
};

export function FormOfertaEmpleo() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { loading, editingId, formData, setFormData, handleSubmit, handleCancel } =
    useAdminForm({
      tableName: 'ofertas_empleo',
      initialData,
      editEventName: 'editOfertaEmpleo',
      onSuccess: (msg) => {
        setSuccessMsg(msg);
        setTimeout(() => setSuccessMsg(null), 3000);
      },
      onError: (err) => setErrorMsg(err.message),
    });

  return (
    <div className="bg-manso-cream/5 p-4 md:p-6 rounded-[2rem] border border-manso-cream/10 shadow-xl">
      <div className="mb-5">
        <h2 className="text-lg md:text-xl font-black uppercase tracking-tighter text-manso-cream mb-1">
          {editingId ? 'Editar Oferta' : 'Nueva Oferta de Empleo'}
        </h2>
        <p className="text-xs text-manso-cream/60">
          Las ofertas activas se muestran en la página "Trabajá con nosotros".
        </p>
      </div>

      {errorMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
          <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
          <p className="text-red-300 text-xs flex-1">{errorMsg}</p>
          <button onClick={() => setErrorMsg(null)}><X size={14} className="text-red-400" /></button>
        </div>
      )}

      {successMsg && (
        <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg">
          <CheckCircle className="text-green-400 flex-shrink-0" size={16} />
          <p className="text-green-300 text-xs flex-1">{successMsg}</p>
          <button onClick={() => setSuccessMsg(null)}><X size={14} className="text-green-400" /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <Briefcase className="absolute left-3 top-3 text-manso-cream/40" size={16} />
          <input
            type="text"
            placeholder="Área (ej: Producción, Comunicación...)"
            value={formData.area}
            onChange={(e) => setFormData((p) => ({ ...p, area: e.target.value }))}
            required
            className="w-full bg-manso-cream/10 p-3 pl-9 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/30 text-sm font-medium"
          />
        </div>

        <textarea
          placeholder="Descripción del puesto..."
          value={formData.descripcion}
          onChange={(e) => setFormData((p) => ({ ...p, descripcion: e.target.value }))}
          required
          rows={4}
          className="w-full bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/30 text-sm font-medium resize-none"
        />

        <div className="flex items-center gap-3">
          <input
            type="number"
            placeholder="Orden (1, 2, 3...)"
            value={formData.orden}
            onChange={(e) => setFormData((p) => ({ ...p, orden: parseInt(e.target.value) || 0 }))}
            className="w-32 bg-manso-cream/10 p-3 rounded-xl border border-manso-cream/20 focus:ring-2 focus:ring-manso-terra outline-none text-manso-cream placeholder:text-manso-cream/30 text-sm font-medium"
          />
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setFormData((p) => ({ ...p, activo: !p.activo }))}
              className={`w-10 h-5 rounded-full transition-colors ${formData.activo ? 'bg-manso-terra' : 'bg-manso-cream/20'} relative`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${formData.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            <span className="text-xs text-manso-cream/70 font-medium">{formData.activo ? 'Activo' : 'Inactivo'}</span>
          </label>
        </div>

        <div className="flex gap-3">
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 border border-manso-cream/20 text-manso-cream/60 py-3 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream/10 transition-all text-sm"
            >
              Cancelar
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-manso-terra text-manso-cream py-3 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-manso-cream hover:text-manso-black transition-all active:scale-95 disabled:opacity-50 text-sm"
          >
            {loading ? 'GUARDANDO...' : editingId ? 'ACTUALIZAR' : 'PUBLICAR OFERTA'}
          </button>
        </div>
      </form>
    </div>
  );
}
