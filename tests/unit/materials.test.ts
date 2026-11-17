import { describe, it, expect } from 'vitest'
import * as THREE from 'three'
import { applyLighting, createInstanceMaterials, type MutableBase } from '@/three/apartment/materials'

const base = (): MutableBase => {
  const S = (name: string, p: THREE.MeshStandardMaterialParameters = {}) => new THREE.MeshStandardMaterial({ name, ...p })
  return {
    gesso: S('gesso'),
    corte: S('corte'),
    rodape: S('rodape'),
    caixilho: S('caixilho'),
    vidro: S('vidro', { transparent: true, opacity: 0.18 }),
    luz: S('luz'),
    palha: S('palha'),
    voile: S('voile', { transparent: true, opacity: 0.58 }),
  }
}

describe('materiais por instância da maquete', () => {
  it('duas instâncias não compartilham materiais mutáveis', () => {
    const b = base()
    const a = createInstanceMaterials(b)
    const c = createInstanceMaterials(b)
    for (const side of ['n', 's', 'e', 'w'] as const) {
      for (const key of ['wall', 'cap', 'board', 'frame', 'glass'] as const) {
        expect(a.walls[side][key]).not.toBe(c.walls[side][key])
      }
    }
    expect(a.luz).not.toBe(c.luz)
    expect(a.palha).not.toBe(c.palha)
    expect(a.voile).not.toBe(c.voile)
    expect(a.luz).not.toBe(b.luz)
  })

  it('mantém os nomes wall-${side}* e expõe a opacidade base', () => {
    const a = createInstanceMaterials(base())
    expect(a.walls.n.wall.name).toBe('wall-n')
    expect(a.walls.e.cap.name).toBe('wall-e-corte')
    expect(a.walls.s.glass.name).toBe('wall-s-vidro')
    expect(a.walls.w.glass.userData.baseOpacity).toBeCloseTo(0.18)
    expect(a.walls.w.wall.userData.baseOpacity).toBe(1)
  })

  it('applyLighting numa instância não afeta a outra', () => {
    const b = base()
    const a = createInstanceMaterials(b)
    const c = createInstanceMaterials(b)
    applyLighting(a, 'noite')
    applyLighting(c, 'manha')
    expect(a.luz.emissiveIntensity).toBeGreaterThan(0)
    expect(c.luz.emissiveIntensity).toBe(0)
    expect(a.voile.opacity).not.toBe(c.voile.opacity)
  })
})
