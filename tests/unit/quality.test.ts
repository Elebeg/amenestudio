import { describe, expect, it } from 'vitest'
import { detectTier } from '@/lib/quality'

const p = (q = '') => new URLSearchParams(q)
const base = { webgl: true, deviceMemory: 8, hardwareConcurrency: 8, saveData: false, params: p() }

describe('detectTier', () => {
  it('none sem WebGL', () => expect(detectTier({ ...base, webgl: false })).toBe('none'))
  it('none com ?3d=0', () => expect(detectTier({ ...base, params: p('3d=0') })).toBe('none'))
  it('?3d=0 vence o aparelho forte; sem WebGL vence tudo', () => {
    expect(detectTier({ ...base, webgl: false, saveData: true })).toBe('none')
  })
  it('low com saveData', () => expect(detectTier({ ...base, saveData: true })).toBe('low'))
  it('low com deviceMemory <= 4', () => {
    expect(detectTier({ ...base, deviceMemory: 4 })).toBe('low')
    expect(detectTier({ ...base, deviceMemory: 2 })).toBe('low')
  })
  it('low com hardwareConcurrency <= 4', () => {
    expect(detectTier({ ...base, hardwareConcurrency: 4 })).toBe('low')
  })
  it('high no aparelho forte', () => expect(detectTier(base)).toBe('high'))
  it('high quando as métricas não existem (Safari/Firefox)', () => {
    expect(detectTier({ webgl: true, params: p() })).toBe('high')
  })
  it('?3d=1 não muda nada', () => expect(detectTier({ ...base, params: p('3d=1') })).toBe('high'))
})
