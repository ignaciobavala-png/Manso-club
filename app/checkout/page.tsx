'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCart } from '@/store/useCart';
import { useCurrency } from '@/store/useCurrency';
import { ParticleBackground } from '@/components/Home/ParticleBackground';
import {
  ArrowLeft,
  CreditCard,
  User,
  Mail,
  Phone,
  CheckCircle,
  AlertCircle,
  ShoppingBag,
  MessageCircle,
  Truck,
  ShieldCheck,
  Landmark,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { WHATSAPP_NUMBER } from '@/lib/constants';
import { esDatoBancario } from '@/lib/datos-bancarios';

interface CheckoutForm {
  nombre: string;
  mail: string;
  telefono: string;
  dni: string;
  direccion: string;
}

type CampoForm = keyof CheckoutForm;

interface CheckoutConfig {
  banco_nombre?: string;
  banco_cbu?: string;
  banco_alias?: string;
  banco_titular?: string;
  banco_cuit?: string;
  tiempo_entrega?: string;
}

const CAMPOS_VACIOS: CheckoutForm = {
  nombre: '',
  mail: '',
  telefono: '',
  dni: '',
  direccion: '',
};

/** Devuelve el mensaje de error de un campo, o '' si es válido. */
function validarCampo(campo: CampoForm, valor: string): string {
  const v = valor.trim();

  switch (campo) {
    case 'nombre':
      if (!v) return 'Ingresá tu nombre completo';
      if (v.length < 3) return 'El nombre es demasiado corto';
      return '';
    case 'mail':
      if (!v) return 'Ingresá tu email';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Revisá el formato del email';
      return '';
    case 'telefono':
      if (!v) return 'Ingresá tu teléfono';
      if (v.replace(/\D/g, '').length < 8) return 'Ingresá un teléfono válido con característica';
      return '';
    case 'dni': {
      if (!v) return 'Ingresá tu DNI';
      const soloDigitos = v.replace(/\D/g, '');
      if (soloDigitos.length < 7 || soloDigitos.length > 8) return 'El DNI debe tener 7 u 8 dígitos';
      return '';
    }
    case 'direccion':
      if (!v) return 'Ingresá tu dirección';
      if (v.length < 10) return 'Incluí calle, número, ciudad y provincia';
      return '';
    default:
      return '';
  }
}

/** Envuelve el contenido con el fondo de partículas del resto del sitio. */
function CheckoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-manso-black">
      <ParticleBackground />
      <div className="relative z-10 px-6 sm:px-8 md:px-16 pt-32 pb-24">{children}</div>
    </div>
  );
}

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const { rate, fetchRate } = useCurrency();

  const [formData, setFormData] = useState<CheckoutForm>(CAMPOS_VACIOS);
  const [errores, setErrores] = useState<Partial<Record<CampoForm, string>>>({});
  const [tocados, setTocados] = useState<Partial<Record<CampoForm, boolean>>>({});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPayingMP, setIsPayingMP] = useState(false);
  const [pedidoConfirmado, setPedidoConfirmado] = useState<{ mensajeWhatsapp: string } | null>(null);
  const [error, setError] = useState('');

  const [config, setConfig] = useState<CheckoutConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [metodoPago, setMetodoPago] = useState<'mercadopago' | 'transferencia'>('mercadopago');

  useEffect(() => {
    fetchRate();
  }, [fetchRate]);

  useEffect(() => {
    let cancelado = false;

    const cargarConfig = async () => {
      try {
        const response = await fetch('/api/checkout/config');
        const data = await response.json();
        if (!cancelado && data.success) setConfig(data.config);
      } catch (err) {
        console.error('Error loading config:', err);
      } finally {
        if (!cancelado) setLoadingConfig(false);
      }
    };

    cargarConfig();
    return () => {
      cancelado = true;
    };
  }, []);

  // Los datos bancarios solo se muestran si están realmente cargados: mostrar un
  // CBU de ejemplo haría que alguien transfiera a una cuenta que no existe.
  // No alcanza con que el campo no esté vacío — los placeholders que quedan en
  // el panel (`--------`, `0000000000`) también pasaban este chequeo.
  const transferenciaDisponible = [config?.banco_cbu, config?.banco_titular, config?.banco_nombre]
    .every(esDatoBancario);

  useEffect(() => {
    if (!loadingConfig && !transferenciaDisponible) setMetodoPago('mercadopago');
  }, [loadingConfig, transferenciaDisponible]);

  const totalUsd = total();
  const totalArs = rate ? Math.round(totalUsd * rate) : null;

  const formatArs = (monto: number) =>
    new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(monto);

  const mostrarPrecio = (precioUsd: number) =>
    rate ? formatArs(Math.round(precioUsd * rate)) : `USD $${precioUsd.toLocaleString('es-AR')}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const campo = name as CampoForm;

    setFormData((prev) => ({ ...prev, [campo]: value }));
    setError('');

    // Una vez que el campo mostró un error, se revalida en vivo para que el
    // usuario vea cuándo lo corrigió.
    if (tocados[campo]) {
      setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const campo = e.target.name as CampoForm;
    setTocados((prev) => ({ ...prev, [campo]: true }));
    setErrores((prev) => ({ ...prev, [campo]: validarCampo(campo, e.target.value) }));
  };

  const validarFormulario = () => {
    const nuevosErrores: Partial<Record<CampoForm, string>> = {};
    (Object.keys(CAMPOS_VACIOS) as CampoForm[]).forEach((campo) => {
      const mensaje = validarCampo(campo, formData[campo]);
      if (mensaje) nuevosErrores[campo] = mensaje;
    });

    setErrores(nuevosErrores);
    setTocados({ nombre: true, mail: true, telefono: true, dni: true, direccion: true });

    if (Object.keys(nuevosErrores).length > 0) {
      setError('Revisá los campos marcados para continuar.');
      return false;
    }
    return true;
  };

  const itemsPayload = useMemo(
    () => items.map((item) => ({ id: item.id, quantity: item.quantity })),
    [items]
  );

  const handleConfirmarTransferencia = async () => {
    if (!validarFormulario()) return;

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: formData, items: itemsPayload }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al registrar el pedido');

      const mensajeCliente = encodeURIComponent(
        `Hola! Hice un pedido en MANSO CLUB por ${formatArs(data.total_ars)}. ` +
          `Mi nombre es ${formData.nombre} (${formData.mail}). Quedo a la espera de los datos para el pago y la cotización del envío.`
      );

      setPedidoConfirmado({
        mensajeWhatsapp: `https://wa.me/${WHATSAPP_NUMBER}?text=${mensajeCliente}`,
      });
      clearCart();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al procesar tu pedido. Intentá nuevamente.'
      );
      console.error('Error en checkout:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePagarMercadoPago = async () => {
    if (!validarFormulario()) return;

    setIsPayingMP(true);
    setError('');

    try {
      const response = await fetch('/api/mp/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cliente: formData, items: itemsPayload }),
      });

      const data = await response.json();
      if (!response.ok || !data.init_point) {
        throw new Error(data.error || 'No se pudo iniciar el pago');
      }

      window.location.href = data.init_point;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Ocurrió un error al iniciar el pago con Mercado Pago.'
      );
      console.error('Error iniciando pago MP:', err);
      setIsPayingMP(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (metodoPago === 'mercadopago') handlePagarMercadoPago();
    else handleConfirmarTransferencia();
  };

  const procesando = isSubmitting || isPayingMP;

  if (loadingConfig) {
    return (
      <CheckoutShell>
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-manso-cream/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <div className="w-10 h-10 border-2 border-manso-cream/20 border-t-manso-terra rounded-full animate-spin" />
          </div>
          <p className="text-lg text-manso-cream/60">Preparando tu checkout...</p>
        </div>
      </CheckoutShell>
    );
  }

  if (pedidoConfirmado) {
    return (
      <CheckoutShell>
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-manso-olive/20 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle className="w-10 h-10 text-manso-olive" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-manso-cream mb-4">
            ¡Pedido Recibido!
          </h1>
          <p className="text-lg text-manso-cream/60 mb-8">
            Registramos tu pedido. Escribinos por WhatsApp para recibir los datos bancarios y
            coordinar el envío.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={pedidoConfirmado.mensajeWhatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-manso-olive text-manso-black px-10 py-5 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all rounded-full"
            >
              <MessageCircle size={18} />
              Continuar por WhatsApp
            </a>
            <Link
              href="/tienda"
              className="inline-flex items-center justify-center gap-3 border border-manso-cream/20 text-manso-cream px-10 py-5 text-xs font-black uppercase tracking-widest hover:bg-manso-cream/10 transition-all rounded-full"
            >
              Volver a la Tienda
            </Link>
          </div>
        </div>
      </CheckoutShell>
    );
  }

  if (items.length === 0) {
    return (
      <CheckoutShell>
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-manso-cream/5 rounded-full flex items-center justify-center mx-auto mb-8">
            <ShoppingBag className="w-10 h-10 text-manso-cream/40" />
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tighter text-manso-cream mb-4">
            Tu carrito está vacío
          </h1>
          <p className="text-lg text-manso-cream/60 mb-8">
            Agregá productos desde la tienda para completar tu compra.
          </p>
          <Link
            href="/tienda"
            className="inline-flex items-center gap-3 bg-manso-terra text-manso-cream px-12 py-6 text-[10px] font-black uppercase tracking-widest hover:bg-manso-terra/80 transition-all rounded-full"
          >
            Ir a la Tienda
          </Link>
        </div>
      </CheckoutShell>
    );
  }

  const inputClass = (campo: CampoForm, conIcono = false) =>
    `w-full ${conIcono ? 'pl-12' : 'pl-4'} pr-4 py-4 bg-manso-cream/10 border rounded-2xl outline-none transition-all text-manso-cream placeholder:text-manso-cream/30 focus:ring-2 ${
      errores[campo]
        ? 'border-manso-terra focus:ring-manso-terra'
        : 'border-manso-cream/20 focus:ring-manso-terra'
    }`;

  const MensajeError = ({ campo }: { campo: CampoForm }) =>
    errores[campo] ? (
      <p className="mt-2 text-xs text-manso-terra font-medium flex items-center gap-1.5">
        <AlertCircle size={13} />
        {errores[campo]}
      </p>
    ) : null;

  const labelClass = 'block text-[10px] font-black uppercase tracking-widest text-manso-cream/50 mb-2';
  const cardClass = 'bg-manso-cream/5 rounded-[32px] p-6 border border-manso-cream/10';

  return (
    <CheckoutShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 text-manso-cream/50 hover:text-manso-cream transition-colors mb-6 text-sm"
          >
            <ArrowLeft size={18} />
            Seguir comprando
          </Link>

          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-manso-cream mb-3">
            Finalizar Compra
            <span className="text-manso-cream/30 cursor-blink">_</span>
          </h1>
          <p className="text-sm text-manso-cream/50 italic">
            completá tus datos y elegí cómo pagar
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-8">
          {/* Formulario */}
          <div>
            <form onSubmit={handleFormSubmit} className="space-y-6" noValidate>
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-5 h-5 text-manso-terra" />
                  <h2 className="text-xl font-black uppercase tracking-tighter text-manso-cream">
                    Tus Datos
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <label htmlFor="nombre" className={labelClass}>
                      Nombre completo
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/30 w-5 h-5" />
                      <input
                        type="text"
                        id="nombre"
                        name="nombre"
                        autoComplete="name"
                        value={formData.nombre}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={inputClass('nombre', true)}
                        placeholder="Como figura en tu documento"
                        disabled={procesando}
                      />
                    </div>
                    <MensajeError campo="nombre" />
                  </div>

                  <div>
                    <label htmlFor="mail" className={labelClass}>
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/30 w-5 h-5" />
                      <input
                        type="email"
                        id="mail"
                        name="mail"
                        autoComplete="email"
                        value={formData.mail}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={inputClass('mail', true)}
                        placeholder="tu@email.com"
                        disabled={procesando}
                      />
                    </div>
                    <MensajeError campo="mail" />
                  </div>

                  <div>
                    <label htmlFor="telefono" className={labelClass}>
                      Teléfono
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-manso-cream/30 w-5 h-5" />
                      <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        autoComplete="tel"
                        value={formData.telefono}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className={inputClass('telefono', true)}
                        placeholder="+54 9 11 1234-5678"
                        disabled={procesando}
                      />
                    </div>
                    <MensajeError campo="telefono" />
                  </div>

                  <div>
                    <label htmlFor="dni" className={labelClass}>
                      DNI
                    </label>
                    <input
                      type="text"
                      id="dni"
                      name="dni"
                      inputMode="numeric"
                      value={formData.dni}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={inputClass('dni')}
                      placeholder="12345678"
                      disabled={procesando}
                      maxLength={10}
                    />
                    <MensajeError campo="dni" />
                  </div>

                  <div className="sm:col-span-2">
                    <label htmlFor="direccion" className={labelClass}>
                      Dirección de entrega
                    </label>
                    <input
                      type="text"
                      id="direccion"
                      name="direccion"
                      autoComplete="street-address"
                      value={formData.direccion}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className={inputClass('direccion')}
                      placeholder="Calle, número, ciudad, provincia"
                      disabled={procesando}
                    />
                    <MensajeError campo="direccion" />
                  </div>
                </div>
              </div>

              {/* Método de pago */}
              <div className={cardClass}>
                <div className="flex items-center gap-3 mb-5">
                  <CreditCard className="w-5 h-5 text-manso-terra" />
                  <h2 className="text-xl font-black uppercase tracking-tighter text-manso-cream">
                    Método de Pago
                  </h2>
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setMetodoPago('mercadopago')}
                    aria-pressed={metodoPago === 'mercadopago'}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                      metodoPago === 'mercadopago'
                        ? 'border-[#009ee3] bg-[#009ee3]/10'
                        : 'border-manso-cream/15 hover:border-manso-cream/30'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-full bg-[#009ee3] flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-manso-cream text-sm">Mercado Pago</p>
                      <p className="text-xs text-manso-cream/40">
                        Tarjeta de crédito, débito o dinero en cuenta
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        metodoPago === 'mercadopago' ? 'border-[#009ee3]' : 'border-manso-cream/30'
                      }`}
                    >
                      {metodoPago === 'mercadopago' && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#009ee3]" />
                      )}
                    </div>
                  </button>

                  {transferenciaDisponible && (
                    <button
                      type="button"
                      onClick={() => setMetodoPago('transferencia')}
                      aria-pressed={metodoPago === 'transferencia'}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                        metodoPago === 'transferencia'
                          ? 'border-manso-olive bg-manso-olive/10'
                          : 'border-manso-cream/15 hover:border-manso-cream/30'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-full bg-manso-olive flex items-center justify-center flex-shrink-0">
                        <Landmark className="w-5 h-5 text-manso-black" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-manso-cream text-sm">Transferencia bancaria</p>
                        <p className="text-xs text-manso-cream/40">Coordinás el pago por WhatsApp</p>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          metodoPago === 'transferencia' ? 'border-manso-olive' : 'border-manso-cream/30'
                        }`}
                      >
                        {metodoPago === 'transferencia' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-manso-olive" />
                        )}
                      </div>
                    </button>
                  )}
                </div>

                {metodoPago === 'transferencia' && transferenciaDisponible && (
                  <div className="mt-5 pt-5 border-t border-manso-cream/10 space-y-3 text-sm">
                    <p className="text-[10px] text-manso-cream/40 uppercase tracking-widest font-black mb-3">
                      Datos para transferir
                    </p>
                    <div className="flex justify-between gap-4">
                      <span className="text-manso-cream/50">Banco</span>
                      <span className="text-manso-cream font-medium text-right">{config?.banco_nombre}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-manso-cream/50">CBU</span>
                      <span className="text-manso-cream font-mono text-xs text-right break-all">
                        {config?.banco_cbu}
                      </span>
                    </div>
                    {config?.banco_alias && (
                      <div className="flex justify-between gap-4">
                        <span className="text-manso-cream/50">Alias</span>
                        <span className="text-manso-cream font-medium text-right">{config.banco_alias}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-4">
                      <span className="text-manso-cream/50">Titular</span>
                      <span className="text-manso-cream font-medium text-right">{config?.banco_titular}</span>
                    </div>
                    {config?.banco_cuit && (
                      <div className="flex justify-between gap-4">
                        <span className="text-manso-cream/50">CUIT</span>
                        <span className="text-manso-cream font-medium text-right">{config.banco_cuit}</span>
                      </div>
                    )}
                    <p className="text-xs text-manso-cream/40 pt-3 border-t border-manso-cream/10">
                      Al confirmar te pasamos estos datos por WhatsApp junto con la cotización del envío.
                    </p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-manso-terra/10 border border-manso-terra/40 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-manso-terra flex-shrink-0 mt-0.5" />
                  <p className="text-manso-terra text-sm font-medium">{error}</p>
                </div>
              )}

              {metodoPago === 'mercadopago' && !rate && (
                <div className="bg-manso-olive/10 border border-manso-olive/40 rounded-2xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-manso-olive flex-shrink-0 mt-0.5" />
                  <p className="text-manso-cream/70 text-sm">
                    No pudimos obtener la cotización del dólar. Esperá unos segundos o escribinos por
                    WhatsApp para coordinar el pago.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={procesando || (metodoPago === 'mercadopago' && !rate)}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-wider transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 ${
                  metodoPago === 'mercadopago'
                    ? 'bg-[#009ee3] text-white hover:bg-[#0087c7]'
                    : 'bg-manso-terra text-manso-cream hover:bg-manso-terra/80'
                }`}
              >
                {procesando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    {metodoPago === 'mercadopago' ? 'Redirigiendo...' : 'Procesando...'}
                  </>
                ) : metodoPago === 'mercadopago' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Pagar {totalArs !== null ? formatArs(totalArs) : ''}
                  </>
                ) : (
                  <>Confirmar pedido {totalArs !== null ? `· ${formatArs(totalArs)}` : ''}</>
                )}
              </button>

              <p className="text-center text-xs text-manso-cream/30">
                Al confirmar aceptás que te contactemos para coordinar la entrega.
              </p>
            </form>
          </div>

          {/* Resumen */}
          <div className="lg:sticky lg:top-8 lg:self-start space-y-4">
            <div className="bg-manso-cream/5 rounded-[32px] border border-manso-cream/10 overflow-hidden">
              <div className="flex items-center gap-3 p-6 pb-4">
                <ShoppingBag size={18} className="text-manso-terra" />
                <h2 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
                  Tu pedido
                </h2>
                <span className="ml-auto text-[10px] text-manso-cream/40 uppercase tracking-widest font-bold">
                  {items.length} {items.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              <div className="px-6 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 items-center">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-manso-cream/10 flex-shrink-0">
                      <img
                        src={item.imagenes_urls?.[0] || '/manso.png'}
                        alt={item.nombre}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/manso.png';
                        }}
                      />
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-manso-terra text-manso-cream text-[10px] font-bold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-manso-cream text-sm leading-tight truncate">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-manso-cream/40 mt-0.5">
                        {mostrarPrecio(item.precio)} c/u
                      </p>
                    </div>
                    <p className="font-bold text-manso-cream text-sm whitespace-nowrap">
                      {mostrarPrecio(item.precio * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-6 bg-manso-black/40 border-t border-manso-cream/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-manso-cream/50">Subtotal</span>
                  <span className="text-manso-cream font-medium">
                    {totalArs !== null ? formatArs(totalArs) : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-manso-cream/50">Envío</span>
                  <span className="text-manso-cream/40 text-right text-xs">Se cotiza por WhatsApp</span>
                </div>

                <div className="flex justify-between items-end pt-3 border-t border-manso-cream/10">
                  <span className="text-sm font-black uppercase tracking-wider text-manso-cream">
                    Total
                  </span>
                  <div className="text-right">
                    <p className="text-2xl font-black text-manso-cream leading-none">
                      {totalArs !== null ? formatArs(totalArs) : '—'}
                    </p>
                    <p className="text-xs text-manso-cream/40 mt-1">
                      USD ${totalUsd.toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>

                {rate && (
                  <p className="text-[11px] text-manso-cream/30 leading-relaxed pt-2">
                    Los precios se publican en dólares y se cobran en pesos según la cotización del
                    dólar blue ({formatArs(rate)} por USD) al momento del pago.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-manso-cream/5 rounded-[32px] p-5 border border-manso-cream/10 space-y-3">
              <div className="flex items-center gap-3 text-xs text-manso-cream/60">
                <ShieldCheck size={15} className="text-manso-olive flex-shrink-0" />
                <span>Pago procesado por Mercado Pago</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-manso-cream/60">
                <Truck size={15} className="text-manso-olive flex-shrink-0" />
                <span>Envíos a todo el país{config?.tiempo_entrega ? ` · ${config.tiempo_entrega}` : ''}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-manso-cream/60">
                <MessageCircle size={15} className="text-manso-olive flex-shrink-0" />
                <span>Te acompañamos por WhatsApp hasta la entrega</span>
              </div>
            </div>

            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full border border-manso-cream/15 text-manso-cream/60 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-manso-olive hover:text-manso-olive transition-all flex items-center justify-center gap-2"
            >
              <MessageCircle size={15} />
              ¿Dudas? Escribinos
            </a>
          </div>
        </div>
      </div>
    </CheckoutShell>
  );
}
