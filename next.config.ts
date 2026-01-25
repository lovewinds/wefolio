import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/summary/monthly',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
