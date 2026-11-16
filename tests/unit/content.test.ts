import { describe, it, expect } from 'vitest'
import photos from '@/content/projetos/apartamento-pedra/photos.generated.json'
import { projetoSchema } from '@/content/projetos/schema'
import { getProjects, getProject, getPhoto } from '@/content/projetos'

const ids = new Set(photos.map((p) => p.id))

describe('conteúdo do projeto', () => {
  const projeto = getProject('apartamento-pedra')!

  it('valida no schema', () => {
    expect(projeto).toBeDefined()
    expect(() => projetoSchema.parse(projeto)).not.toThrow()
    expect(getProjects().length).toBeGreaterThan(0)
  })
  it('fotos e capas existem em photos.generated.json', () => {
    expect(ids.has(projeto.capa)).toBe(true)
    for (const r of projeto.rooms) {
      expect(r.fotos.includes(r.capa)).toBe(true)
      for (const f of r.fotos) expect(ids.has(f)).toBe(true)
    }
  })
  it('nenhuma foto em dois cômodos e todas as 30 usadas', () => {
    const all = projeto.rooms.flatMap((r) => r.fotos)
    expect(new Set(all).size).toBe(all.length)
    expect(all.length).toBe(photos.length)
    expect(all).toContain('IMG_5034')
    expect(all).toContain('IMG_5050')
  })
  it('slug inexistente retorna undefined; getPhoto lança', () => {
    expect(getProject('nao-existe')).toBeUndefined()
    expect(() => getPhoto('nada')).toThrow()
    expect(getPhoto('IMG_4736').id).toBe('IMG_4736')
  })
})
