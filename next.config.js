/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ['better-sqlite3'],
  output: 'standalone',
  allowedDevOrigins: ['192.168.1.2', '192.168.1.2:3000', 'localhost:3000', 'localhost'],
};

export default nextConfig;
