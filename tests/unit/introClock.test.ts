import { describe, expect, it, vi } from 'vitest'
import { startIntroClock, type Ticker } from '@/lib/introClock'
import type { IntroPhase } from '@/lib/introMachine'

function fakeTicker() {
  const cbs = new Set<(time: number, deltaMs: number) => void>()
  const ticker: Ticker = { add: (cb) => void cbs.add(cb), remove: (cb) => void cbs.delete(cb) }
  const frame = (ms = 100) => [...cbs].forEach((cb) => cb(0, ms))
  return { ticker, frame, size: () => cbs.size }
}

function setup(mode: 'full' | 'short' | 'reduced', ready = true) {
  const tk = fakeTicker()
  const ticks: Array<[number, IntroPhase]> = []
  const timers: Array<{ cb: () => void; cleared: boolean }> = []
  const onFailsafe = vi.fn()
  const onFallback = vi.fn()
  const clock = startIntroClock({
    mode,
    frozen: null,
    ticker: tk.ticker,
    isReady: () => ready,
    onTick: (t, p) => ticks.push([t, p]),
    onFallback,
    onFailsafe,
    setTimer: (cb) => {
      const h = { cb, cleared: false }
      timers.push(h)
      return h
    },
    clearTimer: (h) => {
      ;(h as { cleared: boolean }).cleared = true
    },
  })
  return { tk, ticks, timers, clock, onFailsafe, onFallback }
}

describe('startIntroClock', () => {
  it('para sozinho em done: sai do ticker, cancela o tempo-limite e não emite mais ticks', () => {
    const { tk, ticks, timers, clock } = setup('short')
    for (let i = 0; i < 20; i++) tk.frame(100) // 2 s > done 1,4 s
    expect(ticks.at(-1)?.[1]).toBe('done')
    expect(clock.isRunning()).toBe(false)
    expect(tk.size()).toBe(0)
    expect(timers[0].cleared).toBe(true)
    const n = ticks.length
    tk.frame(100)
    expect(ticks.length).toBe(n)
    // exatamente um tick com fase done
    expect(ticks.filter(([, p]) => p === 'done')).toHaveLength(1)
  })

  it('stop() externo (pulo) também tira do ticker e cancela o tempo-limite', () => {
    const { tk, timers, clock } = setup('full')
    tk.frame()
    clock.stop()
    expect(tk.size()).toBe(0)
    expect(timers[0].cleared).toBe(true)
  })

  it('passo limitado a 0,1 s (aba em segundo plano pausa a abertura)', () => {
    const { tk, ticks } = setup('full')
    tk.frame(60_000)
    expect(ticks.at(-1)?.[0]).toBeCloseTo(0.1)
  })

  it('segura no preto até a cena ficar pronta e cai para o estático depois de 2,5 s', () => {
    const { tk, ticks, onFallback } = setup('full', false)
    for (let i = 0; i < 6; i++) tk.frame(100) // chega a 0,6
    const t0 = ticks.at(-1)![0]
    for (let i = 0; i < 10; i++) tk.frame(100)
    expect(ticks.at(-1)![0]).toBeCloseTo(t0) // segurando
    for (let i = 0; i < 20; i++) tk.frame(100)
    expect(onFallback).toHaveBeenCalledTimes(1)
  })

  it('o tempo-limite encerra a abertura', () => {
    const { timers, onFailsafe, tk } = setup('full')
    timers[0].cb()
    expect(onFailsafe).toHaveBeenCalledTimes(1)
    expect(tk.size()).toBe(0)
  })
})
