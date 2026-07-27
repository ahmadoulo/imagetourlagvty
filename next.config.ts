import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      {
        source: '/storage/:path*',
        destination: `${process.env.S3_ENDPOINT || 'http://localhost:9000'}/:path*`,
      },
    ];
  },
};

export default nextConfig;
