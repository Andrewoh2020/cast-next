import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-email/components', '@react-email/render', 'resend'],
  images: {
    localPatterns: [
      { pathname: '/api/media/**' },
      { pathname: '/**' },
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;
