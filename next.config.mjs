/** @type {import('next').NextConfig} */
const nextConfig = {
    async redirects() {
      return [
        {
          source: '/',
          destination: '/ideationchat',
          permanent: true,
        },
      ];
    },
  };
  
  export default nextConfig;