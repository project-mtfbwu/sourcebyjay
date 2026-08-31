import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@sourcebyjay/auth', '@sourcebyjay/types', '@sourcebyjay/observability', 'chonky2'],
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
};

export default config;
