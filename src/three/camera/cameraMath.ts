import type { RoomId } from '@/content/projetos'
import { APARTMENT, type Rect, type RoomLayout } from '@/three/apartment/layout'

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
  const mix = (x: number, y: number) => x * (1 - k) + y * k
  return {
    target: [mix(a.target[0], b.target[0]), mix(a.target[1], b.target[1]), mix(a.target[2], b.target[2])],
    r: mix(a.r, b.r),
    theta: mix(a.theta, shortestTheta(a.theta, b.theta)),
    phi: mix(a.phi, b.phi),
  }
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

type Bounds = Rect

/** Visão geral: de nordeste, centrada na planta, r 27 / φ 0,95. */
export function overviewView(a: { rooms: readonly { rect: Rect }[]; areas?: readonly { rect: Rect }[] } = APARTMENT): Spherical {
  const f = boundsOf(a)
  return { target: [(f.x0 + f.x1) / 2, 0.4, (f.z0 + f.z1) / 2], r: 27, theta: Math.PI - 0.62, phi: 0.95 }
}

function boundsOf(a: { rooms: readonly { rect: Rect }[]; areas?: readonly { rect: Rect }[] }): Bounds {
  const all = [...a.rooms, ...(a.areas ?? [])].map((r) => r.rect)
  return {
    x0: Math.min(...all.map((r) => r.x0)),
    z0: Math.min(...all.map((r) => r.z0)),
    x1: Math.max(...all.map((r) => r.x1)),
    z1: Math.max(...all.map((r) => r.z1)),
  }
}

/** Abaixo desta maior dimensão (m) o cômodo é visto bem mais de cima (paredes de 2,7 m escondem o piso). */
const SMALL_ROOM = 2.6

/** Ajustes finos opcionais por cômodo (aplicados sobre o enquadramento derivado). */
export const VIEW_OVERRIDES: Partial<Record<RoomId, Partial<Omit<Spherical, 'target'>>>> = {}

/**
 * Enquadramento de um cômodo a partir do seu retângulo: alvo no centro, raio proporcional ao
 * tamanho, φ ≈ 0,68, visto pelo lado da fachada mais próxima (metade sul da planta vista do sul,
 * metade norte vista do norte), onde a parede externa some. Cômodos pequenos (ex.: lavabo)
 * ganham uma vista quase de cima.
 */
export function viewFor(room: RoomLayout, bounds: Bounds = boundsOf(APARTMENT)): Spherical {
  const { x0, x1, z0, z1 } = room.rect
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  const dim = Math.max(x1 - x0, z1 - z0)
  const south = cz > (bounds.z0 + bounds.z1) / 2
  const small = dim < SMALL_ROOM
  const base: Spherical = small
    ? { target: [cx, 0.4, cz], r: clampRadius(7.5), theta: south ? 0.35 : Math.PI - 0.35, phi: 0.36 }
    : { target: [cx, 0.5, cz], r: clampRadius(Math.max(8.5, dim * 1.9)), theta: south ? 0.43 : Math.PI - 0.43, phi: 0.68 }
  const o = VIEW_OVERRIDES[room.id]
  if (!o) return base
  return { ...base, ...o, r: clampRadius(o.r ?? base.r), phi: clampPhi(o.phi ?? base.phi) }
}

export function buildViews(a: { rooms: readonly RoomLayout[]; areas?: readonly { rect: Rect }[] }): Record<ViewId, Spherical> {
  const b = boundsOf(a)
  const views = { overview: overviewView(a) } as Record<ViewId, Spherical>
  for (const r of a.rooms) views[r.id] = viewFor(r, b)
  return views
}

export const VIEWS: Record<ViewId, Spherical> = buildViews(APARTMENT)

export const VIEW_ORDER: ViewId[] = ['overview', ...APARTMENT.rooms.map((r) => r.id)]
