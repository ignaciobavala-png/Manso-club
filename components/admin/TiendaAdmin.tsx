'use client';

import { useState } from 'react';
import { ChevronDown, Package, ShoppingBag, CreditCard } from 'lucide-react';
import { PedidosList } from './PedidosList';
import { FormProducto } from './FormProducto';
import { ItemList } from './ItemList';
import { FormCheckoutConfig } from './FormCheckoutConfig';

interface TiendaAdminProps {
  refreshTrigger?: number;
}

type SectionId = 'pedidos' | 'productos' | 'checkout';

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: 'productos', label: 'Productos',          icon: <ShoppingBag size={14} /> },
  { id: 'pedidos',   label: 'Pedidos',            icon: <Package size={14} /> },
  { id: 'checkout',  label: 'Config. checkout',   icon: <CreditCard size={14} /> },
];

const handleEditProduct = (product: unknown) => {
  if ((window as any).editProduct) (window as any).editProduct(product);
};

export function TiendaAdmin({ refreshTrigger }: TiendaAdminProps) {
  const [open, setOpen] = useState<Set<SectionId>>(new Set(['productos']));

  const toggle = (id: SectionId) => {
    setOpen(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {SECTIONS.map(section => {
        const isOpen = open.has(section.id);
        return (
          <div
            key={section.id}
            className="bg-manso-cream/5 border border-manso-cream/10 rounded-2xl overflow-hidden"
          >
            <button
              onClick={() => toggle(section.id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-manso-cream/5 transition-colors"
            >
              <div className="flex items-center gap-3 text-manso-cream">
                <span className="text-manso-cream/40">{section.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                  {section.label}
                </span>
              </div>
              <ChevronDown
                size={14}
                className={`text-manso-cream/30 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {isOpen && (
              <div className="px-5 pb-5 border-t border-manso-cream/10 pt-5">
                {section.id === 'pedidos' && (
                  <PedidosList refreshTrigger={refreshTrigger ?? 0} />
                )}
                {section.id === 'productos' && (
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    <FormProducto />
                    <ItemList
                      table="productos"
                      title="Inventario"
                      refreshTrigger={refreshTrigger ?? 0}
                      onEdit={handleEditProduct}
                    />
                  </div>
                )}
                {section.id === 'checkout' && <FormCheckoutConfig />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
