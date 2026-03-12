import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ['@react-email/components', '@react-email/render'],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
