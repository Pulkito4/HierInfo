import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // Allow all HTTPS domains for news images
      },
      {
        protocol: 'http',
        hostname: '**', // Allow all HTTP domains (some news sites use HTTP)
      }
    ],
  },
};

export default nextConfig;
