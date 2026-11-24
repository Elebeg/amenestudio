# Notas para a Fase 2

## Troca de fotos e texturas: sempre com nome novo

As fotos de `public/projetos/<slug>/` e as texturas de `public/textures/` não têm hash no nome.
Elas são servidas com cache longo:

- `next.config.ts`: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` nos `.webp`
  dessas pastas, ou seja, um dia em cache e mais uma semana revalidando em segundo plano;
- `images.minimumCacheTTL` de 31 dias (2678400 s): o otimizador do `next/image` guarda cada variante
  gerada por pelo menos 31 dias, seja qual for o cabeçalho da origem.

Com isso, substituir um arquivo mantendo o mesmo nome (por exemplo `IMG_4736.webp`) **não** atualiza
o site: navegadores, a CDN da Vercel e o cache do otimizador podem continuar mostrando a foto antiga
por semanas.

Regra: ao trocar uma foto ou textura, publique-a com **nome novo**. Para as fotos, o nome do JPEG de
origem vira o id e o `.webp` (`scripts/optimize-photos.mjs`): use um JPEG com nome novo, rode
`npm run photos` para regenerar `photos.generated.json` e atualize os ids em
`src/content/projetos/<slug>/projeto.ts`. Para as texturas, mude o nome do `.webp` e a referência no
código. Apague o arquivo antigo só depois do deploy.

## URL do site

Defina `NEXT_PUBLIC_SITE_URL` na Vercel quando o domínio definitivo existir (ver `.env.example`).
Sem ela, o build usa o domínio de produção da Vercel (`VERCEL_PROJECT_PRODUCTION_URL`).
