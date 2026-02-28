/** @type {import('next').NextConfig} */

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload"
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === "development" ? "'unsafe-eval'" : ""} https://clerk.rwfw-los.com https://*.clerk.com`.trim(),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https://*.clerk.com https://img.clerk.com",
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https://clerk.rwfw-los.com https://accounts.rwfw-los.com https://api.clerk.com wss:",
      "frame-src 'none'",
      "object-src 'none'",
      "base-uri 'self'"
    ].join("; ")
  }
];

const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ["app", "lib"]
  },
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

module.exports = nextConfig;
