import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Checkout | Manso Club',
  description: 'Finalizá tu compra en Manso Club.',
  robots: { index: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
