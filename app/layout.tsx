// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Layout/Navbar";
import { FooterPlayer } from "@/components/Layout/FooterPlayer";
import { WhatsAppButton } from "@/components/UI/WhatsAppButton"; // Importación añadida

export const metadata: Metadata = {
  title: "Manso Club | Espacio Creativo",
  description: "Cultura electrónica y diseño en Buenos Aires",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased text-manso-cream selection:bg-manso-terra selection:text-manso-white min-h-screen flex flex-col bg-white">
        <Navbar />
        
        {/* IMPORTANTE: El main tiene 'relative' y el FooterPlayer está FUERA 
            para evitar que sus capas fijas tapen los inputs del Login.
        */}
        <main className="flex-auto relative bg-white">
          {children}
        </main>

        <FooterPlayer /> 
        <WhatsAppButton />
      </body>
    </html>
  );
}