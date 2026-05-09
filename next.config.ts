import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/budget/monthly',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
