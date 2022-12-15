/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      "media.api-sports.io",
      "media-1.api-sports.io",
      "media-2.api-sports.io",
      "media-3.api-sports.io",
      "media-4.api-sports.io",
      "media-5.api-sports.io",
      "media-6.api-sports.io",
      "media-7.api-sports.io",
    ],
  },
};

module.exports = nextConfig;
