import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Item images are uploaded through a server action, and the default
  // 1 MB body limit is smaller than a product photo. The API caps at 4 MB.
  experimental: {
    serverActions: { bodySizeLimit: "5mb" },
    agentUpgrade: "security",
  },
  // Item images are served from the public Backblaze bucket.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "f005.backblazeb2.com", pathname: "/file/**" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
