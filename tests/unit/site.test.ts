import { describe, it, expect } from 'vitest'
import { site } from '@/config/site'

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
