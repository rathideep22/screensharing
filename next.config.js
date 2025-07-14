/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Ensure HTTPS is used in production for getDisplayMedia API
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'display-capture=self'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig 