/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@metroai/types', '@metroai/utils'],
  experimental: {
    typedRoutes: true,
  },
};

module.exports = nextConfig;
