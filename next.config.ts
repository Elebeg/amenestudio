import type { NextConfig } from "next";

const longCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    // texturas e fotos em /public têm nome estável e só mudam por script: cache longo
    return [
      { source: "/textures/:path*", headers: longCache },
      { source: "/projetos/:path*", headers: longCache },
    ];
  },
};

export default nextConfig;
