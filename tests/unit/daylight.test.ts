import { describe, it, expect } from 'vitest'
import { DAY_STOPS, paletteAt, contrastRatio } from '@/lib/daylight'

describe('daylight', () => {
  it('returns exact stop palettes', () => {
    for (const s of DAY_STOPS) expect(paletteAt(s.at)).toEqual(s.palette)
    expect(paletteAt(0)).toEqual(DAY_STOPS[0].palette)
    expect(DAY_STOPS[0].palette.bg).toBe('#EFEBE5')
    expect(DAY_STOPS[3].palette.bg).toBe('#1C1916')
  })
  it('clamps', () => {
    expect(paletteAt(-1)).toEqual(paletteAt(0))
    expect(paletteAt(2)).toEqual(paletteAt(1))
  })
  it('keeps text contrast >= 4.5 at every 1% of scroll', () => {
    for (let i = 0; i <= 100; i++) {
      const p = paletteAt(i / 100)
      expect(contrastRatio(p.fg, p.bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(p.muted, p.bg)).toBeGreaterThanOrEqual(4.5)
      expect(contrastRatio(p.accent, p.bg)).toBeGreaterThanOrEqual(3)
    }
  })
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5)
  })
})

describe('daylight - cruzamento do cinza médio', () => {
  it('fg puro (#000/#FFF) em no máximo 2% das amostras', () => {
    let pure = 0
    let total = 0
    for (let i = 0; i <= 1000; i++) {
      const fg = paletteAt(i / 1000).fg.toUpperCase()
      total++
      if (fg === '#000000' || fg === '#FFFFFF') pure++
    }
    expect(pure / total).toBeLessThanOrEqual(0.02)
  })
})
