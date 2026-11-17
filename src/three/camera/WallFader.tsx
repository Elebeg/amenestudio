'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { Side } from '@/three/apartment/layout'
import { wallOpacity } from './cameraMath'

type FadedMaterial = { mat: THREE.Material; base: number }
type FadedWall = { normal: [number, number]; mats: FadedMaterial[]; value: number; goal: number; applied: number }

const SIDES: Side[] = ['n', 's', 'e', 'w']
/** Constante de tempo da transição (1/s): ~0,5 s para assentar. */
const RATE = 7

/**
 * Paredes externas voltadas para a câmera caem para 15% com transição suave.
 * Os grupos `wall-${side}` e seus materiais (nomeados `wall-${side}*`, com `userData.baseOpacity`)
 * são coletados UMA vez; a cada quadro só há aritmética. A opacidade final é
 * baseOpacity × fade (o vidro começa em 0,18). Enquanto houver transição, pede novos quadros.
 */
export function WallFader() {
  const scene = useThree((s) => s.scene)
  const walls = useRef<FadedWall[] | null>(null)
  const forward = useMemo(() => new THREE.Vector3(), [])
  const dir = useRef<[number, number]>([0, 0])

  useFrame(({ camera, invalidate }, delta) => {
    if (!walls.current) {
      const found: FadedWall[] = []
      for (const side of SIDES) {
        const g = scene.getObjectByName(`wall-${side}`)
        if (!g) return // a maquete ainda não montou: tenta no próximo quadro
        const mats = new Map<THREE.Material, FadedMaterial>()
        g.traverse((o) => {
          const mesh = o as THREE.Mesh
          if (!mesh.isMesh) return
          for (const mat of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
            if (!mat.name.startsWith('wall-') || mats.has(mat)) continue
            mats.set(mat, { mat, base: (mat.userData.baseOpacity as number | undefined) ?? mat.opacity })
          }
        })
        found.push({ normal: g.userData.normal as [number, number], mats: [...mats.values()], value: 1, goal: 1, applied: -1 })
      }
      walls.current = found
    }

    // direção para a câmera no plano XZ (oposta ao olhar)
    camera.getWorldDirection(forward)
    const len = Math.hypot(forward.x, forward.z) || 1
    dir.current[0] = -forward.x / len
    dir.current[1] = -forward.z / len

    const k = 1 - Math.exp(-Math.min(delta, 1 / 20) * RATE)
    let animating = false
    for (const w of walls.current) {
      w.goal = wallOpacity(w.normal, dir.current)
      if (w.value !== w.goal) {
        w.value += (w.goal - w.value) * k
        if (Math.abs(w.goal - w.value) < 0.004) w.value = w.goal
        else animating = true
      }
      if (w.value === w.applied) continue
      w.applied = w.value
      const opaque = w.value >= 1
      for (const { mat, base } of w.mats) {
        const transparent = !opaque || base < 1
        if (mat.transparent !== transparent) {
          mat.transparent = transparent
          mat.needsUpdate = true
        }
        mat.opacity = base * w.value
        // superfícies esmaecidas não escrevem profundidade (não escondem o interior nem o AO)
        mat.depthWrite = !transparent
      }
    }
    if (animating) invalidate()
  })

  return null
}
