'use client'

import { useSyncExternalStore } from 'react'
import type { IntroPhase } from '@/lib/introMachine'

/** id da camada visual da abertura (renderizada no servidor só na home). */
export const INTRO_LAYER_ID = 'amene-intro'

/**
 * Fase da abertura compartilhada com o resto da página (maquete da #casa, botão do WhatsApp).
 * Antes de qualquer `setIntroPhase`, a fase inicial vem do DOM: se a camada da abertura veio
 * no HTML (home, primeira carga), a abertura está em curso; senão, não há abertura (`done`).
 */
let phase: IntroPhase | null = null
const listeners = new Set<() => void>()

function initialPhase(): IntroPhase {
  return document.getElementById(INTRO_LAYER_ID) ? 'black' : 'done'
}

export function getIntroPhase(): IntroPhase {
  if (phase === null) phase = initialPhase()
  return phase
}

export function setIntroPhase(next: IntroPhase) {
  if (phase === next) return
  phase = next
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

/** No servidor e na hidratação: `black` (nada de 3D nem de botão flutuante antes da hora). */
export function useIntroPhase(): IntroPhase {
  return useSyncExternalStore(subscribe, getIntroPhase, () => 'black')
}

/** A abertura já chegou ao clarão (ou terminou): o conteúdo por trás pode carregar o 3D. */
export function useIntroReleased(): boolean {
  const p = useIntroPhase()
  return p === 'flash' || p === 'done'
}
