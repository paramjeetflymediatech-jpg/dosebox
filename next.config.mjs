/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ['sequelize', 'pg', 'pg-hstore', 'sqlite3', 'tesseract.js', 'pdfkit', 'fontkit'],
  async rewrites() {
    return [
      {
        source: '/uploads/:path*',
        destination: '/api/file/:path*',
      },
    ];
  },
};

export default nextConfig;
