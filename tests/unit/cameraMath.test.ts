import { describe, it, expect } from 'vitest'
import {
  VIEWS,
  buildViews,
  lerpSphericalInto,
  siteBounds,
  overviewView,
  clampPhi,
  clampRadius,
  easeInOutCubic,
  lerpSpherical,
  roomAtPoint,
  shortestTheta,
  wallOpacity,
  type Spherical,
} from '@/three/camera/cameraMath'
import { APARTMENT, type RoomLayout } from '@/three/apartment/layout'

const a: Spherical = { target: [0, 0, 0], r: 27, theta: 3, phi: 0.95 }
const b: Spherical = { target: [2, 0.5, -1], r: 9, theta: -3, phi: 0.68 }

describe('cameraMath', () => {
  it('shortestTheta devolve o ângulo equivalente mais próximo', () => {
    expect(shortestTheta(3, -3)).toBeCloseTo(-3 + 2 * Math.PI)
    expect(shortestTheta(-3, 3)).toBeCloseTo(3 - 2 * Math.PI)
    expect(shortestTheta(0.2, 0.5)).toBeCloseTo(0.5)
    // várias voltas acumuladas pela auto-rotação
    expect(shortestTheta(4 * Math.PI + 0.1, 0.2)).toBeCloseTo(4 * Math.PI + 0.2)
  })

  it('lerpSpherical: extremos exatos e caminho angular mais curto', () => {
    expect(lerpSpherical(a, b, 0)).toEqual(a)
    expect(lerpSpherical(a, b, 1)).toEqual({ ...b, theta: shortestTheta(a.theta, b.theta) })
    const mid = lerpSpherical(a, b, 0.5)
    expect(mid.r).toBeCloseTo(18)
    expect(mid.target).toEqual([1, 0.25, -0.5])
    // de 3 para −3 passa por π, não por 0
    expect(mid.theta).toBeCloseTo(Math.PI)
  })

  it('easeInOutCubic', () => {
    expect(easeInOutCubic(0)).toBe(0)
    expect(easeInOutCubic(1)).toBe(1)
    expect(easeInOutCubic(0.5)).toBeCloseTo(0.5)
    expect(easeInOutCubic(0.25)).toBeLessThan(0.25)
    expect(easeInOutCubic(0.75)).toBeGreaterThan(0.75)
    expect(easeInOutCubic(-1)).toBe(0)
    expect(easeInOutCubic(2)).toBe(1)
  })

  it('limites de inclinação e raio', () => {
    expect(clampPhi(2)).toBe(1.45)
    expect(clampPhi(0)).toBe(0.15)
    expect(clampPhi(0.9)).toBe(0.9)
    expect(clampRadius(1)).toBe(4)
    expect(clampRadius(100)).toBe(55)
    expect(clampRadius(20)).toBe(20)
  })

  it('wallOpacity: parede voltada para a câmera fica a 15%', () => {
    expect(wallOpacity([0, 1], [0, 1])).toBe(0.15)
    expect(wallOpacity([0, 1], [1, 0])).toBe(1)
    expect(wallOpacity([0, 1], [0, -1])).toBe(1)
    expect(wallOpacity([1, 0], [0.42, 0.91])).toBe(0.15)
    expect(wallOpacity([1, 0], [0.3, 0.95])).toBe(1)
  })

  // planta sintética: não depende das coordenadas da planta real
  const rect = (x0: number, z0: number, x1: number, z1: number) => ({ x0, z0, x1, z1 })
  const mk = (id: RoomLayout['id'], r: ReturnType<typeof rect>): RoomLayout => ({
    id,
    rect: r,
    openings: [],
    labelAt: [(r.x0 + r.x1) / 2, 3, (r.z0 + r.z1) / 2],
  })
  // 12 × 8 m; living no canto noroeste, suíte encostada só na fachada sul, lavabo interno
  const plan = {
    rooms: [mk('living', rect(0, 0, 6, 4)), mk('lavabo', rect(6.5, 1, 8, 2.6)), mk('suite-casal', rect(7, 4, 10, 8))],
    areas: [{ rect: rect(0, 0, 12, 8) }],
    varanda: { rect: rect(0, -2, 6, 0) },
  }

  it('siteBounds: planta + varanda', () => {
    expect(siteBounds(plan)).toEqual({ x0: 0, z0: -2, x1: 12, z1: 8 })
    expect(siteBounds({ rooms: plan.rooms, areas: plan.areas })).toEqual({ x0: 0, z0: 0, x1: 12, z1: 8 })
  })

  it('overviewView: centrada no terreno, φ 0,95, raio cresce com o tamanho', () => {
    const o = overviewView(plan)
    expect(o.phi).toBe(0.95)
    expect(o.target[0]).toBeCloseTo(6)
    expect(o.target[2]).toBeCloseTo(3)
    const small = overviewView({ rooms: plan.rooms, areas: [{ rect: rect(0, 0, 6, 4) }] })
    expect(o.r).toBeGreaterThan(small.r)
    expect(o.r).toBe(clampRadius(o.r))
  })

  it('viewFor: θ pela fachada que o cômodo realmente toca', () => {
    const views = buildViews(plan)
    for (const room of plan.rooms) {
      const v = views[room.id]
      expect(v.target[0]).toBeCloseTo((room.rect.x0 + room.rect.x1) / 2)
      expect(v.target[2]).toBeCloseTo((room.rect.z0 + room.rect.z1) / 2)
      expect(v.phi).toBe(clampPhi(v.phi))
      expect(v.r).toBe(clampRadius(v.r))
    }
    // canto noroeste: câmera a noroeste (−x, −z), na bissetriz das duas fachadas
    expect(views.living.phi).toBeCloseTo(0.68)
    expect(Math.sin(views.living.theta)).toBeCloseTo(-Math.SQRT1_2)
    expect(Math.cos(views.living.theta)).toBeCloseTo(-Math.SQRT1_2)
    // só a fachada sul: câmera ao sul, inclinada para o lado de fora (leste do centro)
    expect(Math.cos(views['suite-casal'].theta)).toBeGreaterThan(0.8)
    expect(Math.sin(views['suite-casal'].theta)).toBeGreaterThan(0.2)
    // cômodo interno (sem fachada): vista quase de cima
    expect(views.lavabo.phi).toBeLessThan(0.5)
  })

  it('VIEWS cobre todos os cômodos da planta atual', () => {
    for (const room of APARTMENT.rooms) expect(VIEWS[room.id], room.id).toBeDefined()
    expect(VIEWS.overview.phi).toBe(0.95)
  })

  it('lerpSphericalInto escreve no destino, igual a lerpSpherical', () => {
    const out: Spherical = { target: [0, 0, 0], r: 0, theta: 0, phi: 0 }
    expect(lerpSphericalInto(out, a, b, 0.3)).toBe(out)
    expect(out).toEqual(lerpSpherical(a, b, 0.3))
  })

  it('roomAtPoint: cômodo sob um ponto do piso; varanda e áreas não são cômodos', () => {
    expect(roomAtPoint(3, 2, plan.rooms)).toBe('living')
    expect(roomAtPoint(8, 6, plan.rooms)).toBe('suite-casal')
    expect(roomAtPoint(3, -1, plan.rooms)).toBeNull()
    expect(roomAtPoint(11, 1, plan.rooms)).toBeNull()
  })
})
