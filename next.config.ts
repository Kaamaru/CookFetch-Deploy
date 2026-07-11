import type { NextConfig } from "next";

const allowedDevOrigins = [
  "cookfetch.octodoku.top",
  "api.octodoku.top",
  "cookfetch-api.up.railway.app",
  "cookfetchdev.octodoku.top",
  "cookfetch.kaamaru.com",
  "api.cookfetch.kaamaru.com"
];
// const backendOrigin = process.env.BACKEND_ORIGIN || "https://api.octodoku.top";
const backendOrigin = process.env.BACKEND_ORIGIN || "https://cookfetch-api.up.railway.app";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  allowedDevOrigins,
  poweredByHeader: false,
  compiler: {
    // Strip console.* (except error/warn) from production bundles.
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  experimental: {
    // Tree-shake large barrel packages so only used exports ship.
    optimizePackageImports: ["@radix-ui/*", "lucide-react", "date-fns"],
  },
  images: {
    // Serve modern, smaller formats when using next/image.
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/api/proxy/:path*",
        destination: `${backendOrigin}/:path*`,
      },
    ];
  },
};

export default nextConfig;
