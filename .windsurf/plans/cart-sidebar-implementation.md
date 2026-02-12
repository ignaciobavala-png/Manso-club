# Plan: Implementar Carrito Sidebar Interactivo

Este plan detalla la implementación de un sidebar/carrito deslizable que se abre al hacer clic en el icono del carrito en el navbar, mostrando los productos agregados con funcionalidades para modificar cantidades y eliminar items.

## Análisis del Problema

El icono del carrito en el navbar actualmente:
- ✅ Muestra el contador de productos correctamente
- ✅ Se actualiza al agregar productos
- ❌ **NO tiene funcionalidad de click para abrir el carrito**
- ❌ **No existe componente de vista del carrito**

## Solución Propuesta

### 1. Crear Componente CartSidebar
- **Ubicación**: `components/shop/CartSidebar.tsx`
- **Funcionalidades**:
  - Panel deslizable desde la derecha
  - Lista de productos en el carrito
  - Controles de cantidad (+/-)
  - Botón de eliminar producto
  - Mostrar total del carrito
  - Botón de checkout/proceder al pago
  - Botón para cerrar el panel

### 2. Modificar Navbar
- Agregar estado para controlar la visibilidad del sidebar
- Agregar evento `onClick` al icono `ShoppingBag`
- Pasar el estado del carrito al componente sidebar

### 3. Integración con Store
- Usar las acciones existentes: `addItem`, `removeItem`, `clearCart`
- Calcular totales usando la función `total()` del store
- Mantener sincronización con persistencia local

## Componentes a Crear/Modificar

### Nuevo: `components/shop/CartSidebar.tsx`
```typescript
interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

// Funcionalidades:
- Renderizado condicional con animaciones
- Lista de items del carrito
- Controles de cantidad
- Cálculo de totales
- Acciones de eliminar/vaciar
```

### Modificar: `components/Layout/Navbar.tsx`
```typescript
// Agregar:
const [isCartOpen, setIsCartOpen] = useState(false);

// Modificar icono ShoppingBag:
<div className="relative group cursor-pointer" onClick={() => setIsCartOpen(true)}>
  <ShoppingBag ... />
  {/* badge existente */}
</div>

// Agregar componente:
{isCartOpen && <CartSidebar isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />}
```

## Estilos y UX

### Diseño Visual
- Panel deslizable desde derecha con overlay
- Estilos consistentes con el diseño Manso Club
- Animaciones suaves de entrada/salida
- Responsive para mobile y desktop

### Interacciones
- Click fuera del panel para cerrar
- Tecla ESC para cerrar
- Botón X explícito para cerrar
- Transiciones fluidas

## Validaciones

### Testing Funcional
- ✅ Abrir/cerrar carrito
- ✅ Agregar productos (ya funciona)
- ✅ Modificar cantidades
- ✅ Eliminar productos individuales
- ✅ Vaciar carrito completo
- ✅ Calcular totales correctamente
- ✅ Persistencia local (ya funciona)

### Edge Cases
- Carrito vacío (mostrar mensaje)
- Límites de cantidad (min/max)
- Estados de carga
- Errores de sincronización

## Implementación

1. **Crear componente CartSidebar** con toda la UI y lógica
2. **Modificar Navbar** para integrar el sidebar
3. **Testear funcionalidad completa** del flujo de compra
4. **Optimizar estilos** para consistencia visual

## Impacto

Esta implementación completará el flujo de e-commerce permitiendo a los usuarios:
- Ver los productos agregados
- Modificar su selección antes del checkout
- Tener una experiencia completa de carrito de compras

El resultado será un carrito completamente funcional que se integra perfectamente con el sistema existente.
