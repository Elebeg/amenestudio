import type { NextConfig } from "next";

const longCache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 2678400 },
  async headers() {
    // texturas e fotos em /public não têm hash no nome: cache de um dia, revalidando em segundo plano
    return [
      { source: "/textures/:path*", headers: longCache },
      { source: "/projetos/:path*", headers: longCache },
    ];
  },
};

export default nextConfig;
