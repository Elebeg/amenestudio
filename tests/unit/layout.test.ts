import { describe, it, expect } from 'vitest'
import { getProject } from '@/content/projetos'
import {
  APARTMENT,
  exteriorWalls,
  footprint,
  interiorWallPieces,
  wallLength,
  type Rect,
} from '@/three/apartment/layout'

const area = (r: Rect) => (r.x1 - r.x0) * (r.z1 - r.z0)
const intersection = (a: Rect, b: Rect) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const d = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0)
  return w > 0 && d > 0 ? w * d : 0
}

describe('layout do apartamento', () => {
  const projeto = getProject('apartamento-pedra')!

  it('tem as constantes do modelo', () => {
    expect(APARTMENT.height).toBe(2.7)
    expect(APARTMENT.wallThickness).toBe(0.12)
  })

  it('retângulos dos cômodos não se sobrepõem (interseção < 0,01 m²)', () => {
    const all = [...APARTMENT.rooms.map((r) => r.rect), ...APARTMENT.areas.map((a) => a.rect)]
    for (let i = 0; i < all.length; i++) {
      expect(area(all[i])).toBeGreaterThan(0)
      for (let j = i + 1; j < all.length; j++) {
        expect(intersection(all[i], all[j])).toBeLessThan(0.01)
      }
    }
  })

  it('cada RoomId do projeto tem exatamente um RoomLayout e vice-versa', () => {
    const projectIds = projeto.rooms.map((r) => r.id).sort()
    const layoutIds = APARTMENT.rooms.map((r) => r.id).sort()
    expect(layoutIds).toEqual(projectIds)
    expect(new Set(layoutIds).size).toBe(layoutIds.length)
  })

  it('toda Opening.width cabe na parede onde está', () => {
    for (const room of [...APARTMENT.rooms, ...APARTMENT.areas]) {
      for (const o of room.openings) {
        const len = wallLength(room.rect, o.wall)
        expect(o.width, `${'id' in room ? room.id : room.name} ${o.wall}`).toBeGreaterThan(0)
        expect(o.center - o.width / 2).toBeGreaterThanOrEqual(0)
        expect(o.center + o.width / 2).toBeLessThanOrEqual(len)
        expect(o.y0).toBeGreaterThanOrEqual(0)
        expect(o.y1).toBeGreaterThan(o.y0)
        expect(o.y1).toBeLessThanOrEqual(APARTMENT.height)
      }
    }
  })

  it('labelAt está dentro do rect', () => {
    for (const room of APARTMENT.rooms) {
      const [x, , z] = room.labelAt
      expect(x).toBeGreaterThan(room.rect.x0)
      expect(x).toBeLessThan(room.rect.x1)
      expect(z).toBeGreaterThan(room.rect.z0)
      expect(z).toBeLessThan(room.rect.z1)
    }
  })

  it('cômodos e circulação preenchem o retângulo externo', () => {
    const f = footprint(APARTMENT)
    const total = [...APARTMENT.rooms, ...APARTMENT.areas].reduce((s, r) => s + area(r.rect), 0)
    expect(total).toBeCloseTo(area(f), 3)
  })

  it('quatro paredes externas com normais para fora', () => {
    const walls = exteriorWalls(APARTMENT)
    expect(walls.map((w) => w.side).sort()).toEqual(['e', 'n', 's', 'w'])
    const byside = Object.fromEntries(walls.map((w) => [w.side, w.normal]))
    expect(byside).toEqual({ n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] })
    for (const w of walls) {
      expect(w.pieces.length).toBeGreaterThan(0)
      for (const p of w.pieces) for (const s of p.size) expect(s).toBeGreaterThan(0)
    }
  })

  it('paredes internas não cobrem portas', () => {
    const pieces = interiorWallPieces(APARTMENT)
    expect(pieces.length).toBeGreaterThan(0)
    for (const room of APARTMENT.rooms) {
      for (const o of room.openings.filter((o) => o.kind === 'porta')) {
        const { rect } = room
        const horizontal = o.wall === 'n' || o.wall === 's'
        const along = (horizontal ? rect.x0 : rect.z0) + o.center
        const line = { n: rect.z0, s: rect.z1, w: rect.x0, e: rect.x1 }[o.wall]
        const px = horizontal ? along : line
        const pz = horizontal ? line : along
        const blocked = pieces.some((p) => {
          const [cx, cy, cz] = p.center
          const [sx, sy, sz] = p.size
          return (
            Math.abs(px - cx) < sx / 2 && Math.abs(pz - cz) < sz / 2 && 1 > cy - sy / 2 && 1 < cy + sy / 2
          )
        })
        expect(blocked, `${room.id} porta ${o.wall}`).toBe(false)
      }
    }
  })
})
