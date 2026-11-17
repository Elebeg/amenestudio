import type { RoomId } from '@/content/projetos'
import { APARTMENT } from '@/three/apartment/layout'

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
export function roomAtPoint(x: number, z: number): RoomId | null {
  for (const r of APARTMENT.rooms) {
    if (x >= r.rect.x0 && x <= r.rect.x1 && z >= r.rect.z0 && z <= r.rect.z1) return r.id
  }
  return null
}

// ── enquadramentos ─────────────────────────────────────────────────────────

/** Visão geral: de nordeste, com a pedra e o living à frente. */
const OVERVIEW: Spherical = { target: [0, 0.4, 0], r: 27, theta: Math.PI - 0.62, phi: 0.95 }

/**
 * Cômodos: φ ≈ 0,68, vistos pela parede externa que some (quartos da fileira sul vistos do sul,
 * área social vista do norte). O lavabo (1,5 × 1,8 m, paredes de 2,7 m) quase não aparece a
 * 0,68: ganha uma vista bem mais de cima.
 */
function roomView(id: RoomId): Spherical {
  const room = APARTMENT.rooms.find((r) => r.id === id)!
  const { x0, x1, z0, z1 } = room.rect
  const cx = (x0 + x1) / 2
  const cz = (z0 + z1) / 2
  if (id === 'lavabo') return { target: [cx, 0.4, cz], r: clampRadius(7.5), theta: Math.PI - 0.35, phi: 0.36 }
  const dim = Math.max(x1 - x0, z1 - z0)
  const south = cz > 0
  return {
    target: [cx, 0.5, cz],
    r: clampRadius(Math.max(8.5, dim * 1.9)),
    theta: south ? 0.43 : Math.PI - 0.43,
    phi: 0.68,
  }
}

export const VIEWS: Record<ViewId, Spherical> = {
  overview: OVERVIEW,
  ...(Object.fromEntries(APARTMENT.rooms.map((r) => [r.id, roomView(r.id)])) as Record<RoomId, Spherical>),
}

export const VIEW_ORDER: ViewId[] = ['overview', ...APARTMENT.rooms.map((r) => r.id)]
