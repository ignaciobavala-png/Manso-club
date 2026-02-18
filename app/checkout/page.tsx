'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '../../store/useCart';
import { ArrowLeft, CreditCard, User, Mail, Phone, ShoppingBag, Check } from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, total } = useCart();
  
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Si no hay items, redirigir al home
  if (items.length === 0) {
    router.push('/');
    return null;
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.nombre.trim()) {
      newErrors.nombre = 'El nombre es requerido';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    if (!formData.telefono.trim()) {
      newErrors.telefono = 'El teléfono es requerido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Preparar items para la API
      const orderItems = items.map(item => ({
        id: item.id,
        nombre: item.nombre,
        precio: item.precio,
        cantidad: item.quantity,
        tipo: 'producto' as const, // Por ahora todos son productos
      }));

      // Crear preferencia de pago
      const response = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: orderItems,
          email: formData.email,
          nombre: formData.nombre,
          telefono: formData.telefono,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al procesar el pago');
      }

      // Redirigir a Mercado Pago
      window.location.href = result.init_point;

    } catch (error) {
      console.error('Error en checkout:', error);
      setErrors({ 
        general: error instanceof Error ? error.message : 'Error al procesar el pago' 
      });
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      // Remover item si cantidad es 0 o menos
      const { removeItem } = useCart.getState();
      removeItem(id);
    } else {
      // Actualizar cantidad
      const { items, addItem } = useCart.getState();
      const item = items.find(i => i.id === id);
      if (item) {
        // Limpiar carrito y agregar con nueva cantidad
        useCart.setState({ items: [] });
        for (let i = 0; i < quantity; i++) {
          addItem(item);
        }
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-manso-cream/60 hover:text-manso-cream transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Volver</span>
          </button>
          
          <div className="flex items-center gap-2">
            <ShoppingBag className="text-manso-cream" size={24} />
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tighter uppercase text-manso-cream">
              Checkout
            </h1>
          </div>
          
          <div className="w-20" /> {/* Spacer */}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Columna Izquierda - Formulario */}
          <div className="lg:col-span-7">
            <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl font-bold text-manso-cream mb-6 flex items-center gap-3">
                <User size={24} />
                Datos del Comprador
              </h2>

              {errors.general && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-400">{errors.general}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-manso-cream mb-2">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <User size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
                    <input
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-manso-black/50 border rounded-xl text-manso-cream placeholder-manso-cream/40 focus:outline-none focus:border-manso-cream/40 transition-colors ${
                        errors.nombre ? 'border-red-500/50' : 'border-manso-cream/20'
                      }`}
                      placeholder="Juan Pérez"
                    />
                  </div>
                  {errors.nombre && (
                    <p className="mt-1 text-xs text-red-400">{errors.nombre}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-manso-cream mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-manso-black/50 border rounded-xl text-manso-cream placeholder-manso-cream/40 focus:outline-none focus:border-manso-cream/40 transition-colors ${
                        errors.email ? 'border-red-500/50' : 'border-manso-cream/20'
                      }`}
                      placeholder="juan@ejemplo.com"
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-400">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-manso-cream mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-manso-cream/40" />
                    <input
                      type="tel"
                      value={formData.telefono}
                      onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                      className={`w-full pl-10 pr-4 py-3 bg-manso-black/50 border rounded-xl text-manso-cream placeholder-manso-cream/40 focus:outline-none focus:border-manso-cream/40 transition-colors ${
                        errors.telefono ? 'border-red-500/50' : 'border-manso-cream/20'
                      }`}
                      placeholder="+54 9 11 1234-5678"
                    />
                  </div>
                  {errors.telefono && (
                    <p className="mt-1 text-xs text-red-400">{errors.telefono}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-sm font-bold uppercase hover:bg-manso-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    'Procesando...'
                  ) : (
                    <>
                      <CreditCard size={20} />
                      Pagar con Mercado Pago
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Columna Derecha - Resumen del Carrito */}
          <div className="lg:col-span-5">
            <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 sticky top-8">
              <h2 className="text-xl font-bold text-manso-cream mb-6">
                Resumen del Pedido
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-manso-black/30 rounded-xl">
                    <div className="w-16 h-16 bg-manso-cream/20 rounded-lg flex items-center justify-center">
                      <ShoppingBag size={24} className="text-manso-cream/60" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-manso-cream">
                        {item.nombre}
                      </h3>
                      <p className="text-xs text-manso-cream/60">
                        ${item.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-manso-cream/10 text-manso-cream/60 hover:bg-manso-cream/20 transition-colors flex items-center justify-center"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm text-manso-cream">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 rounded-lg bg-manso-cream/10 text-manso-cream/60 hover:bg-manso-cream/20 transition-colors flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-medium text-manso-cream">
                        ${(item.precio * item.quantity).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="border-t border-manso-cream/20 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-manso-cream/60">Subtotal</span>
                  <span className="text-sm text-manso-cream">
                    ${total().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-manso-cream">Total</span>
                  <span className="text-xl font-bold text-manso-cream">
                    ${total().toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Info de seguridad */}
              <div className="mt-6 p-4 bg-manso-cream/5 rounded-xl">
                <div className="flex items-start gap-3">
                  <Check size={20} className="text-green-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-manso-cream/60 mb-1">
                      Pago seguro con Mercado Pago
                    </p>
                    <p className="text-[10px] text-manso-cream/40">
                      Tu información está protegida. El pago se procesa de forma segura a través de la plataforma de Mercado Pago.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
