import type { RoomId } from '@/content/projetos'

/**
 * Planta ESTIMADA do apartamento (a planta baixa oficial ainda não chegou), desenhada como um
 * apartamento alto padrão real, com três zonas (social, íntima e serviço). Plano XZ em metros,
 * origem no centro da planta, +x = leste, +z = sul. Fachada principal ao norte, com varanda
 * em balanço na frente do jantar e do living. 17,2 × 11,0 m = 189 m² privativos + varanda.
 *
 *  x: 0        5,0        9,8        13,2            17,2
 *     ┌··········varanda···········┐
 *  0  ┌─────────┬──────────┬───────────┬───────────────┐
 *     │ jantar ▓│▓ TV      │ suíte     │ suíte casal   │
 *     │ churr. ▓│▓  sofá   │ ripada    │ 4,0 × 4,2     │
 *     │        ▓│▓         │ 3,4 × 3,8 │               │
 *     │  ilha   ·  vão     ├──┬────────┼──────┬────────┤ 3,8 / 4,2
 *     │ cozinha ·          │ps│banho R │closet│banho C │
 *     │ bancada │ ·vão·    ├──┴────────┤      │        │ 5,8
 *     ├───┬─────┤hall│ circulação ────┴──────┴────────┤ 7,0
 *     │ser│desp.│    ├─────┬────────┬───┬──────────────┤
 *     │viç├─────┤    │lavab│solteiro│ps │  quarto      │
 *     │o  │wc   │    ├─────┤3,2×4,0 ├───┤  espelho     │
 *     │   │     │    │wc   │        │wc │  3,2 × 4,0   │
 * 11  └───┴─────┴─⇧──┴─────┴────────┴───┴──────────────┘
 *              entrada social
 *
 * ▓ pedra natural de dupla face na divisa jantar/living: churrasqueira de um lado, TV do outro.
 */

export type Rect = { x0: number; z0: number; x1: number; z1: number }
export type Side = 'n' | 's' | 'e' | 'w'
/** `center` é medido a partir do início da parede (x0 para n/s, z0 para e/w). */
export type Opening = {
  wall: Side
  center: number
  width: number
  y0: number
  y1: number
  kind: 'porta' | 'janela' | 'vao'
}
export type RoomLayout = { id: RoomId; rect: Rect; openings: Opening[]; labelAt: [number, number, number] }
/**
 * Área que não é um cômodo do projeto (não clicável). Áreas fechadas (banho, closet, serviço)
 * ganham paredes em todo o perímetro; hall, circulação e passagens são abertos entre si.
 */
export type AreaKind = 'hall' | 'circulacao' | 'banho' | 'closet' | 'servico' | 'varanda'
export type AreaLayout = { name: string; kind: AreaKind; rect: Rect; openings: Opening[] }

/** Peça de parede: caixa alinhada aos eixos. */
export type Box = { center: [number, number, number]; size: [number, number, number] }

const H = 2.7
const T = 0.12
// a planta foi desenhada com origem no canto noroeste; deslocamos para centralizar
const OX = -8.6
const OZ = -5.5

const R = (x0: number, z0: number, x1: number, z1: number): Rect => ({
  x0: x0 + OX,
  z0: z0 + OZ,
  x1: x1 + OX,
  z1: z1 + OZ,
})
const porta = (wall: Side, center: number, width = 0.8): Opening => ({ wall, center, width, y0: 0, y1: 2.1, kind: 'porta' })
const janela = (wall: Side, center: number, width: number, y0 = 0, y1 = 2.4): Opening => ({
  wall,
  center,
  width,
  y0,
  y1,
  kind: 'janela',
})
/** janela alta de banheiro */
const basculante = (wall: Side, center: number, width = 0.6): Opening => janela(wall, center, width, 1.6, 2.2)
const vao = (wall: Side, center: number, width: number, y1 = H): Opening => ({ wall, center, width, y0: 0, y1, kind: 'vao' })
const label = (r: Rect): [number, number, number] => [(r.x0 + r.x1) / 2, H + 0.25, (r.z0 + r.z1) / 2]
const room = (id: RoomId, rect: Rect, openings: Opening[]): RoomLayout => ({ id, rect, openings, labelAt: label(rect) })
const area = (name: string, kind: AreaKind, rect: Rect, openings: Opening[] = []): AreaLayout => ({ name, kind, rect, openings })

