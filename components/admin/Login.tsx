'use client';
import { useState, useEffect } from 'react'; // Añade useEffect

export function Login() {
  const [mounted, setMounted] = useState(false);
  // ... tus otros estados

  useEffect(() => {
    setMounted(true);
  }, []);

  // Si no está montado en el cliente, no renderizamos nada
  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-white p-4">
       {/* Tu formulario aquí */}
    </div>
  );
}