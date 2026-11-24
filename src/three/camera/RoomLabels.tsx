'use client'

import { useLayoutEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { RoomId } from '@/content/projetos'

export type RoomLabel = { id: RoomId; num: string; label: string; at: readonly [number, number, number] }

type Props = {
  labels: RoomLabel[]
  /** Camada DOM (HouseSection) com um <button data-room-label> por cômodo. */
  layer: RefObject<HTMLDivElement | null>
}

/**
 * Projeta a posição 3D de cada rótulo (`labelAt`, acima das paredes) e escreve só o
 * `style.transform` dos botões, que são DOM comum renderizado pela HouseSection (sem uma raiz
 * React por rótulo). Um único useFrame, um Vector3 reaproveitado, nenhuma alocação por quadro.
 */
export function RoomLabels({ labels, layer }: Props) {
  const size = useThree((s) => s.size)
  const invalidate = useThree((s) => s.invalidate)
  const vec = useRef(new THREE.Vector3())
  const els = useRef<Array<{ el: HTMLElement; at: readonly [number, number, number] }>>([])

  // os botões montam depois do canvas (quando fica pronto): recolhe e pede um quadro
  useLayoutEffect(() => {
    const root = layer.current
    if (!root) return
    const collect = () => {
      els.current = labels.flatMap((l) => {
        const el = root.querySelector<HTMLElement>(`[data-room-label="${l.id}"]`)
        return el ? [{ el, at: l.at }] : []
      })
      invalidate()
    }
    collect()
    const mo = new MutationObserver(collect)
    mo.observe(root, { childList: true })
    return () => mo.disconnect()
  }, [labels, layer, invalidate])

  useFrame(({ camera }) => {
    const v = vec.current
    const w = size.width / 2
    const h = size.height / 2
    for (const { el, at } of els.current) {
      v.set(at[0], at[1], at[2]).project(camera)
      if (v.z > 1) {
        el.style.setProperty('visibility', 'hidden')
        continue
      }
      el.style.removeProperty('visibility')
      el.style.setProperty(
        'transform',
        `translate3d(${(v.x * w + w).toFixed(1)}px, ${(-v.y * h + h).toFixed(1)}px, 0) translate(-50%, calc(-100% - 10px))`,
      )
    }
  })

  return null
}
