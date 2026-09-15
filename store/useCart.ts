// store/useCart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { totalEn, type Moneda } from '@/lib/precios';

interface Product {
  id: string;
  nombre: string;
  /** Precio tal como se cargó en el panel, en `moneda`. */
  precio: number;
  /** Moneda de referencia del producto; los ítems viejos del localStorage no la tienen. */
  moneda?: Moneda | string | null;
  imagenes_urls: string[];
  stock?: number; // Stock opcional para validación
}

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  /**
   * Total del carrito en una moneda. Devuelve `null` si hay que convertir
   * algún ítem y todavía no llegó la cotización.
   */
  total: (moneda: Moneda, cotizacion: number | null) => number | null;
  checkout: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);
        
        // Validar stock si está disponible
        const maxStock = product.stock || Number.MAX_SAFE_INTEGER;
        const currentQuantity = existingItem?.quantity || 0;
        
        if (currentQuantity >= maxStock) {
          // No agregar si ya alcanzó el máximo stock
          return;
        }

        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          });
        } else {
          set({ items: [...currentItems, { ...product, quantity: 1 }] });
        }
      },
      removeItem: (id) => set({ items: get().items.filter((item) => item.id !== id) }),
      clearCart: () => set({ items: [] }),
      total: (moneda, cotizacion) => totalEn(get().items, moneda, cotizacion),
      checkout: () => {
        // Redirigir a la página de checkout
        console.log('DEBUG: Checkout function called, redirecting to /checkout');
        window.location.href = '/checkout';
      },
    }),
    { name: 'manso-cart-storage' } // Nombre de la cookie/localStorage
  )
);