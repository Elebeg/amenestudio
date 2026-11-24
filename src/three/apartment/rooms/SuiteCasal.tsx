'use client'

import { useMats } from '../materialsContext'
import { B, C, Curtain, Lattice, RoomGroup } from '../parts'
import { Bed, Nightstand, Tv, Vase, Wardrobe } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Suíte casal (IMG_4796, 4810, 4823): cabeceira em treliça de freijó, roupa de cama sálvia,
 * criados suspensos, guarda-roupa branco, cômoda de freijó sob a TV e espelho alto.
 * Local: x 0→4,0, z 0→4,2. Canto nordeste: janelas ao norte e a leste.
 * Cabeceira na parede oeste, pés para leste; entra-se pelo closet (porta no canto sudoeste).
 */
export function SuiteCasal({ room }: { room: RoomLayout }) {
  const m = useMats()
  const { x0, z0 } = room.rect
  const W = 0.06 // face da parede oeste
  const E = 4.0 // face da parede leste (externa)
  const S = 4.14 // face da parede sul
  const Z = 2.0 // eixo da cama
  return (
    <RoomGroup x0={x0} z0={z0}>
      <Lattice w={2.7} h={1.3} cell={0.17} bar={0.026} depth={0.03} m={m.freijo} p={[W + 0.02, 0, Z]} rotY={Math.PI / 2} />
      <Bed p={[W + 0.05, 0, Z]} rotY={Math.PI / 2} w={1.6} quilt={m.salvia} />
      <Nightstand p={[W + 0.25, 0, Z - 1.13]} rotY={Math.PI / 2} />
      <Nightstand p={[W + 0.25, 0, Z + 1.13]} rotY={Math.PI / 2} />
      <Vase p={[W + 0.25, 0.62, Z + 1.13]} s={0.7} />
      {/* guarda-roupa na parede sul, depois da porta */}
      <Wardrobe p={[2.6, 0, S - 0.3]} rotY={Math.PI} w={2.5} />
      {/* parede leste: cômoda de freijó sob a TV; espelho alto junto à janela norte */}
      <B s={[0.46, 0.5, 1.5]} r={0.01} p={[E - 0.24, 0.12, 1.55]} m={m.freijo} />
      <Tv p={[E - 0.03, 1.55, 1.55]} rotY={-Math.PI / 2} w={1.2} />
      <Vase p={[E - 0.25, 0.62, 1.0]} s={0.9} m={m.vasoTerracota} />
      <C s={[0.52, 1.7, 0.03]} r={0.008} p={[3.6, 1.2, 0.02]} m={m.freijo} />
      <C s={[0.44, 1.6, 0.01]} p={[3.6, 1.2, 0.04]} m={m.espelho} cast={false} />
      <Curtain w={2.9} h={2.62} p={[2.0, 0, 0.14]} m={m.voile} />
    </RoomGroup>
  )
}
