/**
 * Curvas do amanhecer da abertura, portadas do protótipo aprovado (`prototipos/abertura-ab.html`,
 * variante A). `p` vai de 0 (noite) a 1 (manhã clara). Funções puras: a cena 3D só aplica.
 */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** smoothstep entre a e b */
export const sstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}
/** in-out cúbico */
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Mistura de duas cores hexadecimais (sRGB) → número 0xRRGGBB. */
export function mixHex(a: number, b: number, t: number): number {
  const k = clamp01(t)
  const ch = (c: number, s: number) => (c >> s) & 0xff
  const m = (s: number) => Math.round(lerp(ch(a, s), ch(b, s), k)) << s
  return m(16) | m(8) | m(0)
}

export type DawnState = {
  /** elevação e azimute do sol (rad); azimute 0 = norte, positivo para leste */
  sunElevation: number
  sunAzimuth: number
  sunIntensity: number
  sunColor: number
  hemiIntensity: number
  hemiSky: number
  sky: number
  skyGain: number
  curtainGlow: number
  exposure: number
  env: number
  dust: number
  /** rampa principal da luz (0 noite → 1 manhã), a mesma que move sol, hemisfério e exposição */
  ramp: number
  /** 0 → 1 do movimento lento de câmera (dolly) */
  dolly: number
}

/** Estado do amanhecer em `p` (0 → 1), com as mesmas rampas do protótipo. */
export function dawnAt(p: number): DawnState {
  const s = sstep(0.05, 0.85, p)
  const sky =
    p < 0.45 ? mixHex(0x070b18, 0xff9a55, sstep(0.02, 0.45, p)) : mixHex(0xff9a55, 0xfff4e6, sstep(0.45, 0.9, p))
  return {
    sunElevation: lerp(0.04, 0.36, s),
    sunAzimuth: lerp(0.62, 0.3, s),
    sunIntensity: 4.2 * sstep(0.06, 0.7, p),
    sunColor: mixHex(0xff6a2b, 0xffe9c9, sstep(0.15, 0.9, p)),
    hemiIntensity: 0.02 + 0.5 * s,
    hemiSky: mixHex(0x24345e, 0xfff3e2, s),
    sky,
    skyGain: lerp(0.6, 2.2, s),
    curtainGlow: 0.06 + 0.55 * s,
    exposure: lerp(0.5, 1.0, s),
    env: lerp(0.03, 0.45, s),
    dust: 0.55 * sstep(0.25, 0.6, p) * (1 - 0.6 * sstep(0.85, 1, p)),
    ramp: s,
    dolly: easeInOutCubic(clamp01(p)),
  }
}
