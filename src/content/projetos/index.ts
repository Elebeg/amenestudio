import photosData from './apartamento-pedra/photos.generated.json'
import { apartamentoPedra } from './apartamento-pedra/projeto'
import { projetoSchema, photoSchema, type Photo, type Projeto } from './schema'

const projetos: Projeto[] = [projetoSchema.parse(apartamentoPedra)]
const photos: Photo[] = photoSchema.array().parse(photosData)
const photoById = new Map(photos.map((p) => [p.id, p]))

export function getProjects(): Projeto[] {
  return projetos
}

export function getProject(slug: string): Projeto | undefined {
  return projetos.find((p) => p.slug === slug)
}

export function getPhoto(id: string): Photo {
  const photo = photoById.get(id)
  if (!photo) throw new Error(`Foto não encontrada: ${id}`)
  return photo
}

export type { Photo, Projeto, Room, RoomId } from './schema'
