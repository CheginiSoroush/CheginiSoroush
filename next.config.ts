import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  /* config options here */
  images: {
    // Allow query-string cache-busting (e.g. ?v=2) on local images
    // (see ProjectCover COVER_VERSION).
    localPatterns: [
      {
        pathname: "/photos/**",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  devIndicators: false,
};

export default nextConfig;
