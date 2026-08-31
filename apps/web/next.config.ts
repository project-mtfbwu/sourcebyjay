import type { NextConfig } from 'next';

const vendorOrigin = process.env.NEXT_PUBLIC_VENDOR_ORIGIN ?? 'http://localhost:3001';

/** Dev: allow vendor on localhost, LAN IP, or env-configured origin to embed preview iframe */
const previewFrameAncestors =
  process.env.NODE_ENV === 'development'
    ? `'self' ${vendorOrigin} http://localhost:3001 http://127.0.0.1:3001 *`
    : `'self' ${vendorOrigin} http://localhost:3001 http://127.0.0.1:3001`;

function buildCsp(frameAncestors: string) {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https: http://127.0.0.1:54321 http://localhost:54321",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co http://127.0.0.1:54321 http://localhost:54321 ws://127.0.0.1:54321 ws://localhost:54321 https://api.groq.com https://*.posthog.com https://us.i.posthog.com https://eu.i.posthog.com https://*.sentry.io https://*.ingest.sentry.io",
    `frame-ancestors ${frameAncestors}`,
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
}

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

/** Embedded in vendor iframe — skip restrictive Permissions-Policy */
const previewHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

const config: NextConfig = {
  transpilePackages: ['@sourcebyjay/observability'],
  cacheComponents: true,
  partialPrefetching: true,
  async headers() {
    return [
      {
        source: '/((?!preview).*)',
        headers: [
          ...securityHeaders,
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: buildCsp("'none'") },
        ],
      },
      {
        // Vendor portal embeds this for Facebook Ad Library–style live preview
        source: '/preview/:path*',
        headers: [
          ...previewHeaders,
          {
            key: 'Content-Security-Policy',
            value: buildCsp(previewFrameAncestors),
          },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '54321',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default config;
