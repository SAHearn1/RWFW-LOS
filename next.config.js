/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    dirs: ['app', 'lib'],
  },
};

module.exports = nextConfig;
