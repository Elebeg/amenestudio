import { describe, it, expect } from 'vitest'
import { createElement } from 'react'
import { renderToString } from 'react-dom/server'
import { ApartmentMaterialsContext, useMats } from '@/three/apartment/materialsContext'
import type { Materials } from '@/three/apartment/materials'

function Probe() {
  const m = useMats()
  return createElement('span', null, Object.keys(m).length)
}

describe('useMats', () => {
  it('lança erro claro fora de <ApartmentModel> (sem fallback para o singleton)', () => {
    expect(() => renderToString(createElement(Probe))).toThrow('useMats deve ser usado dentro de <ApartmentModel>')
  })

  it('devolve os materiais fornecidos pelo contexto', () => {
    const fake = { luz: {}, palha: {} } as unknown as Materials
    const html = renderToString(createElement(ApartmentMaterialsContext.Provider, { value: fake }, createElement(Probe)))
    expect(html).toContain('>2<')
  })
})
