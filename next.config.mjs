/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
      {
        source: '/ideationchat',
        destination: '/dashboard',
        permanent: false,
      }
    ];
  },
};

export default nextConfig;