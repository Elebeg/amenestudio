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

/**
 * A camada da abertura já saiu do DOM (ou nunca existiu)? `done` chega antes: a saída ainda
 * dissolve por ~1 s com o canvas do amanhecer montado. A maquete espera por isto para não
 * abrir um segundo contexto WebGL por cima do primeiro.
 */
let gone: boolean | null = null

function getIntroGone(): boolean {
  if (gone === null) gone = !document.getElementById(INTRO_LAYER_ID)
  return gone
}

export function setIntroGone() {
  if (gone === true) return
  gone = true
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

/** No servidor e na hidratação: `false` (o 3D só entra no cliente, depois da abertura). */
export function useIntroGone(): boolean {
  return useSyncExternalStore(subscribe, getIntroGone, () => false)
}
