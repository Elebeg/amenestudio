import { describe, it, expect } from 'vitest'
import { site, type SiteConfig } from '@/config/site'
import { getProject } from '@/content/projetos'
import { orgJsonLd, projectJsonLd, projectMetadata } from '@/lib/seo'
import sitemap from '@/app/sitemap'
import robots from '@/app/robots'

const projeto = getProject('apartamento-pedra')!
const real: SiteConfig = {
  ...site,
  whatsapp: { number: '5547999999999', placeholder: false },
  address: { street: 'Rua A, 10', city: 'Joinville', state: 'SC', postalCode: '89200-000', placeholder: false },
}

describe('orgJsonLd', () => {
  it('é ProfessionalService e omite address com endereço placeholder', () => {
    const o = orgJsonLd({ ...site, address: { ...site.address, placeholder: true } }) as Record<string, unknown>
    expect(o['@type']).toBe('ProfessionalService')
    expect(o).not.toHaveProperty('address')
  })
  it('omite telephone com whatsapp nulo', () => {
    const o = orgJsonLd({ ...site, whatsapp: { number: null, placeholder: true } })
    expect(o).not.toHaveProperty('telephone')
  })
  it('inclui address e telephone quando reais', () => {
    const o = orgJsonLd(real) as Record<string, unknown>
    expect(o).toHaveProperty('address')
    expect(o.telephone).toBe('+5547999999999')
  })
})

describe('projectJsonLd', () => {
  it('é CreativeWork com ImageObject absolutas', () => {
    const j = projectJsonLd(projeto, site) as { '@type': string; image: { '@type': string; url: string }[] }
    expect(j['@type']).toBe('CreativeWork')
    expect(j.image[0]['@type']).toBe('ImageObject')
    expect(j.image[0].url.startsWith(site.url)).toBe(true)
  })
})

describe('projectMetadata', () => {
  it('canonical, openGraph pt_BR e twitter large', () => {
    const m = projectMetadata(projeto, site)
    expect(m.alternates?.canonical).toBe(`/projetos/${projeto.slug}`)
    expect((m.openGraph as { locale: string }).locale).toBe('pt_BR')
    expect((m.twitter as { card: string }).card).toBe('summary_large_image')
  })
})

describe('sitemap e robots', () => {
  it('sitemap tem home, projetos e privacidade', () => {
    const urls = sitemap().map((e) => e.url)
    expect(urls).toContain(`${site.url}/projetos/apartamento-pedra`)
    expect(urls).toContain(site.url)
    expect(urls).toContain(`${site.url}/privacidade`)
  })
  it('robots permite / e aponta sitemap absoluto', () => {
    const r = robots()
    expect(r.sitemap).toBe(`${site.url}/sitemap.xml`)
  })
})
