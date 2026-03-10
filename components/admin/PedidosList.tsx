'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Mail, Phone, User, Clock, CheckCircle, XCircle, Package, DollarSign, Trash2 } from 'lucide-react';

interface Pedido {
  id: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  cliente_dni: string;
  cliente_direccion: string;
  productos: Array<{
    id: string;
    nombre: string;
    precio: number;
    quantity: number;
  }>;
  total: number;
  estado: 'pendiente_pago' | 'pagado' | 'enviado' | 'cancelado';
  created_at: string;
  notificacion_email_enviada: boolean;
  notificacion_whatsapp_enviada: boolean;
}

interface PedidosListProps {
  refreshTrigger?: number;
}

export function PedidosList({ refreshTrigger }: PedidosListProps) {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPedidos();
  }, [refreshTrigger]);

  const fetchPedidos = async () => {
    try {
      const response = await fetch('/api/pedidos');
      const data = await response.json();
      
      if (data.success) {
        setPedidos(data.pedidos);
      } else {
        setError('Error al cargar pedidos');
      }
    } catch (error) {
      setError('Error al conectar con el servidor');
      console.error('Error fetching pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateEstado = async (pedidoId: string, nuevoEstado: string) => {
    try {
      const response = await fetch(`/api/pedidos/${pedidoId}/estado`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado: nuevoEstado }),
      });

      if (response.ok) {
        // Actualizar estado localmente
        setPedidos(prev => prev.map(p => 
          p.id === pedidoId ? { ...p, estado: nuevoEstado as any } : p
        ));
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
    }
  };

  const eliminarPedido = async (pedidoId: string, clienteNombre: string) => {
    // Confirmación antes de eliminar
    const confirmacion = confirm(
      `¿Estás seguro que quieres eliminar el pedido de ${clienteNombre}?\n\nEsta acción no se puede deshacer.`
    );
    
    if (!confirmacion) {
      return;
    }

    try {
      const response = await fetch(`/api/pedidos/${pedidoId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Eliminar el pedido de la lista localmente
        setPedidos(prev => prev.filter(p => p.id !== pedidoId));
      } else {
        const error = await response.json();
        alert('Error al eliminar pedido: ' + error.error);
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      alert('Error al conectar con el servidor');
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'pendiente_pago': return 'text-yellow-400 bg-yellow-400/20';
      case 'pagado': return 'text-green-400 bg-green-400/20';
      case 'enviado': return 'text-blue-400 bg-blue-400/20';
      case 'cancelado': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente_pago': return <Clock className="w-4 h-4" />;
      case 'pagado': return <CheckCircle className="w-4 h-4" />;
      case 'enviado': return <Package className="w-4 h-4" />;
      case 'cancelado': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
        <div className="flex items-center justify-center py-12">
          <div className="text-manso-cream/60">Cargando pedidos...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button 
            onClick={fetchPedidos}
            className="px-4 py-2 bg-manso-terra text-manso-cream rounded-xl text-sm font-bold"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (pedidos.length === 0) {
    return (
      <div className="bg-manso-cream/5 p-8 rounded-[2.5rem] border border-manso-cream/10">
        <div className="text-center">
          <Package className="mx-auto text-manso-cream/40 mb-4" size={48} />
          <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream mb-2">
            No hay pedidos
          </h3>
          <p className="text-sm text-manso-cream/60">
            Cuando los clientes realicen compras, aparecerán aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-black uppercase tracking-tighter text-manso-cream">
          Pedidos Recientes ({pedidos.length})
        </h3>
        <button 
          onClick={fetchPedidos}
          className="px-4 py-2 bg-manso-cream/10 text-manso-cream rounded-xl text-xs font-bold hover:bg-manso-cream/20 transition-all"
        >
          Actualizar
        </button>
      </div>

      {pedidos.map((pedido) => (
        <div key={pedido.id} className="bg-manso-cream/5 p-6 rounded-[2rem] border border-manso-cream/10 hover:border-manso-cream/20 transition-all">
          {/* Header del pedido */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${getEstadoColor(pedido.estado)}`}>
                  {getEstadoIcon(pedido.estado)}
                  {pedido.estado.replace('_', ' ').toUpperCase()}
                </div>
                <span className="text-xs text-manso-cream/40">
                  {new Date(pedido.created_at).toLocaleString('es-AR')}
                </span>
              </div>
              <h4 className="text-lg font-bold text-manso-cream mb-1">
                {pedido.cliente_nombre}
              </h4>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-manso-terra">
                <DollarSign className="w-5 h-5" />
                <span className="text-xl font-black">${pedido.total}</span>
              </div>
            </div>
          </div>

          {/* Datos del cliente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2 text-manso-cream/80">
              <Mail className="w-4 h-4" />
              <span className="text-sm truncate">{pedido.cliente_email}</span>
            </div>
            <div className="flex items-center gap-2 text-manso-cream/80">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{pedido.cliente_telefono}</span>
            </div>
            <div className="flex items-center gap-2 text-manso-cream/80">
              <User className="w-4 h-4" />
              <span className="text-sm">DNI: {pedido.cliente_dni || 'No especificado'}</span>
            </div>
            <div className="flex items-center gap-2 text-manso-cream/80">
              <Package className="w-4 h-4" />
              <span className="text-sm">{pedido.productos.length} producto(s)</span>
            </div>
          </div>

          {/* Dirección */}
          {pedido.cliente_direccion && (
            <div className="mb-4">
              <div className="flex items-start gap-2 text-manso-cream/80">
                <div className="w-4 h-4 mt-0.5 flex-shrink-0">
                  <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-xs text-manso-cream/60 mb-1">Dirección de envío:</div>
                  <span className="text-sm">{pedido.cliente_direccion}</span>
                </div>
              </div>
            </div>
          )}

          {/* Productos */}
          <div className="mb-4">
            <div className="text-xs text-manso-cream/60 mb-2">Productos:</div>
            <div className="space-y-1">
              {pedido.productos.map((producto, index) => (
                <div key={index} className="flex justify-between items-center text-sm">
                  <span className="text-manso-cream/80">{producto.nombre}</span>
                  <span className="text-manso-cream">
                    {producto.quantity} × ${producto.precio} = ${producto.precio * producto.quantity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-between pt-4 border-t border-manso-cream/10">
            <div className="flex items-center gap-4 text-xs text-manso-cream/60">
              <div className="flex items-center gap-1">
                <Mail className={`w-3 h-3 ${pedido.notificacion_email_enviada ? 'text-green-400' : 'text-red-400'}`} />
                Email {pedido.notificacion_email_enviada ? 'enviado' : 'no enviado'}
              </div>
              <div className="flex items-center gap-1">
                <Phone className={`w-3 h-3 ${pedido.notificacion_whatsapp_enviada ? 'text-green-400' : 'text-red-400'}`} />
                WhatsApp {pedido.notificacion_whatsapp_enviada ? 'enviado' : 'no enviado'}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {pedido.estado === 'pendiente_pago' && (
                <>
                  <button
                    onClick={() => updateEstado(pedido.id, 'pagado')}
                    className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30 transition-all"
                  >
                    Marcar Pagado
                  </button>
                  <button
                    onClick={() => updateEstado(pedido.id, 'cancelado')}
                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30 transition-all"
                  >
                    Cancelar
                  </button>
                </>
              )}
              {pedido.estado === 'pagado' && (
                <button
                  onClick={() => updateEstado(pedido.id, 'enviado')}
                  className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-500/30 transition-all"
                >
                  Marcar Enviado
                </button>
              )}
              {pedido.estado === 'cancelado' && (
                <button
                  onClick={() => eliminarPedido(pedido.id, pedido.cliente_nombre)}
                  className="px-3 py-1 bg-red-600/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-600/30 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
