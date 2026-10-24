import type { NextConfig } from "next";

/**
 * Baseline security headers (SECURITY.md → HTTPS only, no leakage).
 * CSP stays permissive on scripts/styles because Next.js injects inline
 * bootstrap scripts; everything else is locked down.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // No popups or cross-window flows are used, so isolate the browsing context (blocks XS-Leaks).
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // Pin the workspace root so a stray lockfile elsewhere on the machine does
  // not make Next.js guess the wrong project directory.
  outputFileTracingRoot: __dirname,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  poweredByHeader: false,
  // Render <title>/<meta> inside <head> for every client. Next 15.5 otherwise streams
  // metadata into <body> for browsers, which crawlers and Lighthouse report as missing.
  htmlLimitedBots: /.*/,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
