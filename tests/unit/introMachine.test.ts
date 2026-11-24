import { describe, expect, it } from 'vitest'
import {
  INTRO_LETTERS,
  INTRO_SEEN_KEY,
  introMode,
  introReducer,
  introTimeline,
  letterSchedule,
  markIntroSeen,
  phaseAt,
  readIntroSeen,
} from '@/lib/introMachine'

describe('introMode', () => {
  it('reduced vence tudo', () => {
    expect(introMode({ seenThisSession: true, reducedMotion: true })).toBe('reduced')
    expect(introMode({ seenThisSession: false, reducedMotion: true })).toBe('reduced')
  })
  it('short quando já viu nesta sessão', () => {
    expect(introMode({ seenThisSession: true, reducedMotion: false })).toBe('short')
  })
  it('full na primeira visita', () => {
    expect(introMode({ seenThisSession: false, reducedMotion: false })).toBe('full')
  })
})

describe('introTimeline', () => {
  it('full: black 0 · dawn .6 · letters 6.5 · logo 9.0 · flash 10.2 · done 10.8', () => {
    expect(introTimeline('full')).toEqual([
      { phase: 'black', at: 0 },
      { phase: 'dawn', at: 0.6 },
      { phase: 'letters', at: 6.5 },
      { phase: 'logo', at: 9.0 },
      { phase: 'flash', at: 10.2 },
      { phase: 'done', at: 10.8 },
    ])
  })
  it('short: logo 0 · flash .9 · done 1.4', () => {
    expect(introTimeline('short')).toEqual([
      { phase: 'logo', at: 0 },
      { phase: 'flash', at: 0.9 },
      { phase: 'done', at: 1.4 },
    ])
  })
  it('reduced: logo 0 · done 1.2', () => {
    expect(introTimeline('reduced')).toEqual([
      { phase: 'logo', at: 0 },
      { phase: 'done', at: 1.2 },
    ])
  })
})

describe('letterSchedule', () => {
  it('A, M, E, N, E a cada .35 s a partir de 6,5 s', () => {
    expect(INTRO_LETTERS).toEqual(['A', 'M', 'E', 'N', 'E'])
    const s = letterSchedule()
    expect(s.map((x) => x.letter)).toEqual(['A', 'M', 'E', 'N', 'E'])
    s.forEach((x, i) => expect(x.at).toBeCloseTo(6.5 + i * 0.35, 6))
  })
})

describe('introReducer', () => {
  it('skip de qualquer fase → done', () => {
    expect(introReducer('dawn', { type: 'skip' })).toBe('done')
    for (const p of ['black', 'dawn', 'letters', 'logo', 'flash', 'done'] as const) {
      expect(introReducer(p, { type: 'skip' })).toBe('done')
    }
  })
  it('tick segue a linha do tempo', () => {
    expect(introReducer('black', { type: 'tick', t: 7, mode: 'full' })).toBe('letters')
    expect(introReducer('black', { type: 'tick', t: 99, mode: 'full' })).toBe('done')
    expect(introReducer('black', { type: 'tick', t: 0.3, mode: 'full' })).toBe('black')
    expect(introReducer('black', { type: 'tick', t: 0.6, mode: 'full' })).toBe('dawn')
    expect(introReducer('black', { type: 'tick', t: 1, mode: 'short' })).toBe('flash')
    expect(introReducer('black', { type: 'tick', t: 0, mode: 'reduced' })).toBe('logo')
    expect(introReducer('logo', { type: 'tick', t: 1.2, mode: 'reduced' })).toBe('done')
  })
  it('nunca volta para trás (done continua done)', () => {
    expect(introReducer('done', { type: 'tick', t: 1, mode: 'full' })).toBe('done')
    expect(introReducer('logo', { type: 'tick', t: 2, mode: 'full' })).toBe('logo')
  })
})

describe('phaseAt', () => {
  it('antes do primeiro marco fica na primeira fase', () => {
    expect(phaseAt('full', -1)).toBe('black')
  })
})

describe('sessionStorage', () => {
  const mem = () => {
    const m = new Map<string, string>()
    return {
      getItem: (k: string) => m.get(k) ?? null,
      setItem: (k: string, v: string) => void m.set(k, v),
    }
  }
  const broken = {
    getItem: () => {
      throw new Error('SecurityError')
    },
    setItem: () => {
      throw new Error('QuotaExceededError')
    },
  }
  it('chave amene:intro-seen', () => expect(INTRO_SEEN_KEY).toBe('amene:intro-seen'))
  it('lê e grava', () => {
    const s = mem()
    expect(readIntroSeen(s)).toBe(false)
    markIntroSeen(s)
    expect(readIntroSeen(s)).toBe(true)
  })
  it('falha ⇒ tratar como não visto, sem lançar', () => {
    expect(readIntroSeen(broken)).toBe(false)
    expect(() => markIntroSeen(broken)).not.toThrow()
    expect(readIntroSeen(undefined)).toBe(false)
  })
})
