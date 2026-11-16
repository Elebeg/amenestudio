import { z } from 'zod'

export const TIPOS = ['Residencial completo', 'Ambiente específico', 'Comercial', 'Outro'] as const

export const ERROS = {
  nome: 'Conte seu nome para a gente',
  tipo: 'Escolha o tipo de projeto',
  cidade: 'Em qual cidade é o projeto?',
  metragem: 'Use só números, entre 10 e 5000',
} as const

const metragemSchema = z.preprocess(
  (v) => {
    if (v === undefined || v === null) return undefined
    if (typeof v === 'string') {
      const s = v.trim().replace(',', '.')
      return s === '' ? undefined : Number(s)
    }
    return v
  },
  z.number({ error: ERROS.metragem }).min(10, ERROS.metragem).max(5000, ERROS.metragem).optional(),
)

export const leadSchema = z.object({
  nome: z.string({ error: ERROS.nome }).trim().min(2, ERROS.nome).max(80, ERROS.nome),
  tipo: z.enum(TIPOS, { error: ERROS.tipo }),
  cidade: z.string({ error: ERROS.cidade }).trim().min(2, ERROS.cidade).max(80, ERROS.cidade),
  metragem: metragemSchema,
})

export type Lead = { nome: string; tipo: (typeof TIPOS)[number]; cidade: string; metragem?: number }

export function buildLeadMessage(l: Lead): string {
  const linhas = [
    'Olá, Amene! Vim pelo site.',
    `Nome: ${l.nome.trim()}`,
    `Projeto: ${l.tipo}`,
    `Cidade: ${l.cidade.trim()}`,
  ]
  if (l.metragem !== undefined) linhas.push(`Metragem: ${l.metragem} m²`)
  return linhas.join('\n')
}

export function buildWhatsAppUrl(number: string | null, l: Lead): string | null {
  if (!number) return null
  return `https://wa.me/${number}?text=${encodeURIComponent(buildLeadMessage(l))}`
}
