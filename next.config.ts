import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // TMDB serves pre-sized, CDN-cached images, so Vercel's optimizer adds no
    // value and burns the optimization quota. Serve them as-is.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
