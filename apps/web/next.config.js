/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // 允许 Next.js 编译 workspace 中的共享包
  transpilePackages: ['shared-constants', 'shared-types', 'shared-utils'],
};
module.exports = nextConfig;
