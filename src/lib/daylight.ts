export type Palette = { bg: string; fg: string; muted: string; accent: string; line: string }
export type DayStopName = 'amanhecer' | 'manha' | 'tarde' | 'anoitecer'
export type DayStop = { at: number; name: DayStopName; palette: Palette }

/**
 * Paleta da marca: off-white #EFEBE5, freijó #B07B4F, pedra #BFB6A8,
 * terracota #B4532A, sálvia #8A9A86, tinta #1C1916.
 */
export const DAY_STOPS: DayStop[] = [
  {
    at: 0,
    name: 'amanhecer',
    palette: { bg: '#EFEBE5', fg: '#1C1916', muted: '#5E564D', accent: '#9C4623', line: '#CFC8BD' },
  },
  {
    at: 0.3,
    name: 'manha',
    palette: { bg: '#E6E0D6', fg: '#1C1916', muted: '#554E45', accent: '#9C4623', line: '#C4BBAD' },
  },
  {
    // viés dourado (freijó) no fundo
    at: 0.65,
    name: 'tarde',
    palette: { bg: '#DCC7A6', fg: '#1C1916', muted: '#4D4034', accent: '#8C3E1D', line: '#BBA27C' },
  },
  {
    at: 1,
    name: 'anoitecer',
    palette: { bg: '#1C1916', fg: '#EFEBE5', muted: '#B3AA9D', accent: '#D9855A', line: '#3A352F' },
  },
]

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0)

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number]
}

function toLinear(c: number): number {
  const s = c / 255
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
}
function toSrgb(l: number): number {
  const v = l <= 0.0031308 ? l * 12.92 : 1.055 * Math.max(l, 0) ** (1 / 2.4) - 0.055
  return Math.round(Math.min(1, Math.max(0, v)) * 255)
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex)
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b)
}

/** WCAG 2.x contrast ratio. */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

function hexToOklab(hex: string): [number, number, number] {
  const [r, g, b] = hexToRgb(hex).map(toLinear)
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b)
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b)
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

function oklabToHex([L, a, b]: [number, number, number]): string {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3
  const r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
  return (
    '#' +
    [r, g, bl]
      .map((c) => toSrgb(c).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase()
  )
}

function mix(a: string, b: string, k: number): string {
  const A = hexToOklab(a)
  const B = hexToOklab(b)
  return oklabToHex([A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k])
}

/**
 * Paleta no ponto t (0..1) do dia. Exata nos stops; OKLab entre eles.
 * `fg` não é interpolado pelo cinza médio: troca de lado (escuro/claro) no ponto
 * em que o lado oposto passa a ter mais contraste contra o `bg` interpolado.
 * `muted` é interpolado e, se preciso, empurrado em direção ao `fg` até 4.5:1.
 */
export function paletteAt(t: number): Palette {
  const x = clamp01(t)
  const exact = DAY_STOPS.find((s) => s.at === x)
  if (exact) return { ...exact.palette }

  let i = 0
  while (i < DAY_STOPS.length - 2 && x > DAY_STOPS[i + 1].at) i++
  const a = DAY_STOPS[i]
  const b = DAY_STOPS[i + 1]
  const k = (x - a.at) / (b.at - a.at)

  const bg = mix(a.palette.bg, b.palette.bg, k)
  const dark = DAY_STOPS[0].palette.fg
  const light = DAY_STOPS[DAY_STOPS.length - 1].palette.fg
  // No cinza médio nem a tinta nem o off-white chegam a 4.5:1; nesse trecho o
  // fg é empurrado até preto/branco puro (único jeito de manter o contraste).
  const darkSide = contrastRatio(dark, bg) >= contrastRatio(light, bg)
  const base = darkSide ? dark : light
  const extreme = darkSide ? '#000000' : '#FFFFFF'
  let fg = base
  for (let n = 1; contrastRatio(fg, bg) < 4.5 && n <= 20; n++) fg = mix(base, extreme, n / 20)

  let muted = mix(a.palette.muted, b.palette.muted, k)
  for (let n = 1; contrastRatio(muted, bg) < 4.5 && n <= 20; n++) {
    muted = mix(muted, fg, n / 20)
  }

  let accent = mix(a.palette.accent, b.palette.accent, k)
  for (let n = 1; contrastRatio(accent, bg) < 3 && n <= 20; n++) accent = mix(accent, fg, n / 20)

  return {
    bg,
    fg,
    muted,
    accent,
    line: mix(a.palette.line, b.palette.line, k),
  }
}
