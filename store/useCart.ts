// store/useCart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Product {
  id: string;
  nombre: string;
  precio: number;
  imagenes_urls: string[];
}

interface CartItem extends Product {
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  total: () => number;
  checkout: () => void;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((item) => item.id === product.id);

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
      total: () => get().items.reduce((acc, item) => acc + item.precio * item.quantity, 0),
      checkout: () => {
        const items = get().items
        const texto = items.map(i => 
          `• ${i.nombre} x${i.quantity} — $${i.precio}` 
        ).join('\n')
        const mensaje = encodeURIComponent(
          `Hola! Quiero hacer un pedido:\n\n${texto}\n\nTotal: $${get().total()}` 
        )
        window.open(`https://wa.me/5491130232533?text=${mensaje}`, '_blank')
      },
    }),
    { name: 'manso-cart-storage' } // Nombre de la cookie/localStorage
  )
);