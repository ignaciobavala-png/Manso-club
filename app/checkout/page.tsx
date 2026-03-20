'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/store/useCart';
import { ArrowLeft, CreditCard, User, Mail, Phone, CheckCircle, AlertCircle, ShoppingBag, MessageCircle, Truck, Shield, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { WHATSAPP_NUMBER } from '@/lib/constants';

interface CheckoutForm {
  nombre: string;
  mail: string;
  telefono: string;
  dni: string;
  direccion: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [formData, setFormData] = useState<CheckoutForm>({
    nombre: '',
    mail: '',
    telefono: '',
    dni: '',
    direccion: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [config, setConfig] = useState<any>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);

  useEffect(() => {
    // Pequeño delay para asegurar que el carrito esté cargado
    const timer = setTimeout(() => {
      if (items.length === 0 && !isSubmitted) {
        console.log('DEBUG: Carrito vacío, redirigiendo a tienda');
        router.push('/tienda');
      } else {
        console.log('DEBUG: Carrito tiene items, permaneciendo en checkout:', items.length);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [items, router, isSubmitted]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/checkout/config');
      const data = await response.json();
      
      if (data.success) {
        setConfig(data.config);
      }
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoadingConfig(false);
    }
  };

  const formatPrice = (price: number) => {
    const currency = config?.moneda || 'ARS';
    const locale = currency === 'USD' ? 'en-US' : 'es-AR';
    
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const validateForm = () => {
    if (!formData.nombre.trim()) {
      setError('Por favor, ingresa tu nombre completo');
      return false;
    }
    if (!formData.mail.trim()) {
      setError('Por favor, ingresa tu email');
      return false;
    }
    if (!formData.telefono.trim()) {
      setError('Por favor, ingresa tu teléfono');
      return false;
    }
    if (!formData.dni.trim()) {
      setError('Por favor, ingresa tu DNI');
      return false;
    }
    if (!formData.direccion.trim()) {
      setError('Por favor, ingresa tu dirección');
      return false;
    }
    if (!/^[0-9]{8}$|^([0-9]{2})\.([0-9]{3})\.([0-9]{3})$/.test(formData.dni.replace(/\./g, ''))) {
      setError('Por favor, ingresa un DNI válido (8 dígitos)');
      return false;
    }
    if (formData.direccion.trim().length < 10) {
      setError('La dirección debe tener al menos 10 caracteres');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.mail)) {
      setError('Por favor, ingresa un email válido');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError('');

    try {
      // Preparar mensaje para WhatsApp
      const productosTexto = items.map(item => 
        `• ${item.nombre} x${item.quantity} — ${formatPrice(item.precio)}`
      ).join('\n');

      const mensaje = `*🛒 NUEVO PEDIDO MANSO CLUB*\n\n` +
        `*DATOS DEL CLIENTE:*\n` +
        `👤 Nombre: ${formData.nombre}\n` +
        `📧 Email: ${formData.mail}\n` +
        `📱 Teléfono: ${formData.telefono}\n` +
        `🆔 DNI: ${formData.dni}\n` +
        `🏠 Dirección: ${formData.direccion}\n\n` +
        `*PRODUCTOS SOLICITADOS:*\n${productosTexto}\n\n` +
        `*TOTAL: ${formatPrice(total())}*\n\n` +
        `*📋 PRÓXIMOS PASOS:*\n` +
        `1. Contactar al cliente para confirmar el pedido\n` +
        `2. Enviar datos bancarios para el pago\n` +
        `3. Coordinar envío una vez confirmado el pago`;

      // Enviar notificación a WhatsApp
      const response = await fetch('/api/checkout/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mensaje,
          cliente: formData,
          productos: items,
          total: total(),
          config
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar la notificación');
      }

      setIsSubmitted(true);
      clearCart();
      
      // Redirigir a WhatsApp del cliente después de 3 segundos
      setTimeout(() => {
        const mensajeCliente = encodeURIComponent(
          `Hola! Ya he realizado mi pedido en MANSO CLUB. Mi nombre es ${formData.nombre} y mi email es ${formData.mail}. Estoy esperando los datos bancarios para proceder con el pago.`
        );
        const whatsappNumber = WHATSAPP_NUMBER;
        window.open(`https://wa.me/${whatsappNumber}?text=${mensajeCliente}`, '_blank');
      }, 3000);

    } catch (err) {
      setError('Ocurrió un error al procesar tu pedido. Por favor, intenta nuevamente.');
      console.error('Error en checkout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingConfig) {
    return (
      <div className="min-h-screen bg-white py-12 px-8 md:px-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-10 h-10 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg text-gray-600">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-white py-12 px-8 md:px-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black mb-4">
              ¡Pedido Recibido!
            </h1>
            <p className="text-lg text-zinc-600 mb-8">
              Muchas gracias por tu compra. Recibimos tu pedido y te contactaremos pronto para avanzar con los detalles de la compra.
            </p>
            <p className="text-sm text-zinc-500 mb-8">
              Serás redirigido a WhatsApp en unos segundos...
            </p>
            <Link
              href="/tienda"
              className="inline-flex items-center gap-3 bg-black text-white px-12 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all transform hover:-translate-y-1 rounded-full"
            >
              Volver a la Tienda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-12 px-8 md:px-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 text-black hover:text-zinc-600 transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            Volver a la tienda
          </Link>
          
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-black mb-4">
            Checkout
          </h1>
          <p className="text-lg text-zinc-600">
            Completa tus datos para finalizar la compra
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Formulario */}
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tus Datos - Principal */}
              <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-6 h-6 text-black" />
                  <h2 className="text-2xl font-black uppercase tracking-tighter text-black">
                    Tus Datos
                  </h2>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label htmlFor="nombre" className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black"
                        placeholder="Ingresa tu nombre completo"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mail" className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                      <input
                        type="email"
                        id="mail"
                        name="mail"
                        value={formData.mail}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black"
                        placeholder="tu@email.com"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="telefono" className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 w-5 h-5" />
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-4 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black"
                        placeholder="+54 9 11 1234-5678"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="dni" className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      DNI
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="dni"
                        name="dni"
                        value={formData.dni}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black"
                        placeholder="12345678 o 12.345.678"
                        disabled={isSubmitting}
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="lg:col-span-2">
                    <label htmlFor="direccion" className="block text-sm font-bold uppercase tracking-wider text-black mb-3">
                      Dirección
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="direccion"
                        name="direccion"
                        value={formData.direccion}
                        onChange={handleInputChange}
                        className="w-full px-4 py-4 border border-zinc-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all text-black"
                        placeholder="Calle, número, ciudad, provincia"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Datos para el Pago - Card secundaria */}
              <div className="bg-zinc-50 rounded-2xl p-5 border border-zinc-200">
                <div className="flex items-center gap-3 mb-4">
                  <CreditCard className="w-5 h-5 text-zinc-600" />
                  <h3 className="text-lg font-bold uppercase tracking-tight text-zinc-700">
                    Datos para el Pago
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 gap-4 text-sm">
                  <div>
                    <p className="font-semibold text-zinc-600 mb-1">Banco:</p>
                    <p className="text-black font-medium">{config?.banco_nombre || 'Banco Galicia'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-600 mb-1">CBU:</p>
                    <p className="text-black font-mono text-sm break-all">{config?.banco_cbu || '0070053430000001234567'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-600 mb-1">Alias:</p>
                    <p className="text-black font-medium">{config?.banco_alias || 'MANSO.CLUB.TIENDA'}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-600 mb-1">Titular:</p>
                    <p className="text-black font-medium">{config?.banco_titular || 'MANSO CLUB S.A.'}</p>
                  </div>
                  {config?.banco_cuit && (
                    <div>
                      <p className="font-semibold text-zinc-600 mb-1">CUIT:</p>
                      <p className="text-black font-medium">{config.banco_cuit}</p>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 mt-4 border-t border-zinc-200">
                  <p className="text-xs text-zinc-500">
                    📱 Enviaremos WhatsApp con confirmación y datos bancarios
                  </p>
                </div>
              </div>

              {/* Botón Confirmar */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white py-6 rounded-2xl font-black uppercase tracking-wider hover:bg-gray-800 transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Procesando...
                  </>
                ) : (
                  <>
                    Confirmar Pedido
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Resumen del Pedido - Destacado y Sticky */}
          <div className="lg:sticky lg:top-8 space-y-6">
            {/* Card Principal - Resumen */}
            <div className="bg-gradient-to-br from-zinc-50 to-white rounded-2xl p-6 border-2 border-zinc-200 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                  <ShoppingBag size={20} className="text-white" />
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tighter text-black">
                  Resumen del Pedido
                </h2>
              </div>
              
              {/* Items del Carrito */}
              <div className="space-y-4 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="bg-white rounded-xl p-4 border border-zinc-100">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-bold text-black text-sm uppercase tracking-tight mb-1">
                          {item.nombre}
                        </h4>
                        <p className="text-zinc-500 text-xs">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-black text-lg">
                          {formatPrice(item.precio * item.quantity)}
                        </p>
                        <p className="text-zinc-400 text-xs">
                          {formatPrice(item.precio)} c/u
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Destacado */}
              <div className="bg-black text-white rounded-xl p-6 -mx-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold uppercase tracking-wider">
                    TOTAL
                  </span>
                  <span className="text-2xl font-black">
                    {formatPrice(total())}
                  </span>
                </div>
              </div>
            </div>

            {/* Métodos de Pago */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-wider text-zinc-400 mb-4">
                Método de Pago
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">🏦</span>
                  </div>
                  <span className="text-sm text-black font-medium">Transferencia bancaria</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-xs">📱</span>
                  </div>
                  <span className="text-sm text-black font-medium">Contactar por WhatsApp</span>
                </div>
              </div>
              
              {/* Botón WhatsApp Flotante */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-green-600 text-white py-3 rounded-xl font-bold uppercase tracking-wider hover:bg-green-700 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
              >
                <MessageCircle size={18} />
                Contactar por WhatsApp
              </a>
            </div>

            {/* Info Adicional */}
            <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-200">
              <div className="space-y-3 text-xs text-zinc-600">
                <div className="flex items-center gap-2">
                  <Truck size={14} />
                  <span>Envío a todo el país</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield size={14} />
                  <span>Pago seguro</span>
                </div>
                <div className="flex items-center gap-2">
                  <RotateCcw size={14} />
                  <span>Devoluciones 30 días</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
