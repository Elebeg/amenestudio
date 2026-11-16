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
}

export const site: SiteConfig = {
  name: 'Amene',
  url: 'https://amenestudio.vercel.app', // provisório
  description: 'Escritório de arquitetura e interiores Amene.',
  whatsapp: { number: null, placeholder: true },
  instagram: { handle: 'amenestudio', url: 'https://www.instagram.com/amenestudio/', placeholder: true },
  address: { street: 'A definir', city: 'A definir', state: 'SC', postalCode: '00000-000', placeholder: true },
  cnpj: null,
  cau: null,
  intro: { videoSrc: null },
}
