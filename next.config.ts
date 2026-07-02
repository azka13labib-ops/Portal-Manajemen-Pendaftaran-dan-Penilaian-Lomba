import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'aymjkffkwmgsbltlxsru.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/events',
        destination: '/',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
