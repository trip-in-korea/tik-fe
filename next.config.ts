import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'http',
        hostname: '**.visitkorea.or.kr',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.visitkorea.or.kr',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
