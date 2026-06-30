/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'sqlite3', 'tesseract.js'],
};

export default nextConfig;
