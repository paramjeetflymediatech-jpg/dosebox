/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['sequelize', 'pdfkit', 'fontkit'],
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
