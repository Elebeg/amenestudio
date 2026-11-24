export type SiteConfig = {
  name: 'Amene'
  url: string
  description: string
  whatsapp: { number: string | null; placeholder: boolean } // só dígitos com DDI, ex. "5547999999999"
  instagram: { handle: string; url: string; placeholder: boolean }
  address: { street: string; city: string; state: string; postalCode: string; placeholder: boolean }
  cnpj: string | null
  cau: string | null
  intro: { videoSrc: string | null } // Fase 2 preenche
  manifesto: { texto: string; placeholder: boolean }
  processo: { intro: string; etapas: { titulo: string; descricao: string }[]; placeholder: boolean }
  estudio: { titulo: string; texto: string[]; cidade: string; placeholder: boolean }
}

type SiteEnv = { NEXT_PUBLIC_SITE_URL?: string; VERCEL_PROJECT_PRODUCTION_URL?: string }

/**
 * URL pública do site (metadataBase, canonical, Open Graph, sitemap, robots e JSON-LD).
 * 1. NEXT_PUBLIC_SITE_URL, quando o domínio definitivo existir (ver .env.example);
 * 2. o domínio de produção que a Vercel injeta no build (sem protocolo);
 * 3. localhost em desenvolvimento.
 * Barra final removida: as rotas são montadas como `${site.url}/caminho`.
 */
export function resolveSiteUrl(env: SiteEnv): string {
  const explicit = env.NEXT_PUBLIC_SITE_URL?.trim()
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim()
  const url = explicit || (vercel ? `https://${vercel}` : 'http://localhost:3000')
  return url.replace(/\/+$/, '')
}

export const site: SiteConfig = {
  name: 'Amene',
  // acesso literal a cada variável: o Next só embute no bundle do cliente `process.env.NOME`
  url: resolveSiteUrl({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL,
  }),
  description: 'Escritório de arquitetura e interiores Amene.',
  whatsapp: { number: null, placeholder: true },
  instagram: { handle: 'amenestudio', url: 'https://www.instagram.com/amenestudio/', placeholder: true },
  address: { street: 'A definir', city: 'A definir', state: 'SC', postalCode: '00000-000', placeholder: true },
  cnpj: null,
  cau: null,
  intro: { videoSrc: null },
  // Textos provisórios, a validar com o escritório.
  manifesto: {
    texto: 'Casas que acordam devagar: pedra, madeira e luz natural desenhadas para a rotina de quem mora.',
    placeholder: true,
  },
  processo: {
    intro: 'Do primeiro café à entrega das chaves, cada etapa tem começo, meio e fim claros.',
    etapas: [
      {
        titulo: 'Briefing',
        descricao: 'Uma conversa longa sobre a rotina, os hábitos e os desejos da casa, com visita ao imóvel.',
      },
      {
        titulo: 'Estudo preliminar',
        descricao: 'Layout, volumetria e paleta de materiais apresentados em plantas e imagens para alinhar a ideia.',
      },
      {
        titulo: 'Projeto executivo',
        descricao: 'Detalhamento de marcenaria, iluminação, revestimentos e pontos técnicos, pronto para orçar e construir.',
      },
      {
        titulo: 'Acompanhamento de obra',
        descricao: 'Visitas à obra e diálogo com fornecedores para que o desenho chegue inteiro ao resultado final.',
      },
    ],
    placeholder: true,
  },
  estudio: {
    titulo: 'Um estúdio pequeno, de olhar atento',
    texto: [
      'A Amene é um escritório de arquitetura e interiores que trabalha com poucos projetos por vez, para acompanhar cada um de perto.',
      'Partimos dos materiais naturais e da luz de cada ambiente para desenhar casas serenas, feitas para durar e para envelhecer bem.',
    ],
    cidade: 'Santa Catarina',
    placeholder: true,
  },
}
