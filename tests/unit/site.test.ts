import { describe, it, expect } from 'vitest'
import { resolveSiteUrl, site } from '@/config/site'

describe('site config', () => {
  it('whatsapp number is null or digits only with country code', () => {
    const n = site.whatsapp.number
    expect(n === null || /^55\d{10,11}$/.test(n)).toBe(true)
  })
  it('instagram url matches handle', () =>
    expect(site.instagram.url).toBe(`https://www.instagram.com/${site.instagram.handle}/`))
})

describe('textos institucionais (placeholder)', () => {
  it('manifesto é uma frase provisória marcada', () => {
    expect(site.manifesto.texto.split(' ').length).toBeGreaterThan(5)
    expect(site.manifesto.placeholder).toBe(true)
  })
  it('processo segue a sequência real do spec', () => {
    expect(site.processo.etapas.map((e) => e.titulo)).toEqual([
      'Briefing',
      'Estudo preliminar',
      'Projeto executivo',
      'Acompanhamento de obra',
    ])
    for (const e of site.processo.etapas) expect(e.descricao.length).toBeGreaterThan(20)
  })
  it('estúdio tem texto e cidade', () => {
    expect(site.estudio.texto.length).toBeGreaterThan(0)
    expect(site.estudio.cidade.length).toBeGreaterThan(0)
    expect(site.estudio.placeholder).toBe(true)
  })
})

describe('resolveSiteUrl', () => {
  it('NEXT_PUBLIC_SITE_URL vence tudo (sem barra final)', () => {
    expect(
      resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: 'https://amene.arq.br/', VERCEL_PROJECT_PRODUCTION_URL: 'amene.vercel.app' }),
    ).toBe('https://amene.arq.br')
  })
  it('sem a variável explícita, usa o domínio de produção da Vercel com https', () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'amene.vercel.app' })).toBe('https://amene.vercel.app')
  })
  it('sem nada (ou vazio), cai em localhost', () => {
    expect(resolveSiteUrl({})).toBe('http://localhost:3000')
    expect(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: '', VERCEL_PROJECT_PRODUCTION_URL: '' })).toBe('http://localhost:3000')
  })
  it('site.url é uma URL absoluta válida', () => {
    expect(() => new URL(site.url)).not.toThrow()
    expect(site.url.endsWith('/')).toBe(false)
  })
})
