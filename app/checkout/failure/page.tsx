'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X, AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function FailurePage() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);

  useEffect(() => {
    // Obtener searchParams de forma segura
    const params = new URLSearchParams(window.location.search);
    setSearchParams(params);
  }, []);

  useEffect(() => {
    if (!searchParams) return;
    
    // Log del error para debugging
    const paymentId = searchParams.get('payment_id');
    const preferenceId = searchParams.get('preference_id');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.error('Payment failed:', {
      paymentId,
      preferenceId,
      error,
      errorDescription,
    });
  }, [searchParams]);

  const handleRetry = () => {
    // Volver al checkout para intentar nuevamente
    router.push('/checkout');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Error Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-red-500/20 border-2 border-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="text-red-400" size={40} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">
              Pago Fallido
            </h1>
            <p className="text-sm text-manso-cream/60">
              No pudimos procesar tu pago. Por favor, intenta nuevamente.
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-manso-cream mb-4 flex items-center gap-2">
              <AlertTriangle size={24} />
              ¿Qué pasó?
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-manso-cream mb-2">
                  Posibles causas:
                </h3>
                <ul className="space-y-2 text-sm text-manso-cream/60">
                  <li className="flex items-start gap-2">
                    <span className="text-manso-cream/40 mt-1">•</span>
                    <span>Tarjeta rechazada por el banco emisor</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-manso-cream/40 mt-1">•</span>
                    <span>Fondos insuficientes</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-manso-cream/40 mt-1">•</span>
                    <span>Datos de la tarjeta incorrectos</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-manso-cream/40 mt-1">•</span>
                    <span>Problema de conexión temporal</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-xl">
                <p className="text-xs text-yellow-400">
                  <strong>Importante:</strong> No se ha realizado ningún cargo en tu tarjeta. 
                  Puedes intentar realizar el pago nuevamente con seguridad.
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Actions */}
          <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-manso-cream mb-4">
              ¿Qué puedo hacer?
            </h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-manso-cream/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-manso-cream">1</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-manso-cream mb-1">
                    Verifica tus datos
                  </h3>
                  <p className="text-xs text-manso-cream/60">
                    Asegúrate de que los datos de la tarjeta sean correctos.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-manso-cream/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-manso-cream">2</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-manso-cream mb-1">
                    Intenta con otro método
                  </h3>
                  <p className="text-xs text-manso-cream/60">
                    Mercado Pago ofrece múltiples métodos de pago.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-manso-cream/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-manso-cream">3</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-manso-cream mb-1">
                    Contacta a tu banco
                  </h3>
                  <p className="text-xs text-manso-cream/60">
                    Si el problema persiste, consulta con tu entidad bancaria.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-white transition-all"
            >
              <RefreshCw size={16} />
              Intentar Nuevamente
            </button>
            
            <button
              onClick={handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-manso-cream/10 text-manso-cream border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-cream/20 transition-all"
            >
              <ArrowLeft size={16} />
              Volver al Inicio
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-manso-cream/40 mb-2">
              ¿Necesitas ayuda?
            </p>
            <p className="text-xs text-manso-cream/20">
              Contactanos en <a href="mailto:soporte@manso.club" className="text-manso-cream/40 hover:text-manso-cream/60 transition-colors">soporte@manso.club</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
