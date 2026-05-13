/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'media.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-1.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-2.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-3.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-4.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-5.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-6.api-sports.io',
      },
      {
        protocol: 'https',
        hostname: 'media-7.api-sports.io',
      },
    ],
  },
};

module.exports = nextConfig;
