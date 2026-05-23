import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: isProd ? "export" : undefined,
  async rewrites() {
    if (isProd) return [];
    
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "https://u9zfrut1t9.execute-api.ap-south-1.amazonaws.com/dev";
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
