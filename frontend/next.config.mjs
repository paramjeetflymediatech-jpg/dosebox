/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export', // Removed to allow dynamic [id] routes in admin dashboard
  distDir: 'out',
  trailingSlash: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  }
};

export default nextConfig;
