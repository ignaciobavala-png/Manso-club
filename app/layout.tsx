// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Navbar } from "@/components/Layout/Navbar";
import { Footer } from "@/components/Layout/Footer";
import { GlobalMusicPlayer } from "@/components/Layout/GlobalMusicPlayer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";

export const metadata: Metadata = {
  title: "Manso Club | Espacio Creativo",
  description: "Cultura electrónica y diseño en Buenos Aires",
  verification: {
    google: '_WJR-FPgtK6p2hcrhWfWvegrKEyMxw5Jkyx6Qqj4XZo',
    other: {
      "facebook-domain-verification": "nvn6bg2zurylkrkhpkuusxsrida80v",
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="scroll-smooth">
      <body className="antialiased text-manso-cream selection:bg-manso-terra selection:text-manso-white min-h-screen flex flex-col bg-white">
        {/* GTM — noscript fallback (must be right after <body>) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WG2WMR9R"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>

        <Navbar />
        
        {/* IMPORTANTE: El main tiene 'relative' y el Footer está FUERA 
            para evitar que sus capas fijas tapen los inputs del Login.
        */}
        <main className="flex-auto relative bg-white">
          {children}
        </main>

        <Footer /> 
        <GlobalMusicPlayer />
        <WhatsAppButton />

        {/* ── Google Tag Manager ── */}
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WG2WMR9R');`,
          }}
        />

        {/* ── Google Analytics ── */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-ELTTJ2QYM8"
          strategy="afterInteractive"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-ELTTJ2QYM8');`,
          }}
        />

        {/* ── Meta (Facebook) Pixel ── */}
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '2108439099695813');
fbq('track', 'PageView');`,
          }}
        />
        <noscript>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=2108439099695813&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>
      </body>
    </html>
  );
}