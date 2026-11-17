import type { Photo } from '@/content/projetos'

export type Variant =
  | 'wide' // paisagem sozinha, largura total
  | 'solo' // retrato sozinho, deslocado
  | 'pair-portrait' // dois retratos escalonados
  | 'pair-landscape' // duas paisagens 7/5 escalonadas
  | 'mixed' // retrato + paisagem lado a lado

export type Row = { variant: Variant; flip: boolean; photos: Photo[] }

const isPortrait = (p: Photo) => p.height > p.width

/** Distribui as fotos do cômodo em composições editoriais alternadas. */
export function compose(photos: Photo[]): Row[] {
  const rows: Row[] = []
  let i = 0
  while (i < photos.length) {
    const a = photos[i]
    const b = photos[i + 1]
    const flip = rows.length % 2 === 1
    if (b && isPortrait(a) && isPortrait(b)) {
      rows.push({ variant: 'pair-portrait', flip, photos: [a, b] })
      i += 2
    } else if (b && isPortrait(a) !== isPortrait(b)) {
      // sempre retrato primeiro, paisagem depois (flip inverte a ordem visual)
      rows.push({ variant: 'mixed', flip, photos: isPortrait(a) ? [a, b] : [b, a] })
      i += 2
    } else if (b && !isPortrait(a) && !isPortrait(b)) {
      rows.push({ variant: 'pair-landscape', flip, photos: [a, b] })
      i += 2
    } else if (isPortrait(a)) {
      rows.push({ variant: 'solo', flip, photos: [a] })
      i += 1
    } else {
      rows.push({ variant: 'wide', flip, photos: [a] })
      i += 1
    }
  }
  return rows
}
