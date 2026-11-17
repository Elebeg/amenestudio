import type { ComponentType } from 'react'
import type { RoomId } from '@/content/projetos'
import type { RoomLayout } from '../layout'
import { Cozinha } from './Cozinha'
import { Living } from './Living'
import { Lavabo } from './Lavabo'
import { SuiteCasal } from './SuiteCasal'
import { QuartoSolteiro } from './QuartoSolteiro'
import { SuiteRipada } from './SuiteRipada'
import { QuartoEscrivaninha } from './QuartoEscrivaninha'
import { QuartoEspelho } from './QuartoEspelho'

export const ROOM_COMPONENTS: Record<RoomId, ComponentType<{ room: RoomLayout }>> = {
  cozinha: Cozinha,
  living: Living,
  lavabo: Lavabo,
  'suite-casal': SuiteCasal,
  'quarto-solteiro': QuartoSolteiro,
  'suite-ripada': SuiteRipada,
  'quarto-escrivaninha': QuartoEscrivaninha,
  'quarto-espelho': QuartoEspelho,
}
