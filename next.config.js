/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'vercel.app'],
    unoptimized: false
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(pdf|doc|docx|xls|xlsx|txt|jpg|jpeg|png|gif)$/i,
      type: 'asset/resource',
    });
    return config;
  },
  async headers() {
    return [
      {
        // matching all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,DELETE,PATCH,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ]
      }
    ]
  },
  trailingSlash: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverComponentsExternalPackages: ['mongoose']
  }
};

module.exports = nextConfig;