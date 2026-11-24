'use client'

import dynamic from 'next/dynamic'
import { getImageProps } from 'next/image'
import { Component, useEffect, useMemo, type ReactNode, type RefObject } from 'react'
import { site } from '@/config/site'
import s from './intro.module.css'

// three + R3F + a maquete: só no cliente, e só quando a abertura completa vai mesmo tocar
const DawnCanvas = dynamic(() => import('@/three/intro/DawnCanvas'), { ssr: false })

export type DawnKind = 'video' | 'canvas' | 'still'

type Props = {
  kind: DawnKind
  clock: RefObject<number>
  start: number
  duration: number
  quality: 'high' | 'low'
  /** a cena tem quadro para mostrar (canvas desenhado, vídeo tocável, foto carregada) */
  onReady: () => void
  /** o canvas caiu: o Intro troca para o quadro estático */
  onFail: () => void
  /** `true` no modo completo: o quadro estático também "amanhece" (CSS) */
  animateStill: boolean
  still: StillPhoto
}

/** Erro no canvas (chunk, shader, contexto) nunca derruba a abertura: vira quadro estático. */
class DawnBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch() {
    this.props.onError()
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export type StillPhoto = { src: string; width: number; height: number }

/** Fundo CSS (image-set 1x/2x) a partir da otimização do next/image. */
function coverBackground(photo: StillPhoto): string {
  const width = 1600
  const height = Math.round((photo.height / photo.width) * width)
  const { props } = getImageProps({ src: photo.src, width, height, alt: '', quality: 70 })
  const set = (props.srcSet ?? '').split(', ').filter(Boolean).map((entry) => {
    const [url, d] = entry.split(' ')
    return `url("${url}") ${d ?? '1x'}`
  })
  return set.length ? `image-set(${set.join(', ')})` : `url("${props.src}")`
}

/** Quadro estático: a capa do projeto (IMG_4736) sob um degradê do escuro ao quente. */
export function StillFrame({ photo, animate, onReady }: { photo: StillPhoto; animate: boolean; onReady?: () => void }) {
  const bg = useMemo(() => coverBackground(photo), [photo])
  useEffect(() => {
    onReady?.()
  }, [onReady])
  return (
    <div className={s.still} data-animate={animate} aria-hidden="true">
      <div className={s.stillPhoto} style={{ backgroundImage: bg }} />
      <div className={s.stillGrade} />
    </div>
  )
}

/**
 * O amanhecer por trás das letras: vídeo pré-renderizado (Fase 2, `site.intro.videoSrc`),
 * cena em tempo real com a maquete (agora) ou o quadro estático (sem WebGL / reduced motion).
 */
export function IntroDawnScene({ kind, clock, start, duration, quality, onReady, onFail, animateStill, still }: Props) {
  if (kind === 'video' && site.intro.videoSrc) {
    return (
      <video
        className={s.video}
        src={site.intro.videoSrc}
        muted
        playsInline
        autoPlay
        preload="auto"
        aria-hidden="true"
        onCanPlay={onReady}
        onError={onFail}
      />
    )
  }
  if (kind === 'canvas') {
    return (
      <div className={s.canvas} data-intro-canvas>
        <DawnBoundary onError={onFail}>
          <DawnCanvas clock={clock} start={start} duration={duration} quality={quality} onReady={onReady} onFail={onFail} />
        </DawnBoundary>
      </div>
    )
  }
  return <StillFrame photo={still} animate={animateStill} onReady={onReady} />
}
