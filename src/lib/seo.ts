import type { Metadata } from 'next'
import type { SiteConfig } from '@/config/site'
import { getPhoto, type Projeto } from '@/content/projetos'

const abs = (s: SiteConfig, path: string) => `${s.url}${path}`

export function orgJsonLd(s: SiteConfig): object {
  const o: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: s.name,
    description: s.description,
    url: s.url,
    sameAs: [s.instagram.url],
  }
  if (!s.address.placeholder) {
    o.address = {
      '@type': 'PostalAddress',
      streetAddress: s.address.street,
      addressLocality: s.address.city,
      addressRegion: s.address.state,
      postalCode: s.address.postalCode,
      addressCountry: 'BR',
    }
  }
  if (s.whatsapp.number) o.telephone = `+${s.whatsapp.number}`
  return o
}

function projectPhotoIds(p: Projeto): string[] {
  return [...new Set([p.capa, ...p.rooms.map((r) => r.capa), ...p.rooms.flatMap((r) => r.fotos)])]
}

export function projectJsonLd(p: Projeto, s: SiteConfig): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.nome,
    description: p.conceito,
    url: abs(s, `/projetos/${p.slug}`),
    creator: { '@type': 'ProfessionalService', name: s.name, url: s.url },
    ...(p.ano ? { dateCreated: String(p.ano) } : {}),
    image: projectPhotoIds(p).map((id) => {
      const f = getPhoto(id)
      return { '@type': 'ImageObject', url: abs(s, f.src), width: f.width, height: f.height }
    }),
  }
}

export function projectMetadata(p: Projeto, s: SiteConfig): Metadata {
  const path = `/projetos/${p.slug}`
  return {
    title: p.nome,
    description: p.conceito,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      locale: 'pt_BR',
      siteName: s.name,
      title: `${p.nome} · ${s.name}`,
      description: p.conceito,
      url: path,
    },
    twitter: { card: 'summary_large_image', title: `${p.nome} · ${s.name}`, description: p.conceito },
  }
}

/** Serializa JSON-LD para <script>, escapando "<" para não fechar a tag. */
export const jsonLdString = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c')
