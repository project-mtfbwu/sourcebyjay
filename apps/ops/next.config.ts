import type { NextConfig } from 'next';

const config: NextConfig = {
  transpilePackages: ['@sourcebyjay/auth', '@sourcebyjay/types', '@sourcebyjay/observability'],
};

export default config;
