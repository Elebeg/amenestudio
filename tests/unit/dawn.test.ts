import { describe, expect, it } from 'vitest'
import { dawnAt, mixHex } from '@/lib/dawn'

describe('dawnAt (rampas do protótipo A)', () => {
  it('noite: exposição .5, sol laranja apagado, céu quase preto, sem poeira', () => {
    const d = dawnAt(0)
    expect(d.exposure).toBeCloseTo(0.5)
    expect(d.sunIntensity).toBe(0)
    expect(d.sunColor).toBe(0xff6a2b)
    expect(d.sky).toBe(0x070b18)
    expect(d.dust).toBe(0)
    expect(d.env).toBeCloseTo(0.03)
  })
  it('manhã: exposição 1, sol #ffe9c9, céu #fff4e6, hemisfério quente', () => {
    const d = dawnAt(1)
    expect(d.exposure).toBeCloseTo(1)
    expect(d.sunIntensity).toBeCloseTo(4.2)
    expect(d.sunColor).toBe(0xffe9c9)
    expect(d.sky).toBe(0xfff4e6)
    expect(d.hemiSky).toBe(0xfff3e2)
    expect(d.env).toBeCloseTo(0.45)
  })
  it('o sol sobe e gira para o norte', () => {
    expect(dawnAt(1).sunElevation).toBeGreaterThan(dawnAt(0).sunElevation)
    expect(dawnAt(1).sunAzimuth).toBeLessThan(dawnAt(0).sunAzimuth)
  })
  it('a poeira aparece no meio e diminui no fim', () => {
    expect(dawnAt(0.7).dust).toBeGreaterThan(dawnAt(1).dust)
    expect(dawnAt(1).dust).toBeGreaterThan(0)
  })
})

describe('mixHex', () => {
  it('extremos e meio', () => {
    expect(mixHex(0x000000, 0xffffff, 0)).toBe(0)
    expect(mixHex(0x000000, 0xffffff, 1)).toBe(0xffffff)
    expect(mixHex(0x000000, 0xfefefe, 0.5)).toBe(0x7f7f7f)
  })
})
