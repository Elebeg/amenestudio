'use client'

import { createContext, useContext } from 'react'
import { getMaterials, type Materials } from './materials'

/**
 * Materiais vistos pelos cômodos: os compartilhados (singleton) mais os mutáveis da instância
 * (luz, palha, voile), que ApartmentModel cria por maquete e fornece por este contexto.
 */
export const ApartmentMaterialsContext = createContext<Materials | null>(null)

export function useMats(): Materials {
  return useContext(ApartmentMaterialsContext) ?? getMaterials()
}
