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
  experimental: {
    optimizePackageImports: ["@radix-ui/*"],
  },
  images: {
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