export const APARTMENT = {
  height: H,
  wallThickness: T,
  rooms: [
    // social: jantar + cozinha num retângulo fundo; a divisa leste é a pedra (z 0–3,4) e o vão para o living
    room('cozinha', R(0, 0, 5.0, 7.0), [
      janela('n', 2.5, 4.6),
      vao('e', 4.55, 2.1),
      janela('w', 4.9, 1.4, 1.0, 2.2),
      porta('s', 0.5),
    ]),
    room('living', R(5.0, 0, 9.8, 5.8), [janela('n', 2.4, 4.2), vao('w', 4.55, 2.1), vao('s', 1.4, 2.0, 2.4)]),
    room('lavabo', R(7.6, 7.0, 9.2, 8.8), [porta('w', 0.5, 0.7)]),
    // íntima: portas de entrada em quatro linhas diferentes (passagens, closet, circulação)
    room('suite-ripada', R(9.8, 0, 13.2, 3.8), [janela('n', 1.7, 2.2), porta('s', 0.7), porta('s', 2.6, 0.7)]),
    room('suite-casal', R(13.2, 0, 17.2, 4.2), [janela('n', 2.0, 2.6), janela('e', 2.9, 0.9, 0.9, 2.2), porta('s', 0.6)]),
    room('quarto-solteiro', R(9.2, 7.0, 12.4, 11.0), [janela('s', 1.7, 2.0), porta('n', 0.5), porta('w', 3.4, 0.7)]),
    room('quarto-espelho', R(14.0, 7.0, 17.2, 11.0), [janela('s', 1.6, 2.0), porta('w', 1.0), porta('w', 3.4, 0.7)]),
  ] as RoomLayout[],
  areas: [
    area('hall', 'hall', R(5.0, 5.8, 7.6, 11.0), [porta('s', 1.3, 1.0)]),
    area('circulacao', 'circulacao', R(7.6, 5.8, 13.2, 7.0)),
    area('passagem-ripada', 'circulacao', R(9.8, 3.8, 11.4, 5.8)),
    area('passagem-espelho', 'circulacao', R(12.4, 7.0, 14.0, 8.4)),
    area('banho-ripada', 'banho', R(11.4, 3.8, 13.2, 5.8)),
    area('closet-casal', 'closet', R(13.2, 4.2, 15.2, 7.0), [porta('w', 2.2), porta('e', 1.0, 0.7)]),
    area('banho-casal', 'banho', R(15.2, 4.2, 17.2, 7.0), [basculante('e', 1.6, 0.8)]),
    area('banho-solteiro', 'banho', R(7.6, 8.8, 9.2, 11.0), [basculante('s', 0.8)]),
    area('banho-espelho', 'banho', R(12.4, 8.4, 14.0, 11.0), [basculante('s', 0.8)]),
    // serviço, atrás da cozinha
    area('servico', 'servico', R(0, 7.0, 3.0, 11.0), [janela('s', 1.1, 1.2, 1.0, 2.2), porta('s', 2.4)]),
    area('despensa', 'servico', R(3.0, 7.0, 5.0, 9.2), [porta('w', 1.1, 0.7)]),
    area('banho-servico', 'banho', R(3.0, 9.2, 5.0, 11.0), [porta('w', 0.9, 0.7), basculante('s', 1.2)]),
  ] as AreaLayout[],
  /** Varanda em balanço na fachada norte (fora do retângulo da planta): piso e guarda-corpo de vidro. */
  varanda: area('varanda', 'varanda', R(0, -1.8, 9.8, 0)),
} as const

/** Áreas cercadas por paredes em todo o perímetro. */
export const ENCLOSED_AREAS: ReadonlySet<AreaKind> = new Set<AreaKind>(['banho', 'closet', 'servico'])

export type Apartment = typeof APARTMENT

export function wallLength(r: Rect, wall: Side): number {
  return wall === 'n' || wall === 's' ? r.x1 - r.x0 : r.z1 - r.z0
}

export function footprint(a: Apartment): Rect {
  const all = [...a.rooms, ...a.areas].map((r) => r.rect)
  return {
    x0: Math.min(...all.map((r) => r.x0)),
    z0: Math.min(...all.map((r) => r.z0)),
    x1: Math.max(...all.map((r) => r.x1)),
    z1: Math.max(...all.map((r) => r.z1)),
  }
}

