import { describe, it, expect } from 'vitest'
import { APARTMENT, footprint } from '@/three/apartment/layout'
import { areaFixtures } from '@/three/apartment/fixtures'

describe('equipamentos das áreas (banheiros, serviço, closet, despensa)', () => {
  const fx = areaFixtures(APARTMENT)

  it('cada banheiro tem bancada, bacia e vidro do box', () => {
    for (const a of APARTMENT.areas.filter((a) => a.kind === 'banho')) {
      const inside = (mat: keyof typeof fx.byArea[string]) => (fx.byArea[a.name]?.[mat] ?? []).length
      expect(inside('laca'), a.name).toBeGreaterThan(0)
      expect(inside('ceramica'), a.name).toBeGreaterThan(0)
      expect(inside('vidro'), a.name).toBeGreaterThan(0)
    }
    expect((fx.byArea['servico']?.laca ?? []).length).toBeGreaterThan(0)
    expect((fx.byArea['closet-casal']?.laca ?? []).length).toBeGreaterThan(0)
  })

  it('toda peça fica dentro da área, longe das paredes (meia espessura) e abaixo do teto', () => {
    const h = APARTMENT.wallThickness / 2 - 1e-6
    const f = footprint(APARTMENT)
    // folga de meia parede nas divisas internas; nas externas a parede fica por fora do retângulo
    const inset = (coord: number, edge: number) => (Math.abs(coord - edge) < 1e-4 ? -1e-6 : h)
    for (const a of APARTMENT.areas) {
      const r = a.rect
      for (const boxes of Object.values(fx.byArea[a.name] ?? {})) {
        for (const b of boxes) {
          const [cx, cy, cz] = b.center
          const [sx, sy, sz] = b.size
          expect(cx - sx / 2, a.name).toBeGreaterThanOrEqual(r.x0 + inset(r.x0, f.x0))
          expect(cx + sx / 2, a.name).toBeLessThanOrEqual(r.x1 - inset(r.x1, f.x1))
          expect(cz - sz / 2, a.name).toBeGreaterThanOrEqual(r.z0 + inset(r.z0, f.z0))
          expect(cz + sz / 2, a.name).toBeLessThanOrEqual(r.z1 - inset(r.z1, f.z1))
          expect(cy - sy / 2).toBeGreaterThanOrEqual(0)
          expect(cy + sy / 2).toBeLessThanOrEqual(APARTMENT.height)
        }
      }
    }
  })

  it('peças agrupadas por material (um InstancedMesh por material)', () => {
    const total = Object.values(fx.byMaterial).reduce((s, l) => s + l.length, 0)
    const perArea = Object.values(fx.byArea).reduce((s, g) => s + Object.values(g).reduce((t, l) => t + l.length, 0), 0)
    expect(total).toBe(perArea)
    expect(Object.keys(fx.byMaterial).length).toBeLessThanOrEqual(8)
  })
})
