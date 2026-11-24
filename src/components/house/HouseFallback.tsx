'use client'

import Image from 'next/image'
import type { RoomId } from '@/content/projetos'
import type { HouseRoom } from './HouseSection'
import s from './house.module.css'

type Props = {
  rooms: HouseRoom[]
  view: string
  onSelect: (id: RoomId, opener: HTMLElement) => void
}

/**
 * Sem 3D: a grade de cômodos com a capa de cada um. Cada capa é um botão que abre o mesmo
 * RoomPanel da maquete (a imagem estática da planta fica no palco, em HouseSection).
 */
export function HouseFallback({ rooms, view, onSelect }: Props) {
  return (
    <nav aria-label="Ambientes da maquete" data-house-fallback>
      <ol className={s.fbGrid}>
        {rooms.map((r, i) => {
          const foto = r.fotos[0]
          return (
            <li key={r.id}>
              <button
                type="button"
                className={s.fbCard}
                data-view={r.id}
                aria-current={view === r.id ? 'true' : undefined}
                onClick={(e) => onSelect(r.id, e.currentTarget)}
              >
                <span className={s.fbThumb}>
                  {foto && (
                    <Image
                      src={foto.src}
                      alt=""
                      fill
                      sizes="(min-width: 900px) 16vw, 45vw"
                      placeholder="blur"
                      blurDataURL={foto.blurDataURL}
                    />
                  )}
                </span>
                <span className={s.fbLabel}>
                  <span className={s.navNum} aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {r.nome}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
