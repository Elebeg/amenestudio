'use client'

import { Html } from '@react-three/drei'
import type { RoomId } from '@/content/projetos'
import { APARTMENT } from '@/three/apartment/layout'

export type RoomLabel = { id: RoomId; num: string; label: string }

type Props = {
  labels: RoomLabel[]
  /** Só na visão geral; escondidos saem da ordem de tabulação. */
  visible: boolean
  onSelect: (id: RoomId, opener: HTMLElement) => void
  className: string
}

/**
 * Rótulos dos cômodos: elementos HTML projetados da posição 3D (`labelAt`, acima das paredes),
 * cada um um <button> de verdade. No celular o CSS os esconde e a lista da RoomNav assume.
 */
export function RoomLabels({ labels, visible, onSelect, className }: Props) {
  return (
    <>
      {labels.map((l) => {
        const room = APARTMENT.rooms.find((r) => r.id === l.id)
        if (!room) return null
        return (
          <Html key={l.id} position={room.labelAt} zIndexRange={[30, 10]} pointerEvents="none">
            <button
              type="button"
              className={className}
              data-room-label={l.id}
              data-visible={visible}
              tabIndex={visible ? 0 : -1}
              aria-hidden={visible ? undefined : true}
              onClick={(e) => onSelect(l.id, e.currentTarget)}
            >
              <span aria-hidden="true">{l.num}</span>
              {l.label}
            </button>
          </Html>
        )
      })}
    </>
  )
}
