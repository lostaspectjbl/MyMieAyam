import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        // Supabase Storage
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Supabase CDN
        protocol: 'https',
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      },
      {
        // Placeholder images (dev/testing)
        protocol: 'https',
        hostname: 'placehold.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            // Izinkan Google Maps embed, cegah website MMA di-embed di tempat lain
            // Tidak pakai script-src restriction terpisah karena memblokir
            // inline script next-themes yang inject class 'dark' ke <html>
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in https://placehold.co",
              "frame-src 'self' https://www.google.com https://maps.google.com https://google.com",
              "connect-src 'self' https://*.supabase.co https://*.supabase.in wss://*.supabase.co https://fonts.googleapis.com https://fonts.gstatic.com",
            ].join('; '),
          },
        ],
      },
    ]
  },
};

export default nextConfig;
