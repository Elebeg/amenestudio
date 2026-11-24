'use client'

import * as THREE from 'three'
import { useMats } from '../materialsContext'
import { B, C, Curtain, Extruded, RoomGroup, Slats } from '../parts'
import { Bed, Chair, Nightstand, StrawPendant, Tv } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Suíte com ripado (IMG_4924, 4951, 4943, 4946). Na parede leste, cabeceira de ripas de freijó
 * emoldurada sobre fundo branco, com pendentes de palha dos dois lados. Na parede oeste,
 * lambri ripado branco emoldurado em freijó, escrivaninha de freijó com ponta curva e
 * gaveteiro, frigobar, prateleira branca e TV.
 * Local: x 0→3,4, z 0→3,8. Janela ao norte; porta de entrada e porta do banheiro ao sul.
 */

// tampo em planta (x = distância da parede, y = −z); ponta sul em arco
function deskShape() {
  const s = new THREE.Shape()
  const d = 0.55
  const r = 0.3
  s.moveTo(0, -0.45)
  s.lineTo(d, -0.45)
  s.lineTo(d, -(2.6 - r))
  s.absarc(d - r, -(2.6 - r), r, 0, -Math.PI / 2, true)
  s.lineTo(0, -2.6)
  s.closePath()
  return s
}

export function SuiteRipada({ room }: { room: RoomLayout }) {
  const m = useMats()
  const { x0, z0 } = room.rect
  const E = 3.34 // face da parede leste
  const Z = 1.75 // eixo da cama
  return (
    <RoomGroup x0={x0} z0={z0}>
      {/* cabeceira ripada (parede leste) */}
      <C s={[0.02, 1.3, 2.9]} p={[E - 0.01, 0.65, Z]} m={m.laca} cast={false} />
      <Slats count={41} from={[E - 0.035, 0.02, Z - 1.35]} step={[0, 0, 0.0675]} size={[0.03, 1.22, 0.032]} m={m.freijo} />
      <B s={[0.06, 0.05, 2.96]} r={0.01} p={[E - 0.03, 1.27, Z]} m={m.freijo} />
      <B s={[0.06, 1.32, 0.05]} r={0.01} p={[E - 0.03, 0, Z - 1.47]} m={m.freijo} />
      <B s={[0.06, 1.32, 0.05]} r={0.01} p={[E - 0.03, 0, Z + 1.47]} m={m.freijo} />
      <Bed p={[E - 0.07, 0, Z]} rotY={-Math.PI / 2} w={1.6} quilt={m.taupe} />
      <Nightstand p={[E - 0.27, 0, Z - 1.13]} rotY={-Math.PI / 2} />
      <Nightstand p={[E - 0.27, 0, Z + 1.13]} rotY={-Math.PI / 2} />
      <StrawPendant p={[E - 0.3, 1.45, Z - 1.13]} s={1.5} squash={0.45} />
      <StrawPendant p={[E - 0.3, 1.45, Z + 1.13]} s={1.5} squash={0.45} />

      {/* parede oeste: lambri ripado branco emoldurado em freijó */}
      <Slats count={44} from={[0.08, 0, 0.42]} step={[0, 0, 0.065]} size={[0.025, 0.95, 0.035]} m={m.laca} r={0.006} />
      <B s={[0.05, 0.05, 2.9]} r={0.02} p={[0.085, 0.95, 1.8]} m={m.freijo} />
      <B s={[0.05, 1.0, 0.05]} r={0.02} p={[0.085, 0, 0.35]} m={m.freijo} />
      {/* escrivaninha curva com gaveteiro, frigobar, cadeira, TV e prateleira */}
      <Extruded id="desk-curva" shape={deskShape} depth={0.05} bevel={0.008} p={[0.06, 0.72, 0]} rot={[-Math.PI / 2, 0, 0]} m={m.freijo} />
      <B s={[0.5, 0.17, 1.5]} r={0.01} p={[0.31, 0.55, 1.25]} m={m.freijo} />
      <B s={[0.48, 0.85, 0.5]} r={0.02} p={[0.31, 0, 2.95]} m={m.laca} />
      <Chair p={[0.85, 0, 1.6]} rotY={-Math.PI / 2} upholstery={m.estofado} />
      <Tv p={[0.08, 1.6, 1.6]} rotY={Math.PI / 2} w={1.0} />
      <B s={[0.26, 0.025, 1.7]} r={0.012} p={[0.19, 2.08, 1.7]} m={m.laca} />

      <Curtain w={2.4} h={2.62} p={[1.7, 0, 0.14]} m={m.voile} />
    </RoomGroup>
  )
}
