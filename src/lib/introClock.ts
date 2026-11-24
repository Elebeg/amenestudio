import { introReducer, phaseStart, type IntroMode, type IntroPhase } from './introMachine'

/** O que o relógio precisa de um "ticker" (gsap.ticker na página; falso nos testes). */
export type Ticker = {
  add: (cb: (time: number, deltaMs: number) => void) => void
  remove: (cb: (time: number, deltaMs: number) => void) => void
}

export type IntroClockOptions = {
  mode: IntroMode
  /** tempo congelado (revisão visual) ou null */
  frozen: number | null
  ticker: Ticker
  /** a cena do amanhecer já tem quadro para mostrar? */
  isReady: () => boolean
  onTick: (t: number, phase: IntroPhase) => void
  /** a cena não ficou pronta dentro do tempo de espera: usar o quadro estático */
  onFallback: () => void
  /** tempo-limite absoluto (ms) atingido: encerrar a abertura */
  onFailsafe: () => void
  maxHold?: number
  failsafeMs?: number
  setTimer?: (cb: () => void, ms: number) => unknown
  clearTimer?: (id: unknown) => void
}

export type IntroClock = { stop: () => void; isRunning: () => boolean }

/**
 * Relógio da abertura: avança com o tempo dos quadros (passo limitado a 0,1 s, então uma aba em
 * segundo plano pausa a abertura), segura no preto até a cena ficar pronta (no máximo `maxHold`)
 * e para sozinho, tirando-se do ticker e cancelando o tempo-limite, assim que chega a `done`.
 */
export function startIntroClock(o: IntroClockOptions): IntroClock {
  const maxHold = o.maxHold ?? 2.5
  const failsafeMs = o.failsafeMs ?? 20_000
  const setTimer = o.setTimer ?? ((cb: () => void, ms: number) => setTimeout(cb, ms))
  const clearTimer = o.clearTimer ?? ((id: unknown) => clearTimeout(id as ReturnType<typeof setTimeout>))
  const dawnStart = phaseStart('full', 'dawn') ?? 0.6
  let t = o.frozen ?? 0
  let hold = 0
  let fellBack = false
  let phase: IntroPhase = 'black'
  let running = true
  let timer: unknown = null

  const stop = () => {
    if (!running) return
    running = false
    o.ticker.remove(tick)
    if (timer !== null) clearTimer(timer)
    timer = null
  }

  function tick(_time: number, deltaMs: number) {
    if (!running) return
    if (o.frozen === null) {
      const dt = Math.min(Math.max(deltaMs, 0) / 1000, 0.1)
      if (o.mode === 'full' && t >= dawnStart && !o.isReady() && hold < maxHold) hold += dt
      else t += dt
      if (hold >= maxHold && !o.isReady() && !fellBack) {
        fellBack = true
        o.onFallback()
      }
    }
    phase = introReducer(phase, { type: 'tick', t, mode: o.mode })
    o.onTick(t, phase)
    if (phase === 'done') stop()
  }

  tick(0, 0)
  if (running) {
    o.ticker.add(tick)
    if (o.frozen === null)
      timer = setTimer(() => {
        if (!running) return
        stop()
        o.onFailsafe()
      }, failsafeMs)
  }
  return { stop, isRunning: () => running }
}
