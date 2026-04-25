/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            // Header descontinuado e com bugs em navegadores antigos.
            // Recomendação atual (OWASP): 0 + CSP forte.
            key: 'X-XSS-Protection',
            value: '0'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            // unsafe-eval removido. unsafe-inline mantido por necessidade
            // do Next.js (scripts inline para hidratação). Próximo passo:
            // migrar para nonces via middleware para remover unsafe-inline.
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' fonts.googleapis.com; img-src 'self' data: blob: *.openstreetmap.org images.unsplash.com *.google.com *.googleapis.com *.gstatic.com; font-src 'self' data: fonts.gstatic.com; connect-src 'self' *.openstreetmap.org; frame-src 'self' https://*.google.com; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self';"
          },
          {
            key: 'Permissions-Policy',
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()"
          }
        ]
      }
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  experimental: {
    workerThreads: true,
    webpackBuildWorker: false,
  },
};

// Force rebuild comment - 2026-02-02
export default nextConfig;
