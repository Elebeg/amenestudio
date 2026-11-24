'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef } from 'react'
import type { Photo, RoomId } from '@/content/projetos'
import s from './house.module.css'

export type PanelRoom = { id: RoomId; nome: string; descricao: string; num: string; fotos: Photo[] }

type Props = {
  room: PanelRoom
  total: number
  projectHref: string
  /** Mover o foco para o painel ao abrir (clique/Enter; não ao percorrer com as setas). */
  focusOnOpen: boolean
  onClose: () => void
  /** Esc só fecha quando o foco está na maquete, no painel ou na lista. */
  escapeInScope: () => boolean
}

/**
 * Painel do cômodo: nome, descrição, até 4 fotos reais (mínimo 1) e o link do projeto.
 * Fecha com Esc ou "Fechar"; quem o abriu devolve o foco (HouseSection).
 */
export function RoomPanel({ room, total, projectHref, focusOnOpen, onClose, escapeInScope }: Props) {
  const heading = useRef<HTMLHeadingElement>(null)
  const fotos = room.fotos.slice(0, 4)
  const rest = Math.max(1, fotos.length - 1)

  useEffect(() => {
    if (focusOnOpen) heading.current?.focus({ preventScroll: true })
  }, [room.id, focusOnOpen])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && escapeInScope()) onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose, escapeInScope])

  return (
    <aside data-lenis-prevent className={s.panel} aria-labelledby={`painel-${room.id}`} data-room-panel={room.id} key={room.id}>
      <div className={s.panelHead}>
        <p className={s.panelEyebrow}>
          Ambiente {room.num} <span aria-hidden="true">/</span>
          <span className="sr-only"> de </span> {String(total).padStart(2, '0')}
        </p>
        <button type="button" className={s.close} onClick={onClose}>
          Fechar
        </button>
      </div>
      <h3 id={`painel-${room.id}`} className={s.panelTitle} ref={heading} tabIndex={-1}>
        {room.nome}
      </h3>
      <p className={s.panelText}>{room.descricao}</p>
      <div className={s.photos} style={{ gridTemplateColumns: `repeat(${rest}, minmax(0, 1fr))` }}>
        {fotos.map((f, i) => (
          <figure key={f.id} className={i === 0 ? s.photoLead : s.photo}>
            <Image
              src={f.src}
              width={f.width}
              height={f.height}
              placeholder="blur"
              blurDataURL={f.blurDataURL}
              alt={`${room.nome}, foto ${i + 1} de ${fotos.length}`}
              sizes={i === 0 ? '(min-width: 900px) 400px, 100vw' : '(min-width: 900px) 140px, 33vw'}
            />
          </figure>
        ))}
      </div>
      <Link href={projectHref} className={s.panelLink}>
        Ver projeto completo
      </Link>
    </aside>
  )
}