// ── geometria das paredes ────────────────────────────────────────────────

type Edge = { axis: 'x' | 'z'; coord: number; s: number; e: number }
type AbsOpening = { s: number; e: number; y0: number; y1: number; kind: Opening['kind'] }

const EPS = 1e-6
const near = (a: number, b: number) => Math.abs(a - b) < 1e-4

function edgeOf(r: Rect, side: Side): Edge {
  switch (side) {
    case 'n':
      return { axis: 'x', coord: r.z0, s: r.x0, e: r.x1 }
    case 's':
      return { axis: 'x', coord: r.z1, s: r.x0, e: r.x1 }
    case 'w':
      return { axis: 'z', coord: r.x0, s: r.z0, e: r.z1 }
    case 'e':
      return { axis: 'z', coord: r.x1, s: r.z0, e: r.z1 }
  }
}

function absOpening(r: Rect, o: Opening): AbsOpening {
  const start = o.wall === 'n' || o.wall === 's' ? r.x0 : r.z0
  return { s: start + o.center - o.width / 2, e: start + o.center + o.width / 2, y0: o.y0, y1: o.y1, kind: o.kind }
}

function boundarySide(f: Rect, edge: Edge): Side | null {
  if (edge.axis === 'x') {
    if (near(edge.coord, f.z0)) return 'n'
    if (near(edge.coord, f.z1)) return 's'
  } else {
    if (near(edge.coord, f.x0)) return 'w'
    if (near(edge.coord, f.x1)) return 'e'
  }
  return null
}

const SIDES: Side[] = ['n', 's', 'e', 'w']

function dedupe(list: AbsOpening[]): AbsOpening[] {
  const seen = new Map<string, AbsOpening>()
  for (const o of list) seen.set([o.s, o.e, o.y0, o.y1].map((v) => v.toFixed(3)).join('|'), o)
  return [...seen.values()].sort((a, b) => a.s - b.s)
}

function union(intervals: Array<[number, number]>): Array<[number, number]> {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0])
  const out: Array<[number, number]> = []
  for (const [s, e] of sorted) {
    const last = out[out.length - 1]
    if (last && s <= last[1] + EPS) last[1] = Math.max(last[1], e)
    else out.push([s, e])
  }
  return out
}

/** Corta uma faixa de parede [s, e] nas aberturas, devolvendo caixas. */
function cutWall(axis: 'x' | 'z', coord: number, s: number, e: number, openings: AbsOpening[], h: number, t: number): Box[] {
  const boxes: Box[] = []
  const push = (a: number, b: number, y0: number, y1: number) => {
    if (b - a < EPS || y1 - y0 < EPS) return
    const mid = (a + b) / 2
    const cy = (y0 + y1) / 2
    boxes.push(
      axis === 'x'
        ? { center: [mid, cy, coord], size: [b - a, y1 - y0, t] }
        : { center: [coord, cy, mid], size: [t, y1 - y0, b - a] },
    )
  }
  let cursor = s
  for (const o of openings) {
    if (o.e <= s || o.s >= e) continue
    const os = Math.max(o.s, s)
    const oe = Math.min(o.e, e)
    push(cursor, os, 0, h)
    push(os, oe, 0, o.y0)
    push(os, oe, o.y1, h)
    cursor = Math.max(cursor, oe)
  }
  push(cursor, e, 0, h)
  return boxes
}

