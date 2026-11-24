'use client'

import { useMats } from '../materialsContext'
import { B, C, Cyl, Extruded, Lathe, Plant, RoomGroup, smoothShape } from '../parts'
import { OrganicMirror, StrawPendant } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Lavabo (IMG_4783): parede de seixos, bancada orgânica de pedra com cuba-bacia,
 * espelho orgânico de moldura larga e pendentes de palha.
 * Local: x 0→1,6, z 0→1,8. A porta fica na parede oeste (para o hall), então o conjunto
 * é desenhado com a bancada "na parede oeste" e espelhado em x: bancada na parede leste.
 */

// bancada em planta: x = distância da parede, y = −z (ver rotação abaixo)
const COUNTER: Array<[number, number]> = [
  [0, -0.18],
  [0.36, -0.22],
  [0.5, -0.55],
  [0.4, -0.92],
  [0.5, -1.28],
  [0.3, -1.5],
  [0, -1.52],
  [-0.02, -0.85],
]

export function Lavabo({ room }: { room: RoomLayout }) {
  const m = useMats()
  const { x0, z0, x1 } = room.rect
  const Wf = 0.06 // face da parede (no referencial espelhado)

  return (
    <RoomGroup x0={x0} z0={z0}>
      <group position={[x1 - x0, 0, 0]} scale={[-1, 1, 1]}>
      <C s={[0.03, 2.7, 1.68]} p={[Wf + 0.015, 1.35, 0.9]} m={m.seixos} cast={false} />
      <Extruded id="lavabo-counter" shape={() => smoothShape(COUNTER)} depth={0.1} bevel={0.015} p={[Wf + 0.03, 0.8, 0]} rot={[-Math.PI / 2, 0, 0]} m={m.pedraBege} />
      <Lathe
        id="bowl"
        profile={[
          [0.001, 0],
          [0.09, 0.005],
          [0.17, 0.05],
          [0.2, 0.14],
          [0.19, 0.15],
          [0.165, 0.07],
          [0.08, 0.035],
          [0.001, 0.03],
        ]}
        p={[0.33, 0.93, 0.82]}
        m={m.cubaTaupe}
      />
      <Cyl r={0.012} h={0.36} seg={12} p={[0.13, 0.93, 0.82]} m={m.latao} />
      <C s={[0.18, 0.022, 0.022]} p={[0.2, 1.28, 0.82]} m={m.latao} />
      <OrganicMirror kind="gota" p={[Wf + 0.04, 1.62, 0.84]} rotY={Math.PI / 2} s={0.82} />
      <StrawPendant p={[0.55, 1.55, 1.3]} />
      <StrawPendant p={[0.42, 1.25, 1.48]} s={0.85} />
      <StrawPendant p={[0.62, 1.05, 1.52]} s={0.7} />
      <Plant p={[0.3, 0, 0.6]} s={0.62} pot={m.pedraBege} leaf={m.folha} />
      {/* bacia sanitária suspensa */}
      <B s={[0.37, 0.36, 0.56]} r={0.14} p={[1.02, 0.06, 1.45]} m={m.ceramica} />
      </group>
    </RoomGroup>
  )
}
