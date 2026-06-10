import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  env: {
    R2_STATIC_MEDIA_BUCKET_PUBID: process.env.R2_STATIC_MEDIA_BUCKET_PUBID,
    R2_USERMEDIA_BUCKET_PUBID: process.env.R2_USERMEDIA_BUCKET_PUBID,
  },
};

export default nextConfig;
