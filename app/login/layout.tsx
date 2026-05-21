import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Iniciar sesión | Manso Club',
  description: 'Iniciá sesión en Manso Club para acceder a tu cuenta.',
  robots: { index: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
