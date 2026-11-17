'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import type { Photo, Room } from '@/content/projetos'
import { compose, type Variant } from './compose'
import styles from './ProjectGallery.module.css'

gsap.registerPlugin(ScrollTrigger)

type Props = {
  projectName: string
  rooms: Room[]
  /** Fotos já resolvidas por cômodo (mesma ordem de rooms). */
  photosByRoom: Photo[][]
}

// sizes por variante e posição: no mobile a foto ocupa a coluna inteira.
const SIZES: Record<Variant, string[]> = {
  wide: ['100vw'],
  solo: ['(min-width: 900px) 40vw, 100vw'],
  'pair-portrait': ['(min-width: 900px) 38vw, 100vw', '(min-width: 900px) 38vw, 100vw'],
  'pair-landscape': ['(min-width: 900px) 58vw, 100vw', '(min-width: 900px) 40vw, 100vw'],
  mixed: ['(min-width: 900px) 33vw, 100vw', '(min-width: 900px) 62vw, 100vw'],
}

export function ProjectGallery({ projectName, rooms, photosByRoom }: Props) {
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = root.current
    if (!el) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((node) => {
        gsap.from(node, {
          opacity: 0,
          y: 28,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: { trigger: node, start: 'top 92%', once: true },
        })
      })
    }, el)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root}>
      {rooms.map((room, ri) => {
        const rows = compose(photosByRoom[ri])
        let n = 0
        return (
          <section key={room.id} className={styles.room} aria-labelledby={`room-${room.id}`}>
            <header className={styles.roomHead} data-reveal>
              <span className={styles.index} aria-hidden="true">
                {String(ri + 1).padStart(2, '0')}
              </span>
              <h2 id={`room-${room.id}`} className={styles.roomName}>
                {room.nome}
              </h2>
              <p className={styles.roomText}>{room.descricao}</p>
            </header>
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`${styles.row} ${styles[row.variant]} ${row.flip ? styles.flip : ''}`}
              >
                {row.photos.map((photo, pi) => {
                  n += 1
                  return (
                    <figure
                      key={photo.id}
                      className={styles.fig}
                      data-reveal
                      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
                    >
                      <Image
                        src={photo.src}
                        width={photo.width}
                        height={photo.height}
                        alt={`${room.nome}, ${projectName}: fotografia ${n}`}
                        sizes={SIZES[row.variant][pi]}
                        placeholder="blur"
                        blurDataURL={photo.blurDataURL}
                        className={styles.img}
                      />
                    </figure>
                  )
                })}
              </div>
            ))}
          </section>
        )
      })}
    </div>
  )
}
