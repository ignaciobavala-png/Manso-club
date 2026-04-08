'use client';

import { useState } from 'react';
import { Calculator, Calendar, Clock, Users, Music, Camera, Palette, Mic } from 'lucide-react';

const inputCls = "w-full bg-manso-cream/5 border border-manso-cream/15 rounded-2xl px-5 py-4 text-manso-cream placeholder:text-manso-cream/30 text-sm font-light focus:outline-none focus:border-manso-terra/60 transition-colors";
const labelCls = "block text-[9px] font-black uppercase tracking-[0.5em] text-manso-terra mb-2";
const radioCls = "sr-only peer";
const radioLabelCls = "flex items-center p-4 bg-manso-cream/5 border border-manso-cream/15 rounded-xl cursor-pointer transition-all peer-checked:bg-manso-terra/20 peer-checked:border-manso-terra/60 hover:bg-manso-cream/10";

interface CotizacionData {
  tipoEvento: string;
  duracion: string;
  cantidadPersonas: string;
  servicios: string[];
  fecha: string;
  hora: string;
  nombre: string;
  email: string;
  telefono: string;
}

export function CotizadorForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [cotizacion, setCotizacion] = useState<CotizacionData>({
    tipoEvento: '',
    duracion: '',
    cantidadPersonas: '',
    servicios: [],
    fecha: '',
    hora: '',
    nombre: '',
    email: '',
    telefono: ''
  });
  const [precioEstimado, setPrecioEstimado] = useState(0);

  const tiposEvento = [
    { value: 'show_musical', label: 'Show Musical', icon: Music, precio: 50000 },
    { value: 'exposicion', label: 'Exposición Artística', icon: Palette, precio: 30000 },
    { value: 'taller', label: 'Taller', icon: Camera, precio: 25000 },
    { value: 'evento_privado', label: 'Evento Privado', icon: Users, precio: 75000 },
    { value: 'grabacion', label: 'Sesión de Grabación', icon: Mic, precio: 40000 }
  ];

  const duraciones = [
    { value: '2_horas', label: '2 horas', multiplicador: 1 },
    { value: '4_horas', label: '4 horas', multiplicador: 1.5 },
    { value: '6_horas', label: '6 horas', multiplicador: 2 },
    { value: '8_horas', label: '8 horas', multiplicador: 2.5 },
    { value: 'dia_completo', label: 'Día completo', multiplicador: 3 }
  ];

  const capacidades = [
    { value: 'hasta_50', label: 'Hasta 50 personas', multiplicador: 1 },
    { value: 'hasta_100', label: 'Hasta 100 personas', multiplicador: 1.3 },
    { value: 'hasta_200', label: 'Hasta 200 personas', multiplicador: 1.6 },
    { value: 'mas_200', label: 'Más de 200 personas', multiplicador: 2 }
  ];

  const serviciosAdicionales = [
    { value: 'bar', label: 'Servicio de bar', precio: 15000 },
    { value: 'catering', label: 'Catering básico', precio: 25000 },
    { value: 'sonido', label: 'Equipo de sonido profesional', precio: 20000 },
    { value: 'luces', label: 'Equipo de luces', precio: 18000 },
    { value: 'fotografo', label: 'Fotógrafo', precio: 35000 },
    { value: 'seguridad', label: 'Equipo de seguridad', precio: 12000 }
  ];

  const calculatePrecio = () => {
    const tipoSeleccionado = tiposEvento.find(t => t.value === cotizacion.tipoEvento);
    const duracionSeleccionada = duraciones.find(d => d.value === cotizacion.duracion);
    const capacidadSeleccionada = capacidades.find(c => c.value === cotizacion.cantidadPersonas);
    
    if (!tipoSeleccionado || !duracionSeleccionada || !capacidadSeleccionada) {
      setPrecioEstimado(0);
      return;
    }

    let base = tipoSeleccionado.precio;
    base *= duracionSeleccionada.multiplicador;
    base *= capacidadSeleccionada.multiplicador;

    const serviciosTotal = cotizacion.servicios.reduce((total, servicio) => {
      const serv = serviciosAdicionales.find(s => s.value === servicio);
      return total + (serv?.precio || 0);
    }, 0);

    setPrecioEstimado(base + serviciosTotal);
  };

  const updateField = (field: keyof CotizacionData, value: string | string[]) => {
    setCotizacion(prev => ({ ...prev, [field]: value }));
  };

  const toggleServicio = (servicio: string) => {
    setCotizacion(prev => ({
      ...prev,
      servicios: prev.servicios.includes(servicio)
        ? prev.servicios.filter(s => s !== servicio)
        : [...prev.servicios, servicio]
    }));
  };

  const nextStep = () => {
    if (currentStep < 6) setCurrentStep(currentStep + 1);
    if (currentStep === 5) calculatePrecio();
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para enviar la cotización
    alert('Cotización enviada. Nos contactaremos pronto.');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Qué tipo de evento querés organizar?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tiposEvento.map((tipo) => {
                const Icon = tipo.icon;
                return (
                  <label key={tipo.value} className={radioLabelCls}>
                    <input
                      type="radio"
                      name="tipoEvento"
                      value={tipo.value}
                      checked={cotizacion.tipoEvento === tipo.value}
                      onChange={(e) => updateField('tipoEvento', e.target.value)}
                      className={radioCls}
                    />
                    <Icon className="w-6 h-6 text-manso-terra mr-3" />
                    <div>
                      <p className="font-medium text-manso-cream">{tipo.label}</p>
                      <p className="text-xs text-manso-cream/60">Desde ${tipo.precio.toLocaleString()}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Cuánto tiempo durará el evento?
            </h3>
            <div className="space-y-3">
              {duraciones.map((duracion) => (
                <label key={duracion.value} className={radioLabelCls}>
                  <input
                    type="radio"
                    name="duracion"
                    value={duracion.value}
                    checked={cotizacion.duracion === duracion.value}
                    onChange={(e) => updateField('duracion', e.target.value)}
                    className={radioCls}
                  />
                  <Clock className="w-5 h-5 text-manso-terra mr-3" />
                  <span className="text-manso-cream">{duracion.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Cuántas personas esperás?
            </h3>
            <div className="space-y-3">
              {capacidades.map((capacidad) => (
                <label key={capacidad.value} className={radioLabelCls}>
                  <input
                    type="radio"
                    name="cantidadPersonas"
                    value={capacidad.value}
                    checked={cotizacion.cantidadPersonas === capacidad.value}
                    onChange={(e) => updateField('cantidadPersonas', e.target.value)}
                    className={radioCls}
                  />
                  <Users className="w-5 h-5 text-manso-terra mr-3" />
                  <span className="text-manso-cream">{capacidad.label}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Qué servicios adicionales necesitás?
            </h3>
            <p className="text-manso-cream/60 text-sm mb-4">Seleccioná todos los que apliquen</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {serviciosAdicionales.map((servicio) => (
                <label key={servicio.value} className={radioLabelCls}>
                  <input
                    type="checkbox"
                    value={servicio.value}
                    checked={cotizacion.servicios.includes(servicio.value)}
                    onChange={() => toggleServicio(servicio.value)}
                    className="sr-only peer"
                  />
                  <div className="flex items-center">
                    <div className={`w-5 h-5 border-2 rounded mr-3 flex items-center justify-center ${
                      cotizacion.servicios.includes(servicio.value)
                        ? 'bg-manso-terra border-manso-terra'
                        : 'border-manso-cream/30'
                    }`}>
                      {cotizacion.servicios.includes(servicio.value) && (
                        <div className="w-2 h-2 bg-manso-cream rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <p className="text-manso-cream">{servicio.label}</p>
                      <p className="text-xs text-manso-cream/60">+${servicio.precio.toLocaleString()}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              ¿Cuándo querés realizar el evento?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelCls}>Fecha</label>
                <input
                  type="date"
                  value={cotizacion.fecha}
                  onChange={(e) => updateField('fecha', e.target.value)}
                  className={inputCls}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Hora de inicio</label>
                <input
                  type="time"
                  value={cotizacion.hora}
                  onChange={(e) => updateField('hora', e.target.value)}
                  className={inputCls}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase italic tracking-tighter text-manso-cream mb-6">
              Tus datos de contacto
            </h3>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Nombre completo</label>
                <input
                  type="text"
                  value={cotizacion.nombre}
                  onChange={(e) => updateField('nombre', e.target.value)}
                  className={inputCls}
                  placeholder="Tu nombre"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input
                  type="email"
                  value={cotizacion.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  className={inputCls}
                  placeholder="tu@email.com"
                  required
                />
              </div>
              <div>
                <label className={labelCls}>Teléfono</label>
                <input
                  type="tel"
                  value={cotizacion.telefono}
                  onChange={(e) => updateField('telefono', e.target.value)}
                  className={inputCls}
                  placeholder="+54 9 11 1234-5678"
                  required
                />
              </div>
            </div>

            {/* Resumen de cotización */}
            <div className="bg-manso-terra/10 border border-manso-terra/30 rounded-2xl p-6 mt-8">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-black uppercase text-manso-cream">Resumen de cotización</h4>
                <Calculator className="w-6 h-6 text-manso-terra" />
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-manso-cream/80">
                  <span>Tipo de evento:</span>
                  <span>{tiposEvento.find(t => t.value === cotizacion.tipoEvento)?.label}</span>
                </div>
                <div className="flex justify-between text-manso-cream/80">
                  <span>Duración:</span>
                  <span>{duraciones.find(d => d.value === cotizacion.duracion)?.label}</span>
                </div>
                <div className="flex justify-between text-manso-cream/80">
                  <span>Capacidad:</span>
                  <span>{capacidades.find(c => c.value === cotizacion.cantidadPersonas)?.label}</span>
                </div>
                {cotizacion.servicios.length > 0 && (
                  <div className="flex justify-between text-manso-cream/80">
                    <span>Servicios adicionales:</span>
                    <span>{cotizacion.servicios.length} seleccionados</span>
                  </div>
                )}
              </div>
              <div className="border-t border-manso-cream/20 mt-4 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-black text-manso-cream">Precio estimado:</span>
                  <span className="text-2xl font-black text-manso-terra">
                    ${precioEstimado.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Progress bar */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4, 5, 6].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-black transition-all ${
              currentStep >= step
                ? 'bg-manso-terra text-manso-cream'
                : 'bg-manso-cream/10 text-manso-cream/40'
            }`}>
              {step}
            </div>
            {step < 6 && (
              <div className={`w-full h-1 mx-2 transition-all ${
                currentStep > step ? 'bg-manso-terra' : 'bg-manso-cream/10'
              }`}></div>
            )}
          </div>
        ))}
      </div>

      {renderStep()}

      {/* Navigation buttons */}
      <div className="flex gap-4 pt-8">
        {currentStep > 1 && (
          <button
            type="button"
            onClick={prevStep}
            className="flex-1 py-4 bg-manso-cream/10 border border-manso-cream/20 text-manso-cream font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-manso-cream/20 transition-all text-sm"
          >
            Anterior
          </button>
        )}
        {currentStep < 6 ? (
          <button
            type="button"
            onClick={nextStep}
            disabled={
              (currentStep === 1 && !cotizacion.tipoEvento) ||
              (currentStep === 2 && !cotizacion.duracion) ||
              (currentStep === 3 && !cotizacion.cantidadPersonas)
            }
            className="flex-1 py-4 bg-manso-terra text-manso-cream font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50 text-sm"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="submit"
            disabled={!cotizacion.nombre || !cotizacion.email || !cotizacion.telefono || !cotizacion.fecha || !cotizacion.hora}
            className="flex-1 py-4 bg-manso-terra text-manso-cream font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-manso-cream hover:text-manso-black transition-all disabled:opacity-50 text-sm"
          >
            Enviar cotización
          </button>
        )}
      </div>
    </form>
  );
}
