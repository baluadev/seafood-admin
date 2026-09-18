import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone', // ← Bắt buộc cho Docker deployment
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
};

export default nextConfig;
