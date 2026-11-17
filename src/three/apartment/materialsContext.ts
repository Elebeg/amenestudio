'use client'

import { createContext, useContext } from 'react'
import type { Materials } from './materials'

/**
 * Materiais vistos pelos cômodos: os compartilhados (singleton) mais os mutáveis da instância
 * (luz, palha, voile), que ApartmentModel cria por maquete e fornece por este contexto.
 * Não há fallback para o singleton global: fora de uma <ApartmentModel> os materiais mutáveis
 * seriam compartilhados entre Canvases, então o uso fora do contexto é um erro.
 */
export const ApartmentMaterialsContext = createContext<Materials | null>(null)

export const USE_MATS_ERROR = 'useMats deve ser usado dentro de <ApartmentModel>'

export function requireMats(value: Materials | null): Materials {
  if (!value) throw new Error(USE_MATS_ERROR)
  return value
}

export function useMats(): Materials {
  return requireMats(useContext(ApartmentMaterialsContext))
}
