'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface UseAdminFormOptions<T> {
  tableName: string;
  initialData: T;
  editEventName?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: any) => void;
  onReset?: () => void;
  transformData?: (data: T) => any;
  additionalFields?: Record<string, any>;
}

interface UseAdminFormReturn<T> {
  loading: boolean;
  editingId: string | null;
  formData: T;
  setFormData: React.Dispatch<React.SetStateAction<T>>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  handleCancel: () => void;
  setEditingId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useAdminForm<T extends Record<string, any>>(
  options: UseAdminFormOptions<T>
): UseAdminFormReturn<T> {
  const {
    tableName,
    initialData,
    editEventName,
    onSuccess,
    onError,
    onReset,
    transformData,
    additionalFields = {}
  } = options;

  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<T>(initialData);

  // Escuchar evento de edición
  useEffect(() => {
    if (!editEventName) return;

    const handleEditEvent = (event: CustomEvent) => {
      const item = event.detail;
      setEditingId(item.id);
      setFormData(item);
    };

    window.addEventListener(editEventName, handleEditEvent as EventListener);
    
    return () => {
      window.removeEventListener(editEventName, handleEditEvent as EventListener);
    };
  }, [editEventName]);

  const resetForm = () => {
    setEditingId(null);
    setFormData(initialData);
    onReset?.();
  };

  const handleCancel = () => {
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const dataToSubmit = transformData ? transformData(formData) : formData;
      const finalData = { ...dataToSubmit, ...additionalFields };

      if (editingId) {
        // Modo edición
        const { error } = await supabase
          .from(tableName)
          .update(finalData)
          .eq('id', editingId);

        if (error) throw error;
        
        const successMessage = `¡${tableName.replace('_', ' ').charAt(0).toUpperCase() + tableName.slice(1)} actualizado correctamente!`;
        onSuccess?.(successMessage) || alert(successMessage);
      } else {
        // Modo creación
        const { error } = await supabase.from(tableName).insert([finalData]);

        if (error) throw error;
        
        const successMessage = `¡${tableName.replace('_', ' ').charAt(0).toUpperCase() + tableName.slice(1)} agregado correctamente!`;
        onSuccess?.(successMessage) || alert(successMessage);
      }

      resetForm();

      // Invalidar el cache de Next.js para que la web pública se actualice
      fetch('/api/revalidate-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tableName }),
      }).catch(() => { /* no bloquear si falla */ });

      window.location.reload();
    } catch (error: any) {
      const errorMessage = error.message || 'Error al procesar la solicitud';
      onError?.(error) || alert(errorMessage);
    }
    
    setLoading(false);
  };

  return {
    loading,
    editingId,
    formData,
    setFormData,
    handleSubmit,
    resetForm,
    handleCancel,
    setEditingId
  };
}
