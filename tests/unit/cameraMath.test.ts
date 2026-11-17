import { describe, it, expect } from 'vitest'
import {
  VIEWS,
  clampPhi,
  clampRadius,
  easeInOutCubic,
  lerpSpherical,
  roomAtPoint,
  shortestTheta,
  wallOpacity,
  type Spherical,
} from '@/three/camera/cameraMath'
import { APARTMENT } from '@/three/apartment/layout'

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

  it('VIEWS: visão geral r 27 / phi .95 e um enquadramento por cômodo', () => {
    expect(VIEWS.overview.r).toBe(27)
    expect(VIEWS.overview.phi).toBe(0.95)
    for (const room of APARTMENT.rooms) {
      const v = VIEWS[room.id]
      expect(v, room.id).toBeDefined()
      const cx = (room.rect.x0 + room.rect.x1) / 2
      const cz = (room.rect.z0 + room.rect.z1) / 2
      expect(v.target[0]).toBeCloseTo(cx)
      expect(v.target[2]).toBeCloseTo(cz)
      expect(v.phi).toBe(clampPhi(v.phi))
      expect(v.r).toBe(clampRadius(v.r))
      // cômodos: phi ≈ .68; o lavabo (1,5 × 1,8 m) pede uma vista mais de cima
      if (room.id === 'lavabo') expect(v.phi).toBeLessThan(0.5)
      else expect(v.phi).toBeCloseTo(0.68, 1)
    }
  })

  it('roomAtPoint: encontra o cômodo sob um ponto do piso', () => {
    const living = APARTMENT.rooms.find((r) => r.id === 'living')!
    const cx = (living.rect.x0 + living.rect.x1) / 2
    const cz = (living.rect.z0 + living.rect.z1) / 2
    expect(roomAtPoint(cx, cz)).toBe('living')
    expect(roomAtPoint(100, 100)).toBeNull()
  })
})