/** Paredes internas (centradas nas divisas entre cômodos), já recortadas nas aberturas. */
export function interiorWallPieces(a: Apartment): Box[] {
  const f = footprint(a)
  const lines = new Map<string, { axis: 'x' | 'z'; coord: number; spans: Array<[number, number]>; openings: AbsOpening[] }>()
  const walled = [...a.rooms, ...a.areas.filter((x) => ENCLOSED_AREAS.has(x.kind))]
  for (const r of walled) {
    for (const side of SIDES) {
      const edge = edgeOf(r.rect, side)
      if (boundarySide(f, edge)) continue
      const key = `${edge.axis}:${edge.coord.toFixed(3)}`
      const line = lines.get(key) ?? { axis: edge.axis, coord: edge.coord, spans: [], openings: [] }
      line.spans.push([edge.s, edge.e])
      for (const o of r.openings) if (o.wall === side) line.openings.push(absOpening(r.rect, o))
      lines.set(key, line)
    }
  }
  // aberturas de áreas abertas (hall, circulação) que caem numa linha de parede já existente
  for (const r of a.areas) {
    if (ENCLOSED_AREAS.has(r.kind)) continue
    for (const o of r.openings) {
      const edge = edgeOf(r.rect, o.wall)
      lines.get(`${edge.axis}:${edge.coord.toFixed(3)}`)?.openings.push(absOpening(r.rect, o))
    }
  }
  const out: Box[] = []
  for (const line of lines.values()) {
    const [min, max] = line.axis === 'x' ? [f.x0, f.x1] : [f.z0, f.z1]
    const openings = dedupe(line.openings)
    for (const [s, e] of union(line.spans)) {
      out.push(...cutWall(line.axis, line.coord, Math.max(min, s - T / 2), Math.min(max, e + T / 2), openings, a.height, T))
    }
  }
  return out
}

export type ExteriorWall = {
  side: Side
  /** normal para fora, no plano XZ */
  normal: [number, number]
  /** centro da parede no plano XZ */
  center: [number, number]
  length: number
  thickness: number
  openings: AbsOpening[]
  pieces: Box[]
}

/** As quatro paredes externas, por fora do retângulo da planta. N e S cobrem os cantos. */
export function exteriorWalls(a: Apartment): ExteriorWall[] {
  const f = footprint(a)
  const openingsBySide: Record<Side, AbsOpening[]> = { n: [], s: [], e: [], w: [] }
  for (const r of [...a.rooms, ...a.areas]) {
    for (const o of r.openings) {
      const side = boundarySide(f, edgeOf(r.rect, o.wall))
      if (side) openingsBySide[side].push(absOpening(r.rect, o))
    }
  }
  const t = a.wallThickness
  const def: Record<Side, { normal: [number, number]; axis: 'x' | 'z'; coord: number; s: number; e: number }> = {
    n: { normal: [0, -1], axis: 'x', coord: f.z0 - t / 2, s: f.x0 - t, e: f.x1 + t },
    s: { normal: [0, 1], axis: 'x', coord: f.z1 + t / 2, s: f.x0 - t, e: f.x1 + t },
    w: { normal: [-1, 0], axis: 'z', coord: f.x0 - t / 2, s: f.z0, e: f.z1 },
    e: { normal: [1, 0], axis: 'z', coord: f.x1 + t / 2, s: f.z0, e: f.z1 },
  }
  return SIDES.map((side) => {
    const d = def[side]
    const openings = dedupe(openingsBySide[side])
    const mid = (d.s + d.e) / 2
    return {
      side,
      normal: d.normal,
      center: d.axis === 'x' ? [mid, d.coord] : [d.coord, mid],
      length: d.e - d.s,
      thickness: t,
      openings,
      pieces: cutWall(d.axis, d.coord, d.s, d.e, openings, a.height, t),
    }
  })
}

export type Baseboard = Box & { side: Side | null }

/** Rodapés de cada cômodo, na face interna das paredes, interrompidos nos vãos que tocam o piso. */
export function baseboardPieces(a: Apartment, height = 0.07, depth = 0.012): Baseboard[] {
  const f = footprint(a)
  const out: Baseboard[] = []
  for (const r of a.rooms) {
    for (const side of SIDES) {
      const edge = edgeOf(r.rect, side)
      const ext = boundarySide(f, edge)
      // face interna: na borda (parede externa fica por fora) ou meia espessura para dentro
      const inset = (ext ? 0 : T / 2) + depth / 2
      const dir = side === 'n' || side === 'w' ? 1 : -1
      const coord = edge.coord + dir * inset
      const trim = ext ? 0 : T / 2
      const s = edge.s + trim
      const e = edge.e - trim
      const floorOpenings = r.openings.filter((o) => o.wall === side && o.y0 === 0).map((o) => absOpening(r.rect, o))
      for (const b of cutWall(edge.axis, coord, s, e, floorOpenings, height, depth)) {
        // cutWall devolve também as vergas acima da abertura; no rodapé só interessa a faixa no piso
        if (b.center[1] - b.size[1] / 2 > EPS) continue
        out.push({ ...b, side: ext })
      }
    }
  }
  return out
}
