'use client'

import { getMaterials } from '../materials'
import { B, C, Curtain, RoomGroup, Slats } from '../parts'
import { Bed, Nightstand, StrawPendant, Wardrobe } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Suíte com cabeceira ripada (IMG_4924): painel de ripas de freijó emoldurado,
 * pendentes de palha dos dois lados, criados de madeira e guarda-roupa na parede oposta.
 * Local: x 0→3,4, z 0→3,6.
 */
export function SuiteRipada({ room }: { room: RoomLayout }) {
  const m = getMaterials()
  const { x0, z0 } = room.rect
  const E = 3.34
  return (
    <RoomGroup x0={x0} z0={z0}>
      <C s={[0.02, 1.3, 2.9]} p={[E - 0.01, 0.65, 1.95]} m={m.laca} cast={false} />
      <Slats count={41} from={[E - 0.035, 0.02, 0.6]} step={[0, 0, 0.0675]} size={[0.03, 1.22, 0.032]} m={m.freijo} />
      <B s={[0.06, 0.05, 2.96]} r={0.01} p={[E - 0.03, 1.27, 1.95]} m={m.freijo} />
      <B s={[0.06, 1.32, 0.05]} r={0.01} p={[E - 0.03, 0, 0.48]} m={m.freijo} />
      <B s={[0.06, 1.32, 0.05]} r={0.01} p={[E - 0.03, 0, 3.42]} m={m.freijo} />
      <Bed p={[E - 0.07, 0, 1.95]} rotY={-Math.PI / 2} w={1.6} quilt={m.taupe} />
      <Nightstand p={[E - 0.27, 0, 0.82]} rotY={-Math.PI / 2} />
      <Nightstand p={[E - 0.27, 0, 3.08]} rotY={-Math.PI / 2} />
      <StrawPendant p={[E - 0.3, 1.45, 0.82]} s={1.5} squash={0.45} />
      <StrawPendant p={[E - 0.3, 1.45, 3.08]} s={1.5} squash={0.45} />
      <Wardrobe p={[0.36, 0, 2.05]} rotY={Math.PI / 2} w={2.5} />
      <Curtain w={2.6} h={2.62} p={[1.9, 0, 3.46]} m={m.voile} />
    </RoomGroup>
  )
}
