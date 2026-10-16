import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  images: {
    // Allow query-string cache-busting (e.g. ?v=2) on local images
    // (see ProjectCover COVER_VERSION).
    localPatterns: [
      {
        pathname: "/photos/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: true,
  devIndicators: false,
  // Don't advertise the framework version (`x-powered-by: Next.js`).
  poweredByHeader: false,

  // Security headers on every response (audit FIND-004 / Phase C).
  // CSP ships Report-Only first so real violations can be observed from the
  // browser console without any risk of breaking the site; frame-ancestors
  // therefore has no enforcement effect yet — X-Frame-Options: DENY covers
  // clickjacking in the meantime. Hardening to enforcing CSP is a follow-up
  // once the report phase is quiet.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            // Clipboard is intentionally NOT restricted (copy-link buttons).
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "img-src 'self' data: blob: https:",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://api.github.com https://raw.githubusercontent.com",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
