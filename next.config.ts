import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  outputFileTracingIncludes: {
    "/api/mailing/**": [
      "./node_modules/.pnpm/@img+sharp-linux-x64@*/node_modules/@img/sharp-linux-x64/**/*",
      "./node_modules/.pnpm/@img+sharp-libvips-linux-x64@*/node_modules/@img/sharp-libvips-linux-x64/**/*",
    ],
  },
  turbopack: {
    root: __dirname,
  },
  // Las imágenes de los mails se sirven desde mansoclub.com.ar y no desde
  // *.supabase.co. Los filtros de spam penalizan que un mail cargue su
  // contenido desde un dominio ajeno al remitente ("Host images on the sending
  // domain" en el reporte de deliverability de Resend), y estas campañas son
  // casi enteramente imágenes, así que la señal pesa. El rewrite hace de proxy
  // hacia el bucket público "emails": la URL que ve el cliente de correo es del
  // dominio propio, el archivo sigue viviendo en Supabase Storage.
  async rewrites() {
    return [
      {
        source: "/email-assets/:path*",
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/emails/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.in',
      },
    ],
  },
};
export default nextConfig;
