import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ["sharp"],
  turbopack: {
    root: __dirname,
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
