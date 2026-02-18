'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, AlertTriangle, ArrowLeft, ExternalLink } from 'lucide-react';

export default function PendingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ordenData, setOrdenData] = useState<any>(null);

  useEffect(() => {
    // Obtener parámetros de URL de forma segura
    const params = new URLSearchParams(window.location.search);
    const paymentId = params.get('payment_id');
    const preferenceId = params.get('preference_id');
    const externalReference = params.get('external_reference');

    if (!paymentId || !externalReference) {
      router.push('/checkout/failure');
      return;
    }

    const fetchOrderData = async () => {
      try {
        // Obtener datos de la orden
        const response = await fetch(`/api/orden/${externalReference}`);
        if (response.ok) {
          const data = await response.json();
          setOrdenData(data.orden);
        }
      } catch (error) {
        console.error('Error obteniendo datos de la orden:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-manso-cream mx-auto mb-4"></div>
            <p className="text-manso-cream/60">Verificando estado de tu pago...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1D1D1B' }}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto min-h-screen flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Pending Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-yellow-500/20 border-2 border-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="text-yellow-400" size={40} />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black italic tracking-tighter uppercase text-manso-cream mb-2">
              Pago Pendiente
            </h1>
            <p className="text-sm text-manso-cream/60">
              Tu pago está siendo procesado
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-manso-cream mb-4">
              Detalles de la Compra
            </h2>
            
            {ordenData && (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Orden #{ordenData.id}</span>
                  <span className="text-sm text-manso-cream font-medium">
                    ${ordenData.total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Comprador</span>
                  <span className="text-sm text-manso-cream">{ordenData.nombre}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Email</span>
                  <span className="text-sm text-manso-cream">{ordenData.email}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-manso-cream/60">Estado</span>
                  <span className="text-sm font-medium text-yellow-400">
                    Pendiente de Aprobación
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* What's happening */}
          <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-manso-cream mb-4 flex items-center gap-2">
              <AlertTriangle size={24} />
              ¿Qué está pasando?
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-manso-cream mb-2">
                  Tu pago está en proceso:
                </h3>
                <ul className="space-y-2 text-sm text-manso-cream/60">
                  <li className="flex items-start gap-2">
                    <span className="text-manso-cream/40 mt-1">•</span>
                    <span>Estamos esperando la confirmación de Mercado Pago</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-manso-cream/40 mt-1">•</span>
                    <span>Algunos métodos de pago pueden tardar hasta 48 horas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-manso-cream/40 mt-1">•</span>
                    <span>Recibirás un email cuando el pago sea aprobado</span>
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-blue-500/20 border border-blue-500/30 rounded-xl">
                <p className="text-xs text-blue-400">
                  <strong>Tip:</strong> Puedes cerrar esta página. Te enviaremos una notificación por email cuando tu pago sea confirmado.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Methods Info */}
          <div className="bg-manso-cream/10 border border-manso-cream/20 rounded-2xl p-6 sm:p-8 mb-6">
            <h2 className="text-xl font-bold text-manso-cream mb-4">
              Tiempos de Aprobación
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-manso-black/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-manso-cream">Tarjeta de Crédito/Débito</p>
                  <p className="text-xs text-manso-cream/60">Inmediato</p>
                </div>
                <span className="text-xs text-green-400 font-medium">Rápido</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-manso-black/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-manso-cream">Transferencia Bancaria</p>
                  <p className="text-xs text-manso-cream/60">1-2 horas hábiles</p>
                </div>
                <span className="text-xs text-yellow-400 font-medium">Medio</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-manso-black/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium text-manso-cream">Pago en efectivo</p>
                  <p className="text-xs text-manso-cream/60">Hasta 48 horas</p>
                </div>
                <span className="text-xs text-orange-400 font-medium">Lento</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-manso-cream/10 text-manso-cream border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-cream/20 transition-all"
            >
              <Clock size={16} />
              Verificar Estado
            </button>
            
            <button
              onClick={() => router.push('/')}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-manso-cream text-manso-black border border-manso-cream/20 rounded-xl text-xs font-bold uppercase hover:bg-manso-white transition-all"
            >
              <ArrowLeft size={16} />
              Volver al Inicio
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-manso-cream/40 mb-2">
              ¿Preguntas sobre tu pago?
            </p>
            <p className="text-xs text-manso-cream/20">
              Contactanos en <a href="mailto:soporte@manso.club" className="text-manso-cream/40 hover:text-manso-cream/60 transition-colors">soporte@manso.club</a>
            </p>
            <p className="text-xs text-manso-cream/20 mt-2">
              Incluye tu número de orden: <span className="text-manso-cream/40">#{ordenData?.id}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
