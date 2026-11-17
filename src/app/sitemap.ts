import type { MetadataRoute } from 'next'
import { site } from '@/config/site'
import { getProjects } from '@/content/projetos'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: site.url, changeFrequency: 'monthly', priority: 1 },
    ...getProjects().map((p) => ({
      url: `${site.url}/projetos/${p.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
    { url: `${site.url}/privacidade`, changeFrequency: 'yearly', priority: 0.2 },
  ]
}
