import { renderOg, OG_SIZE } from '@/lib/og'

export const alt = 'Amene, arquitetura e interiores'
export const size = OG_SIZE
export const contentType = 'image/png'

export default function Image() {
  return renderOg('/projetos/apartamento-pedra/IMG_4736.webp', 'Arquitetura e interiores')
}
