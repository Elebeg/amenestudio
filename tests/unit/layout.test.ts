import { describe, it, expect } from 'vitest'
import { getProject } from '@/content/projetos'
import {
  APARTMENT,
  exteriorWalls,
  footprint,
  interiorWallPieces,
  wallLength,
  type Opening,
  type Rect,
  type Side,
} from '@/three/apartment/layout'

const area = (r: Rect) => (r.x1 - r.x0) * (r.z1 - r.z0)
const intersection = (a: Rect, b: Rect) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const d = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0)
  return w > 0 && d > 0 ? w * d : 0
}
const near = (a: number, b: number) => Math.abs(a - b) < 1e-4

/** Linha absoluta (eixo + coordenada) e trecho [s, e] de um lado do retângulo. */
function edge(r: Rect, side: Side) {
  switch (side) {
    case 'n':
      return { axis: 'x' as const, coord: r.z0, s: r.x0, e: r.x1 }
    case 's':
      return { axis: 'x' as const, coord: r.z1, s: r.x0, e: r.x1 }
    case 'w':
      return { axis: 'z' as const, coord: r.x0, s: r.z0, e: r.z1 }
    case 'e':
      return { axis: 'z' as const, coord: r.x1, s: r.z0, e: r.z1 }
  }
}
const OPPOSITE: Record<Side, Side> = { n: 's', s: 'n', e: 'w', w: 'e' }
const SIDES: Side[] = ['n', 's', 'e', 'w']

/** Comprimento da divisa comum entre dois retângulos vizinhos (0 se não se tocam). */
function sharedEdge(a: Rect, b: Rect): { side: Side; s: number; e: number; len: number } | null {
  for (const side of SIDES) {
    const ea = edge(a, side)
    const eb = edge(b, OPPOSITE[side])
    if (!near(ea.coord, eb.coord)) continue
    const s = Math.max(ea.s, eb.s)
    const e = Math.min(ea.e, eb.e)
    if (e - s > 1e-4) return { side, s, e, len: e - s }
  }
  return null
}
/** Trecho absoluto [s, e] de uma abertura ao longo da parede. */
function openingSpan(r: Rect, o: Opening) {
  const start = o.wall === 'n' || o.wall === 's' ? r.x0 : r.z0
  return { s: start + o.center - o.width / 2, e: start + o.center + o.width / 2 }
}

const BEDROOMS = ['suite-casal', 'quarto-solteiro', 'suite-ripada', 'quarto-espelho'] as const
const room = (id: string) => APARTMENT.rooms.find((r) => r.id === id)!

