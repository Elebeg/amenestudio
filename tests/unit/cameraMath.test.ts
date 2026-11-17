import { describe, it, expect } from 'vitest'
import {
  VIEWS,
  buildViews,
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

  // planta sintética: não depende das coordenadas da planta real (que ainda vai mudar)
  const rect = (x0: number, z0: number, x1: number, z1: number) => ({ x0, z0, x1, z1 })
  const mk = (id: RoomLayout['id'], r: ReturnType<typeof rect>): RoomLayout => ({
    id,
    rect: r,
    openings: [],
    labelAt: [(r.x0 + r.x1) / 2, 3, (r.z0 + r.z1) / 2],
  })
  const plan = {
    rooms: [mk('living', rect(0, -6, 6, -1)), mk('lavabo', rect(6, -3, 7.5, -1.2)), mk('suite-casal', rect(0, 1, 4, 5))],
    areas: [{ rect: rect(-2, -6, 10, 5) }],
  }

  it('overviewView: centro da planta, r 27, φ 0,95', () => {
    const o = overviewView(plan)
    expect(o.r).toBe(27)
    expect(o.phi).toBe(0.95)
    expect(o.target[0]).toBeCloseTo(4)
    expect(o.target[2]).toBeCloseTo(-0.5)
  })

  it('viewFor: alvo no centro do cômodo, φ ≈ 0,68, visto pela fachada mais próxima', () => {
    const views = buildViews(plan)
    for (const room of plan.rooms) {
      const v = views[room.id]
      expect(v.target[0]).toBeCloseTo((room.rect.x0 + room.rect.x1) / 2)
      expect(v.target[2]).toBeCloseTo((room.rect.z0 + room.rect.z1) / 2)
      expect(v.phi).toBe(clampPhi(v.phi))
      expect(v.r).toBe(clampRadius(v.r))
    }
    expect(views.living.phi).toBeCloseTo(0.68)
    // metade norte vista do norte (cos θ < 0), metade sul vista do sul (cos θ > 0)
    expect(Math.cos(views.living.theta)).toBeLessThan(0)
    expect(Math.cos(views['suite-casal'].theta)).toBeGreaterThan(0)
    // cômodo pequeno (1,5 × 1,8 m): vista bem mais de cima
    expect(views.lavabo.phi).toBeLessThan(0.5)
    // cômodo maior → câmera mais longe
    expect(views.living.r).toBeGreaterThan(views['suite-casal'].r - 1e-9)
  })

  it('VIEWS cobre todos os cômodos da planta atual', () => {
    for (const room of APARTMENT.rooms) expect(VIEWS[room.id], room.id).toBeDefined()
    expect(VIEWS.overview.r).toBe(27)
  })

  it('roomAtPoint: encontra o cômodo sob um ponto do piso', () => {
    expect(roomAtPoint(3, -3, plan.rooms)).toBe('living')
    expect(roomAtPoint(2, 3, plan.rooms)).toBe('suite-casal')
    expect(roomAtPoint(100, 100, plan.rooms)).toBeNull()
  })
})
