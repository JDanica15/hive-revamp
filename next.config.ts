import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "hivebpo.com" },
    ],
  },
  // Permanent redirects from the old static-export URLs (…/index.html) to clean URLs,
  // so any existing links or indexed pages keep their ranking.
  async redirects() {
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/careers/index.html", destination: "/careers", permanent: true },
      { source: "/events/index.html", destination: "/events", permanent: true },
      { source: "/events/:id/index.html", destination: "/events/:id", permanent: true },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/media/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
