import type { RoomId } from '@/content/projetos'
import { APARTMENT, footprint, type Apartment, type Rect, type RoomLayout } from '@/three/apartment/layout'

/**
 * Matemática pura da câmera orbital da maquete (sem three/DOM, testável no Node).
 * Convenção esférica: posição = alvo + r · (sen φ · sen θ, cos φ, sen φ · cos θ),
 * com φ medido a partir da vertical e θ em torno do eixo Y (θ = 0 olha do sul).
 */

export type Spherical = { target: [number, number, number]; r: number; theta: number; phi: number }
export type ViewId = 'overview' | RoomId
export type HouseState = { view: ViewId; lighting: 'manha' | 'noite'; panelOpen: boolean }

export const PHI_MIN = 0.15
export const PHI_MAX = 1.45
export const R_MIN = 4
export const R_MAX = 55
/** Duração do voo até um cômodo (s). */
export const FLIGHT_SECONDS = 1.6
/** Auto-rotação na visão geral (rad/s) e espera sem interação antes de começar (ms). */
export const AUTO_ROTATE_SPEED = 0.06
export const AUTO_ROTATE_IDLE_MS = 7000

const TAU = Math.PI * 2

export const clampPhi = (phi: number) => Math.min(PHI_MAX, Math.max(PHI_MIN, phi))
export const clampRadius = (r: number) => Math.min(R_MAX, Math.max(R_MIN, r))

/** O ângulo equivalente a `to` (módulo 2π) mais próximo de `from`: o voo segue o caminho curto. */
export function shortestTheta(from: number, to: number): number {
  const d = (((to - from + Math.PI) % TAU) + TAU) % TAU - Math.PI
  return from + d
}

/** Interpolação com extremos exatos (k = 0 → a, k = 1 → b com θ pelo caminho curto). */
export function lerpSpherical(a: Spherical, b: Spherical, k: number): Spherical {
  return lerpSphericalInto({ target: [0, 0, 0], r: 0, theta: 0, phi: 0 }, a, b, k)
}

/** Mesma interpolação escrevendo em `out` (sem alocar: usada a cada quadro dos voos). */
export function lerpSphericalInto(out: Spherical, a: Spherical, b: Spherical, k: number): Spherical {
  const j = 1 - k
  out.target[0] = a.target[0] * j + b.target[0] * k
  out.target[1] = a.target[1] * j + b.target[1] * k
  out.target[2] = a.target[2] * j + b.target[2] * k
  out.r = a.r * j + b.r * k
  out.theta = a.theta * j + shortestTheta(a.theta, b.theta) * k
  out.phi = a.phi * j + b.phi * k
  return out
}

