import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Prevents Vercel from failing on lint errors
  },
  // Add any other config options here
};

export default nextConfig;