describe('layout do apartamento', () => {
  const projeto = getProject('apartamento-pedra')!
  const f = footprint(APARTMENT)

  it('tem as constantes do modelo', () => {
    expect(APARTMENT.height).toBe(2.7)
    expect(APARTMENT.wallThickness).toBe(0.12)
  })

  it('retângulos dos cômodos e áreas não se sobrepõem (interseção < 0,01 m²)', () => {
    const all = [...APARTMENT.rooms.map((r) => r.rect), ...APARTMENT.areas.map((a) => a.rect), APARTMENT.varanda.rect]
    for (let i = 0; i < all.length; i++) {
      expect(area(all[i])).toBeGreaterThan(0)
      for (let j = i + 1; j < all.length; j++) {
        expect(intersection(all[i], all[j])).toBeLessThan(0.01)
      }
    }
  })

  it('sete cômodos: cada RoomId do projeto tem exatamente um RoomLayout e vice-versa', () => {
    expect(APARTMENT.rooms).toHaveLength(7)
    const projectIds = projeto.rooms.map((r) => r.id).sort()
    const layoutIds = APARTMENT.rooms.map((r) => r.id).sort()
    expect(layoutIds).toEqual(projectIds)
    expect(new Set(layoutIds).size).toBe(layoutIds.length)
  })

  it('área privativa entre 180 e 220 m² e planta que não é uma barra comprida', () => {
    expect(area(f)).toBeGreaterThanOrEqual(180)
    expect(area(f)).toBeLessThanOrEqual(220)
    const w = f.x1 - f.x0
    const d = f.z1 - f.z0
    expect(Math.max(w, d) / Math.min(w, d)).toBeLessThan(1.6)
  })

  it('toda Opening.width cabe na parede onde está', () => {
    for (const r of [...APARTMENT.rooms, ...APARTMENT.areas, APARTMENT.varanda]) {
      for (const o of r.openings) {
        const len = wallLength(r.rect, o.wall)
        expect(o.width, `${'id' in r ? r.id : r.name} ${o.wall}`).toBeGreaterThan(0)
        expect(o.center - o.width / 2).toBeGreaterThanOrEqual(0)
        expect(o.center + o.width / 2).toBeLessThanOrEqual(len)
        expect(o.y0).toBeGreaterThanOrEqual(0)
        expect(o.y1).toBeGreaterThan(o.y0)
        expect(o.y1).toBeLessThanOrEqual(APARTMENT.height)
      }
    }
  })

  it('labelAt está dentro do rect', () => {
    for (const r of APARTMENT.rooms) {
      const [x, , z] = r.labelAt
      expect(x).toBeGreaterThan(r.rect.x0)
      expect(x).toBeLessThan(r.rect.x1)
      expect(z).toBeGreaterThan(r.rect.z0)
      expect(z).toBeLessThan(r.rect.z1)
    }
  })

  it('cômodos e áreas preenchem o retângulo externo (a varanda fica em balanço, fora dele)', () => {
    const total = [...APARTMENT.rooms, ...APARTMENT.areas].reduce((s, r) => s + area(r.rect), 0)
    expect(total).toBeCloseTo(area(f), 3)
    expect(intersection(APARTMENT.varanda.rect, f)).toBe(0)
  })

  it('varanda ao longo da fachada norte, na frente do living e do jantar', () => {
    const v = APARTMENT.varanda.rect
    expect(v.z1).toBeCloseTo(f.z0, 4)
    for (const id of ['living', 'cozinha']) {
      const r = room(id).rect
      expect(near(r.z0, f.z0), id).toBe(true)
      expect(Math.min(v.x1, r.x1) - Math.max(v.x0, r.x0), id).toBeGreaterThan(2)
      // porta de vidro do piso ao teto para a varanda
      const glass = room(id).openings.find((o) => o.wall === 'n' && o.kind === 'janela')
      expect(glass, id).toBeDefined()
      expect(glass!.y0).toBe(0)
    }
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

  it('paredes internas não cobrem portas (cômodos e áreas)', () => {
    const pieces = interiorWallPieces(APARTMENT)
    expect(pieces.length).toBeGreaterThan(0)
    for (const r of [...APARTMENT.rooms, ...APARTMENT.areas]) {
      for (const o of r.openings.filter((o) => o.kind === 'porta' || o.kind === 'vao')) {
        const { rect } = r
        const horizontal = o.wall === 'n' || o.wall === 's'
        const along = (horizontal ? rect.x0 : rect.z0) + o.center
        const line = { n: rect.z0, s: rect.z1, w: rect.x0, e: rect.x1 }[o.wall]
        const px = horizontal ? along : line
        const pz = horizontal ? line : along
        const blocked = pieces.some((p) => {
          const [cx, cy, cz] = p.center
          const [sx, sy, sz] = p.size
          return Math.abs(px - cx) < sx / 2 && Math.abs(pz - cz) < sz / 2 && 1 > cy - sy / 2 && 1 < cy + sy / 2
        })
        expect(blocked, `${'id' in r ? r.id : r.name} ${o.kind} ${o.wall}`).toBe(false)
      }
    }
  })

  it('banheiros, closet e serviço são fechados por paredes internas', () => {
    const pieces = interiorWallPieces(APARTMENT)
    const enclosed = APARTMENT.areas.filter((a) => a.kind === 'banho' || a.kind === 'closet' || a.kind === 'servico')
    expect(enclosed.length).toBeGreaterThanOrEqual(5)
    for (const a of enclosed) {
      for (const side of SIDES) {
        const e = edge(a.rect, side)
        const onBoundary = e.axis === 'x' ? near(e.coord, f.z0) || near(e.coord, f.z1) : near(e.coord, f.x0) || near(e.coord, f.x1)
        if (onBoundary) continue
        // o ponto a 25% da divisa, a 2,5 m de altura (acima das portas), precisa estar dentro de uma parede
        const t = e.s + (e.e - e.s) * 0.25
        const [px, pz] = e.axis === 'x' ? [t, e.coord] : [e.coord, t]
        const covered = pieces.some((p) => {
          const [cx, cy, cz] = p.center
          const [sx, sy, sz] = p.size
          return Math.abs(px - cx) <= sx / 2 + 1e-6 && Math.abs(pz - cz) <= sz / 2 + 1e-6 && 2.5 > cy - sy / 2 && 2.5 < cy + sy / 2
        })
        expect(covered, `${a.name} ${side}`).toBe(true)
      }
    }
  })

  it('cada suíte tem banheiro próprio com porta a partir do quarto (ou do closet)', () => {
    const banhos = APARTMENT.areas.filter((a) => a.kind === 'banho')
    for (const id of ['suite-casal', 'suite-ripada', 'quarto-espelho', 'quarto-solteiro']) {
      const r = room(id)
      const closet = APARTMENT.areas.find((a) => a.kind === 'closet' && sharedEdge(r.rect, a.rect))
      const hosts = [r.rect, ...(closet ? [closet.rect] : [])]
      const doors = [...r.openings.map((o) => ({ rect: r.rect, o })), ...(closet ? closet.openings.map((o) => ({ rect: closet.rect, o })) : [])]
      const ok = banhos.some((b) =>
        hosts.some((h) => {
          const sh = sharedEdge(h, b.rect)
          if (!sh) return false
          return doors.some(({ rect, o }) => {
            if (rect !== h || o.kind !== 'porta' || o.wall !== sh.side) return false
            const span = openingSpan(rect, o)
            return span.s >= sh.s - 1e-4 && span.e <= sh.e + 1e-4
          })
        }),
      )
      expect(ok, id).toBe(true)
    }
  })

  it('no máximo 2 portas de quarto na mesma linha de parede', () => {
    const lines = new Map<string, number>()
    for (const id of BEDROOMS) {
      const r = room(id)
      for (const o of r.openings.filter((o) => o.kind === 'porta')) {
        const e = edge(r.rect, o.wall)
        const key = `${e.axis}:${e.coord.toFixed(3)}`
        lines.set(key, (lines.get(key) ?? 0) + 1)
      }
    }
    for (const [key, n] of lines) expect(n, key).toBeLessThanOrEqual(2)
    // e as portas de entrada dos quartos não estão todas numa linha só
    expect(lines.size).toBeGreaterThanOrEqual(3)
  })

  it('todo quarto toca uma parede externa com janela', () => {
    for (const id of BEDROOMS) {
      const r = room(id)
      const ok = r.openings.some((o) => {
        if (o.kind !== 'janela') return false
        const e = edge(r.rect, o.wall)
        return e.axis === 'x' ? near(e.coord, f.z0) || near(e.coord, f.z1) : near(e.coord, f.x0) || near(e.coord, f.x1)
      })
      expect(ok, id).toBe(true)
    }
  })

  it('lavabo abre para hall/circulação (não para o estar) e tem porta', () => {
    const lav = room('lavabo')
    expect(sharedEdge(lav.rect, room('living').rect)).toBeNull()
    const circ = APARTMENT.areas.filter((a) => a.kind === 'hall' || a.kind === 'circulacao')
    const door = lav.openings.find((o) => o.kind === 'porta')
    expect(door).toBeDefined()
    const span = openingSpan(lav.rect, door!)
    const facesCirc = circ.some((a) => {
      const sh = sharedEdge(lav.rect, a.rect)
      return sh && sh.side === door!.wall && span.s >= sh.s - 1e-4 && span.e <= sh.e + 1e-4
    })
    expect(facesCirc).toBe(true)
  })

  it('cozinha integrada ao living (divisa ≥ 2 m ou vão)', () => {
    const k = room('cozinha')
    const l = room('living')
    const sh = sharedEdge(k.rect, l.rect)
    expect(sh).not.toBeNull()
    const vao = k.openings.some((o) => o.kind === 'vao' && o.wall === sh!.side)
    expect(sh!.len >= 2 || vao).toBe(true)
  })

  it('portas com larguras realistas', () => {
    for (const r of [...APARTMENT.rooms, ...APARTMENT.areas]) {
      for (const o of r.openings.filter((o) => o.kind === 'porta')) {
        expect(o.width, `${'id' in r ? r.id : r.name}`).toBeGreaterThanOrEqual(0.6)
        expect(o.width).toBeLessThanOrEqual(1.0)
      }
    }
    const hall = APARTMENT.areas.find((a) => a.kind === 'hall')!
    const entrada = hall.openings.find((o) => o.kind === 'porta')!
    expect(entrada.width).toBeGreaterThanOrEqual(0.9)
  })
})
