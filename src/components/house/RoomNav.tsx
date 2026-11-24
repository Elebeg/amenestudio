'use client'

import { useRef, type KeyboardEvent } from 'react'
import type { RoomId } from '@/content/projetos'
import type { HouseState, ViewId } from '@/three/camera/cameraMath'
import s from './house.module.css'

export type NavRoom = { id: RoomId; nome: string; num: string }

type NavProps = {
  rooms: NavRoom[]
  view: ViewId
  onSelect: (view: ViewId, opener: HTMLElement, viaKeyboardArrows?: boolean) => void
}

/**
 * Lista de ambientes (Visão geral + cômodos do projeto), cada um um <button>.
 * Setas ↑↓ ←→ (e Home/End) trocam de cômodo e levam o foco junto.
 */
export function RoomNav({ rooms, view, onSelect }: NavProps) {
  const list = useRef<HTMLOListElement>(null)
  const items: Array<{ id: ViewId; nome: string; num: string }> = [{ id: 'overview', nome: 'Visão geral', num: '00' }, ...rooms]

  const onKeyDown = (e: KeyboardEvent<HTMLOListElement>) => {
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>('button[data-view]') ?? [])]
    const at = buttons.indexOf(document.activeElement as HTMLButtonElement)
    if (at < 0) return
    e.preventDefault()
    const n = buttons.length
    const next =
      e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (at + 1) % n : (at - 1 + n) % n
    const btn = buttons[next]
    btn.focus()
    onSelect(btn.dataset.view as ViewId, btn, true)
  }

  return (
    <nav aria-label="Ambientes da maquete">
      <ol className={s.nav} ref={list} onKeyDown={onKeyDown}>
        {items.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              className={s.navButton}
              data-view={r.id}
              aria-current={view === r.id ? 'true' : undefined}
              onClick={(e) => onSelect(r.id, e.currentTarget)}
            >
              <span className={s.navNum} aria-hidden="true">
                {r.num}
              </span>
              {r.nome}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}

type ControlsProps = {
  lighting: HouseState['lighting']
  onLighting: (l: HouseState['lighting']) => void
  onZoom: (factor: number) => void
  zoomEnabled: boolean
}

/** Controles sobre a maquete: dia/noite e zoom +/−. */
export function StageControls({ lighting, onLighting, onZoom, zoomEnabled }: ControlsProps) {
  return (
    <div className={s.controls}>
      <div className={s.segmented} role="group" aria-label="Iluminação da maquete">
        <button type="button" aria-pressed={lighting === 'manha'} onClick={() => onLighting('manha')}>
          Dia
        </button>
        <button type="button" aria-pressed={lighting === 'noite'} onClick={() => onLighting('noite')}>
          Noite
        </button>
      </div>
      {zoomEnabled && (
        <div className={s.segmented} role="group" aria-label="Zoom da maquete">
          <button type="button" aria-label="Afastar" onClick={() => onZoom(1.25)}>
            <span aria-hidden="true">−</span>
          </button>
          <button type="button" aria-label="Aproximar" onClick={() => onZoom(0.8)}>
            <span aria-hidden="true">+</span>
          </button>
        </div>
      )}
    </div>
  )
}
