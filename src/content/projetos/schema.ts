import { z } from 'zod'

export const roomIds = [
  'cozinha',
  'living',
  'lavabo',
  'suite-casal',
  'quarto-solteiro',
  'suite-ripada',
  'quarto-escrivaninha',
  'quarto-espelho',
] as const

export const roomIdSchema = z.enum(roomIds)

export const photoSchema = z.object({
  id: z.string(),
  src: z.string(),
  width: z.number(),
  height: z.number(),
  blurDataURL: z.string(),
})

export const roomSchema = z.object({
  id: roomIdSchema,
  nome: z.string().min(1),
  descricao: z.string().min(1),
  fotos: z.array(z.string()).min(1),
  capa: z.string(),
})

export const projetoSchema = z.object({
  slug: z.string().min(1),
  nome: z.string().min(1),
  local: z.string(),
  metragem: z.number().nullable(),
  ano: z.number().nullable(),
  conceito: z.string(),
  capa: z.string(),
  rooms: z.array(roomSchema).min(1),
  ficha: z.array(z.object({ rotulo: z.string(), valor: z.string() })),
  placeholder: z.boolean(),
})

export type RoomId = z.infer<typeof roomIdSchema>
export type Room = z.infer<typeof roomSchema>
export type Projeto = z.infer<typeof projetoSchema>
export type Photo = z.infer<typeof photoSchema>
