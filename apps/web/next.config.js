/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // standalone enables minimal Docker image (apps/web/.next/standalone)
  output: 'standalone',
  transpilePackages: ['@metroai/types', '@metroai/utils'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