export function easeInOutCubic(t: number): number {
  if (t <= 0) return 0
  if (t >= 1) return 1
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/** Parede externa voltada para a câmera (normal · direção > 0,3) cai para 15%. */
export function wallOpacity(normal: [number, number], camDirXZ: [number, number]): number {
  return normal[0] * camDirXZ[0] + normal[1] * camDirXZ[1] > 0.3 ? 0.15 : 1
}

/** Posição da câmera para um estado esférico (escreve em `out`, sem alocar). */
export function sphericalToPosition(s: Spherical, out: [number, number, number] = [0, 0, 0]): [number, number, number] {
  const sp = Math.sin(s.phi)
  out[0] = s.target[0] + s.r * sp * Math.sin(s.theta)
  out[1] = s.target[1] + s.r * Math.cos(s.phi)
  out[2] = s.target[2] + s.r * sp * Math.cos(s.theta)
  return out
}

/** Cômodo cujo retângulo contém o ponto (x, z) do piso, ou null. */
export function roomAtPoint(x: number, z: number, rooms: readonly RoomLayout[] = APARTMENT.rooms): RoomId | null {
  for (const r of rooms) {
    if (x >= r.rect.x0 && x <= r.rect.x1 && z >= r.rect.z0 && z <= r.rect.z1) return r.id
  }
  return null
}

// ── enquadramentos (derivados da planta, nunca de coordenadas fixas) ────────

/** O que os enquadramentos precisam da planta (a planta real ou uma sintética nos testes). */
export type PlanLike = {
  rooms: readonly RoomLayout[]
  areas: readonly { rect: Rect }[]
  varanda?: { rect: Rect }
}

const planFootprint = (a: PlanLike): Rect => footprint(a as unknown as Apartment)

/** Retângulo do "terreno" da maquete: a planta mais a varanda em balanço. */
export function siteBounds(a: PlanLike = APARTMENT): Rect {
  const f = planFootprint(a)
  const v = a.varanda?.rect
  if (!v) return f
  return { x0: Math.min(f.x0, v.x0), z0: Math.min(f.z0, v.z0), x1: Math.max(f.x1, v.x1), z1: Math.max(f.z1, v.z1) }
}

/** r 27 enquadrava a planta estimada de 17 × 10,4 m (diagonal ≈ 19,9 m): mantém a proporção. */
const OVERVIEW_R_PER_M = 27 / Math.hypot(17, 10.4)

/** Visão geral: de nordeste, centrada no terreno (planta + varanda), raio proporcional à diagonal. */
export function overviewView(a: PlanLike = APARTMENT): Spherical {
  const b = siteBounds(a)
  return {
    target: [(b.x0 + b.x1) / 2, 0.4, (b.z0 + b.z1) / 2],
    r: clampRadius(OVERVIEW_R_PER_M * Math.hypot(b.x1 - b.x0, b.z1 - b.z0)),
    theta: Math.PI - 0.62,
    phi: 0.95,
  }
}

/** Abaixo desta maior dimensão (m) o cômodo é visto bem mais de cima (paredes de 2,7 m escondem o piso). */
const SMALL_ROOM = 2.6
/** Inclinação lateral (em unidades da tangente) quando o cômodo toca uma única fachada. */
const SKEW = 0.46
const EDGE_EPS = 1e-4

/** Ajustes finos opcionais por cômodo (aplicados sobre o enquadramento derivado). */
export const VIEW_OVERRIDES: Partial<Record<RoomId, Partial<Omit<Spherical, 'target'>>>> = {}

/**
 * Enquadramento de um cômodo a partir do seu retângulo: alvo no centro, raio proporcional ao
 * tamanho, φ ≈ 0,68. A câmera fica do lado das fachadas que o retângulo REALMENTE toca (borda
 * igual à da planta), onde a parede externa some: num canto, na bissetriz; numa só fachada,
 * levemente inclinada para fora da planta. Cômodos internos (sem fachada) ou pequenos ganham
 * uma vista quase de cima.
 */
export function viewFor(room: RoomLayout, f: Rect = planFootprint(APARTMENT)): Spherical {
  const { x0, x1, z0, z1 } = room.rect
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const dim = Math.max(x1 - x0, z1 - z0)
  const on = (a: number, b: number) => Math.abs(a - b) < EDGE_EPS
  // soma das normais externas das fachadas tocadas (n = −z, s = +z, w = −x, e = +x)
  let dx = (on(x1, f.x1) ? 1 : 0) - (on(x0, f.x0) ? 1 : 0)
  let dz = (on(z1, f.z1) ? 1 : 0) - (on(z0, f.z0) ? 1 : 0)
  const exterior = dx !== 0 || dz !== 0
  if (exterior && (dx === 0 || dz === 0)) {
    // uma fachada só: inclina para o lado de fora da planta, ao longo da fachada
    if (dx === 0) dx = SKEW * (cx >= (f.x0 + f.x1) / 2 ? 1 : -1)
    else dz = SKEW * (cz >= (f.z0 + f.z1) / 2 ? 1 : -1)
  }
  const base: Spherical =
    !exterior || dim < SMALL_ROOM
      ? {
          target: [cx, 1.0, cz],
          r: clampRadius(6),
          theta: exterior ? Math.atan2(dx, dz) : Math.PI - 0.35,
          phi: 0.36,
        }
      : { target: [cx, 0.5, cz], r: clampRadius(Math.max(8.5, dim * 1.9)), theta: Math.atan2(dx, dz), phi: 0.68 }
  const o = VIEW_OVERRIDES[room.id]
  if (!o) return base
  return { ...base, ...o, r: clampRadius(o.r ?? base.r), phi: clampPhi(o.phi ?? base.phi) }
}

export function buildViews(a: PlanLike): Record<ViewId, Spherical> {
  const f = planFootprint(a)
  const views = { overview: overviewView(a) } as Record<ViewId, Spherical>
  for (const r of a.rooms) views[r.id] = viewFor(r, f)
  return views
}

export const VIEWS: Record<ViewId, Spherical> = buildViews(APARTMENT)
