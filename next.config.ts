import type { NextConfig } from "next";

const longCache = [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }];

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  images: { formats: ["image/avif", "image/webp"], minimumCacheTTL: 2678400 },
  async headers() {
    // texturas e fotos em /public não têm hash no nome: cache de um dia, revalidando em segundo plano.
    // Só os arquivos de imagem: a página /projetos/<slug>, o payload RSC e o 404 ficam com o padrão do Next.
    // Trocar uma foto exige nome novo (ver docs/fase-2-notas.md).
    return [
      { source: "/textures/:file(.*\\.webp)", headers: longCache },
      { source: "/projetos/:slug/:file(.*\\.webp)", headers: longCache },
    ];
  },
};

export default nextConfig;
