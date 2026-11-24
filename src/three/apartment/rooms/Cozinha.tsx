'use client'

import { useMats } from '../materialsContext'
import { B, C, Curtain, Cyl, Plant, RoomGroup, Slats } from '../parts'
import { Chair, DiscPendant, Vase } from '../furniture'
import type { RoomLayout } from '../layout'

/**
 * Jantar e cozinha (IMG_4592, 4598, 4607, 4643, 4646, 5050), num retângulo fundo.
 * Local: x 0→5,0 (oeste→leste), z 0→7,0 (norte→sul).
 * Norte: porta de vidro para a varanda, com a mesa de mármore verde junto dela.
 * Leste (z 0→3,5): pedra natural de dupla face, com a churrasqueira na ponta sul;
 * do outro lado da mesma parede fica a TV do living. Depois dela, o vão para o living.
 * Centro: ilha com cooktop, adegas voltadas para a mesa e banquetas.
 * Sul: bancada com cuba, torre quente e refrigerador; porta para a área de serviço no canto.
 */
export function Cozinha({ room }: { room: RoomLayout }) {
  const m = useMats()
  const { x0, z0 } = room.rect
  const E = 4.94 // face da parede leste (pedra)
  const S = 6.94 // face da parede sul
  const STONE = 3.5 // comprimento da pedra a partir da fachada (até o vão)

  return (
    <RoomGroup x0={x0} z0={z0}>
      {/* pedra natural com churrasqueira embutida (frente voltada para oeste) */}
      <C s={[0.04, 2.7, STONE]} p={[E - 0.02, 1.35, STONE / 2]} m={m.pedra} cast={false} />
      <group position={[E - 0.04, 0, 2.65]} rotation={[0, Math.PI / 2, 0]}>
        <B s={[1.4, 0.86, 0.6]} r={0.01} p={[0, 0, -0.3]} m={m.laca} />
        <B s={[1.44, 0.04, 0.64]} r={0.008} p={[0, 0.86, -0.32]} m={m.quartzo} />
        <C s={[0.84, 0.5, 0.05]} r={0.006} p={[0, 1.2, -0.025]} m={m.inox} />
        <C s={[0.74, 0.4, 0.02]} p={[0, 1.2, -0.055]} m={m.lacaCinza} cast={false} />
        <Slats count={6} from={[0, 1.03, -0.07]} step={[0, 0.06, 0]} size={[0.72, 0.008, 0.01]} m={m.inox} cast={false} />
      </group>

      {/* jantar: mesa oval de mármore verde entre a varanda e a pedra */}
      <Cyl r={0.5} h={0.04} seg={64} p={[2.6, 0.74, 1.6]} scale={[1.85, 1, 1]} m={m.marmoreVerde} />
      <Cyl r={0.13} r2={0.16} h={0.74} p={[2.1, 0, 1.6]} m={m.pedraBege} />
      <Cyl r={0.13} r2={0.16} h={0.74} p={[3.1, 0, 1.6]} m={m.pedraBege} />
      {[2.1, 3.1].map((x) => (
        <group key={x}>
          <Chair p={[x, 0, 0.95]} />
          <Chair p={[x, 0, 2.25]} rotY={Math.PI} />
        </group>
      ))}
      <DiscPendant p={[2.2, 1.8, 1.6]} />
      <DiscPendant p={[3.0, 1.8, 1.6]} />
      <Curtain w={4.5} h={2.62} p={[2.5, 0, 0.14]} m={m.voile} />
      <Plant p={[0.45, 0, 0.5]} s={1.1} pot={m.ceramica} leaf={m.folha} />

      {/* ilha branca: adegas voltadas para a mesa, banquetas de couro, cooktop e coifa */}
      <B s={[3.2, 0.88, 0.95]} r={0.01} p={[2.4, 0, 4.6]} m={m.laca} />
      <B s={[3.28, 0.04, 1.04]} r={0.01} p={[2.4, 0.88, 4.6]} m={m.quartzo} />
      <C s={[1.22, 0.82, 0.02]} p={[1.5, 0.44, 4.115]} m={m.inox} />
      <C s={[0.56, 0.74, 0.01]} p={[1.2, 0.45, 4.102]} m={m.vidroEscuro} cast={false} />
      <C s={[0.56, 0.74, 0.01]} p={[1.8, 0.45, 4.102]} m={m.vidroEscuro} cast={false} />
      <Slats count={6} from={[1.5, 0.14, 4.094]} step={[0, 0.12, 0]} size={[1.1, 0.012, 0.004]} m={m.freijo} cast={false} />
      {[2.65, 3.3, 3.95].map((x) => (
        <Chair key={x} p={[x, 0, 3.75]} seat={0.64} />
      ))}
      <C s={[0.76, 0.008, 0.5]} p={[3.3, 0.904, 4.7]} m={m.vidroEscuro} cast={false} />
      <B s={[0.9, 0.1, 0.52]} r={0.01} p={[3.3, 1.62, 4.7]} m={m.inox} />
      <B s={[0.3, 0.98, 0.26]} p={[3.3, 1.72, 4.7]} m={m.inox} />
      <Vase p={[1.0, 0.92, 4.75]} s={1.1} m={m.vasoTerracota} />
      <Vase p={[1.18, 0.92, 4.85]} s={0.7} />

      {/* bancada sul: cuba, armários superiores; torre quente e refrigerador no canto leste */}
      <B s={[2.5, 0.86, 0.6]} r={0.008} p={[2.25, 0, S - 0.3]} m={m.laca} />
      <B s={[2.54, 0.04, 0.64]} r={0.008} p={[2.25, 0.86, S - 0.32]} m={m.quartzo} />
      <C s={[2.5, 0.6, 0.02]} p={[2.25, 1.2, S - 0.01]} m={m.quartzo} cast={false} />
      <C s={[0.78, 0.01, 0.42]} p={[1.9, 0.898, S - 0.32]} m={m.inox} cast={false} />
      <Cyl r={0.014} h={0.34} seg={12} p={[1.9, 0.9, S - 0.1]} m={m.inox} />
      <B s={[2.5, 0.42, 0.34]} r={0.006} p={[2.25, 1.56, S - 0.17]} m={m.freijo} />
      <B s={[2.5, 0.68, 0.36]} r={0.006} p={[2.25, 1.99, S - 0.18]} m={m.lacaCinza} />
      <B s={[0.62, 2.62, 0.62]} r={0.006} p={[3.81, 0, S - 0.31]} m={m.lacaCinza} />
      <C s={[0.5, 0.46, 0.02]} p={[3.81, 1.12, S - 0.625]} m={m.vidroEscuro} cast={false} />
      <C s={[0.5, 0.36, 0.02]} p={[3.81, 1.6, S - 0.625]} m={m.vidroEscuro} cast={false} />
      <B s={[0.8, 1.92, 0.7]} r={0.02} p={[4.53, 0, S - 0.36]} m={m.inox} />
      <Vase p={[1.3, 0.9, S - 0.4]} s={0.8} m={m.vasoTerracota} />
    </RoomGroup>
  )
}
