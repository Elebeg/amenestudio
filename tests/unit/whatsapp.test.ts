import { describe, it, expect } from 'vitest'
import { buildLeadMessage, buildWhatsAppUrl, leadSchema } from '@/lib/whatsapp'

const lead = { nome: 'José & Maria #1 🏡', tipo: 'Outro', cidade: 'São José', metragem: 120 } as const

describe('whatsapp', () => {
  it('retorna null sem número', () => {
    expect(buildWhatsAppUrl(null, lead)).toBeNull()
  })
  it('monta a URL com o texto codificado', () => {
    const url = buildWhatsAppUrl('5547999999999', lead)!
    expect(url.startsWith('https://wa.me/5547999999999?text=')).toBe(true)
    expect(decodeURIComponent(url.split('text=')[1])).toBe(buildLeadMessage(lead))
  })
  it('mensagem exata', () => {
    expect(buildLeadMessage(lead)).toBe(
      'Olá, Amene! Vim pelo site.\nNome: José & Maria #1 🏡\nProjeto: Outro\nCidade: São José\nMetragem: 120 m²',
    )
  })
  it('omite metragem quando vazia', () => {
    expect(buildLeadMessage({ ...lead, metragem: undefined })).not.toContain('Metragem')
  })
  it('valida o schema', () => {
    expect(leadSchema.safeParse({ nome: ' ', tipo: 'Outro', cidade: 'X' }).success).toBe(false)
    expect(leadSchema.safeParse({ nome: 'Ana', tipo: 'Comercial', cidade: 'Joinville' }).success).toBe(true)
    expect(leadSchema.safeParse({ nome: 'Ana', tipo: 'Comercial', cidade: 'Joinville', metragem: '' }).success).toBe(true)
    expect(leadSchema.safeParse({ nome: 'Ana', tipo: 'Comercial', cidade: 'Joinville', metragem: 9 }).success).toBe(false)
    expect(leadSchema.safeParse({ nome: 'Ana', tipo: 'Comercial', cidade: 'Joinville', metragem: 5001 }).success).toBe(false)
    expect(leadSchema.safeParse({ nome: 'Ana', tipo: 'Casa', cidade: 'Joinville' }).success).toBe(false)
  })
})
