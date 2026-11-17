'use client'

import { useMats } from '../materialsContext'
import { B, C, Curtain, Cyl, Plant, RoomGroup, Slats } from '../parts'
import { Chair, DiscPendant, Vase } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Cozinha e jantar (IMG_4592, 4598, 4607, 4643, 4646, 5050).
 * Local: x 0→7,4 (oeste→leste), z 0→5,6 (norte→sul). Parede sul = pedra contínua com o living.
 */
export function Cozinha({ room }: { room: RoomLayout }) {
  const m = useMats()
  const { x0, z0, x1 } = room.rect
  const W = x1 - x0
  const S = 5.54 // face da parede sul (meia espessura da divisa com o corredor)

  return (
    <RoomGroup x0={x0} z0={z0}>
      {/* parede de pedra natural com churrasqueira embutida */}
      <C s={[W, 2.7, 0.04]} p={[W / 2, 1.35, S - 0.02]} m={m.pedra} cast={false} />
      <B s={[1.7, 0.86, 0.6]} r={0.01} p={[4.45, 0, S - 0.32]} m={m.laca} />
      <B s={[1.74, 0.04, 0.64]} r={0.008} p={[4.45, 0.86, S - 0.32]} m={m.quartzo} />
      <C s={[0.84, 0.5, 0.05]} r={0.006} p={[4.45, 1.2, S - 0.065]} m={m.inox} />
      <C s={[0.74, 0.4, 0.02]} p={[4.45, 1.2, S - 0.095]} m={m.lacaCinza} cast={false} />
      <Slats count={6} from={[4.45, 1.03, S - 0.11]} step={[0, 0.06, 0]} size={[0.72, 0.008, 0.01]} m={m.inox} cast={false} />

      {/* bancada norte: armários, cuba, cooktop, coifa, armários superiores */}
      <B s={[5.0, 0.86, 0.6]} r={0.008} p={[3.0, 0, 0.3]} m={m.laca} />
      <B s={[5.04, 0.04, 0.64]} r={0.008} p={[3.0, 0.86, 0.32]} m={m.quartzo} />
      <C s={[5.0, 0.6, 0.02]} p={[3.0, 1.2, 0.01]} m={m.quartzo} cast={false} />
      <C s={[0.78, 0.01, 0.42]} p={[1.6, 0.898, 0.32]} m={m.inox} cast={false} />
      <Cyl r={0.014} h={0.34} seg={12} p={[1.6, 0.9, 0.1]} m={m.inox} />
      <C s={[0.025, 0.025, 0.2]} p={[1.6, 1.22, 0.19]} m={m.inox} />
      <C s={[0.76, 0.008, 0.5]} p={[3.9, 0.904, 0.32]} m={m.vidroEscuro} cast={false} />
      <B s={[0.9, 0.1, 0.52]} r={0.01} p={[3.9, 1.58, 0.26]} m={m.inox} />
      <B s={[0.3, 1.02, 0.26]} p={[3.9, 1.68, 0.13]} m={m.inox} />
      <B s={[2.9, 0.42, 0.34]} r={0.006} p={[1.95, 1.56, 0.17]} m={m.freijo} />
      <B s={[1.1, 0.42, 0.34]} r={0.006} p={[4.95, 1.56, 0.17]} m={m.freijo} />
      <B s={[2.9, 0.68, 0.36]} r={0.006} p={[1.95, 1.99, 0.18]} m={m.lacaCinza} />
      <B s={[1.1, 0.68, 0.36]} r={0.006} p={[4.95, 1.99, 0.18]} m={m.lacaCinza} />
      <Vase p={[0.9, 0.9, 0.4]} s={0.8} m={m.vasoTerracota} />

      {/* torre quente e refrigerador inox */}
      <B s={[0.8, 2.62, 0.62]} r={0.006} p={[5.9, 0, 0.31]} m={m.lacaCinza} />
      <C s={[0.6, 0.46, 0.02]} p={[5.9, 1.12, 0.625]} m={m.vidroEscuro} cast={false} />
      <C s={[0.6, 0.36, 0.02]} p={[5.9, 1.6, 0.625]} m={m.vidroEscuro} cast={false} />
      <B s={[0.82, 1.92, 0.7]} r={0.02} p={[6.82, 0, 0.36]} m={m.inox} />

      {/* ilha branca com adegas e banquetas de couro */}
      <B s={[4.0, 0.88, 0.95]} r={0.01} p={[3.3, 0, 2.05]} m={m.laca} />
      <B s={[4.08, 0.04, 1.04]} r={0.01} p={[3.3, 0.88, 2.05]} m={m.quartzo} />
      <C s={[1.22, 0.82, 0.02]} p={[2.0, 0.44, 2.535]} m={m.inox} />
      <C s={[0.56, 0.74, 0.01]} p={[1.7, 0.45, 2.548]} m={m.vidroEscuro} cast={false} />
      <C s={[0.56, 0.74, 0.01]} p={[2.3, 0.45, 2.548]} m={m.vidroEscuro} cast={false} />
      <Slats count={6} from={[2.0, 0.14, 2.556]} step={[0, 0.12, 0]} size={[1.1, 0.012, 0.004]} m={m.freijo} cast={false} />
      {[3.25, 3.95, 4.65].map((x) => (
        <Chair key={x} p={[x, 0, 2.9]} rotY={Math.PI} seat={0.64} />
      ))}
      <Vase p={[3.6, 0.92, 1.85]} s={1.1} m={m.vasoTerracota} />
      <Vase p={[3.78, 0.92, 1.95]} s={0.7} />

      {/* jantar: mesa oval de mármore verde junto à janela */}
      <Cyl r={0.5} h={0.04} seg={64} p={[1.55, 0.74, 4.15]} scale={[1.85, 1, 1]} m={m.marmoreVerde} />
      <Cyl r={0.13} r2={0.16} h={0.74} p={[1.05, 0, 4.15]} m={m.pedraBege} />
      <Cyl r={0.13} r2={0.16} h={0.74} p={[2.05, 0, 4.15]} m={m.pedraBege} />
      {[1.05, 2.05].map((x) => (
        <group key={x}>
          <Chair p={[x, 0, 3.5]} />
          <Chair p={[x, 0, 4.8]} rotY={Math.PI} />
        </group>
      ))}
      <DiscPendant p={[1.15, 1.8, 4.15]} />
      <DiscPendant p={[1.95, 1.8, 4.15]} />
      <Curtain w={3.1} h={2.62} p={[0.14, 0, 3.5]} rotY={Math.PI / 2} m={m.voile} />
      <Plant p={[6.8, 0, 5.05]} s={1.1} pot={m.ceramica} leaf={m.folha} />
    </RoomGroup>
  )
}
