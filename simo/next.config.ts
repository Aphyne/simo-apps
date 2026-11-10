import type { NextConfig } from "next";

// Header keamanan untuk semua rute (T-12).
// CSP sengaja Report-Only: hanya melaporkan di konsol browser, TIDAK memblokir.
// Perketat (enforcing) baru setelah diamati aman, terutama untuk Google Identity.
const csp = [
  "default-src 'self'",
  // Next memakai skrip/gaya inline; Google Identity Services memuat skrip dari accounts.google.com
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://apis.google.com",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://*.googleusercontent.com https://*.gstatic.com",
  // API backend (host/port berbeda per lingkungan) + Google
  "connect-src 'self' https: http://localhost:* https://accounts.google.com",
  "frame-src 'self' https://accounts.google.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
