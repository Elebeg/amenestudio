/**
 * Máquina da abertura (00 · Abertura): funções puras, sem DOM.
 *
 *  full    → primeira visita da sessão: tela preta, amanhecer, letras, logo, clarão.
 *  short   → visitas seguintes na mesma sessão: só o logo e o clarão.
 *  reduced → prefers-reduced-motion: logo com fade sobre um quadro estático, sem queda de letras.
 *
 * Tempos em segundos desde o início da abertura.
 */

export type IntroPhase = 'black' | 'dawn' | 'letters' | 'logo' | 'flash' | 'done'
export type IntroMode = 'full' | 'short' | 'reduced'
export type IntroEvent = { type: 'tick'; t: number; mode: IntroMode } | { type: 'skip' }

export const PHASE_ORDER: readonly IntroPhase[] = ['black', 'dawn', 'letters', 'logo', 'flash', 'done']

const TIMELINES: Record<IntroMode, ReadonlyArray<{ phase: IntroPhase; at: number }>> = {
  full: [
    { phase: 'black', at: 0 },
    { phase: 'dawn', at: 0.6 },
    { phase: 'letters', at: 6.5 },
    { phase: 'logo', at: 9.0 },
    { phase: 'flash', at: 10.2 },
    { phase: 'done', at: 10.8 },
  ],
  short: [
    { phase: 'logo', at: 0 },
    { phase: 'flash', at: 0.9 },
    { phase: 'done', at: 1.4 },
  ],
  reduced: [
    { phase: 'logo', at: 0 },
    { phase: 'done', at: 1.2 },
  ],
}

/** As letras do logo e o intervalo entre as quedas. */
export const INTRO_LETTERS = ['A', 'M', 'E', 'N', 'E'] as const
export const LETTER_INTERVAL = 0.35

/** reduced > short > full */
export function introMode(o: { seenThisSession: boolean; reducedMotion: boolean }): IntroMode {
  if (o.reducedMotion) return 'reduced'
  if (o.seenThisSession) return 'short'
  return 'full'
}

export function introTimeline(mode: IntroMode): Array<{ phase: IntroPhase; at: number }> {
  return TIMELINES[mode].map((s) => ({ ...s }))
}

/** Instante em que cada letra começa a cair (modo full). */
export function letterSchedule(): Array<{ letter: string; at: number }> {
  const start = TIMELINES.full.find((s) => s.phase === 'letters')!.at
  return INTRO_LETTERS.map((letter, i) => ({ letter, at: start + i * LETTER_INTERVAL }))
}

/** Momento (s) em que a fase começa no modo dado; `undefined` se o modo não passa por ela. */
export function phaseStart(mode: IntroMode, phase: IntroPhase): number | undefined {
  return TIMELINES[mode].find((s) => s.phase === phase)?.at
}

/** Fase da linha do tempo no instante `t`. */
export function phaseAt(mode: IntroMode, t: number): IntroPhase {
  const tl = TIMELINES[mode]
  let phase = tl[0].phase
  // margem para o erro de ponto flutuante do relógio (ex.: 0,6 calculado como 0,5999…)
  for (const s of tl) if (t + 1e-9 >= s.at) phase = s.phase
  return phase
}

const rank = (p: IntroPhase) => PHASE_ORDER.indexOf(p)

/** `skip` leva qualquer fase a `done`; `tick` avança pela linha do tempo e nunca volta. */
export function introReducer(s: IntroPhase, e: IntroEvent): IntroPhase {
  if (e.type === 'skip') return 'done'
  const next = phaseAt(e.mode, e.t)
  return rank(next) > rank(s) ? next : s
}

// ── sessionStorage ───────────────────────────────────────────────────────

export const INTRO_SEEN_KEY = 'amene:intro-seen'
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** Já viu a abertura nesta sessão? Qualquer falha (modo privado, bloqueio) ⇒ não visto. */
export function readIntroSeen(storage: StorageLike | undefined | null): boolean {
  try {
    return storage?.getItem(INTRO_SEEN_KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen(storage: StorageLike | undefined | null): void {
  try {
    storage?.setItem(INTRO_SEEN_KEY, '1')
  } catch {
    // armazenamento indisponível: a próxima visita só repete a versão completa
  }
}
