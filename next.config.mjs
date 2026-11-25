// O id da loja do Blob está no token (lido no build). Sem ele, aceita qualquer loja.
const blobStoreId = process.env.BLOB_READ_WRITE_TOKEN?.match(/^vercel_blob_rw_([A-Za-z0-9]+)_/)?.[1];
const blobHostname = `${blobStoreId?.toLowerCase() ?? '*'}.public.blob.vercel-storage.com`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove o header `X-Powered-By: Next.js` (fingerprint de framework).
  poweredByHeader: false,
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
          // Content-Security-Policy: montada em proxy.js, com nonce por resposta.
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
      {
        protocol: 'https',
        hostname: blobHostname,
        pathname: '/**',
      },
    ],
  },
  compiler: {
    // Também vale para o servidor: error e warn precisam ficar para haver log em produção.
    removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
  },
  experimental: {
    workerThreads: true,
    webpackBuildWorker: false,
  },
};

// Force rebuild comment - 2026-02-02
export default nextConfig;
