import { footprint, type Apartment, type Box, type Rect, type Side } from './layout'

/**
 * Equipamentos das áreas que não são cômodos do projeto (banheiros das suítes, serviço,
 * despensa, closet). São só caixas alinhadas aos eixos, agrupadas por material, para que a
 * maquete inteira desenhe todos com um InstancedMesh por material (poucos draw calls).
 * Puro: sem three.js, testável.
 */

export type FixtureMaterial = 'laca' | 'lacaCinza' | 'quartzo' | 'espelho' | 'vidro' | 'ceramica'
type Group = Partial<Record<FixtureMaterial, Box[]>>

/** Retângulo útil (descontada a meia parede interna) e caixas encostadas nas suas faces. */
function room(rect: Rect, f: Rect, half: number) {
  const ix0 = rect.x0 + (Math.abs(rect.x0 - f.x0) < 1e-4 ? 0 : half)
  const ix1 = rect.x1 - (Math.abs(rect.x1 - f.x1) < 1e-4 ? 0 : half)
  const iz0 = rect.z0 + (Math.abs(rect.z0 - f.z0) < 1e-4 ? 0 : half)
  const iz1 = rect.z1 - (Math.abs(rect.z1 - f.z1) < 1e-4 ? 0 : half)
  const iw = ix1 - ix0
  const id = iz1 - iz0
  const g: Group = {}
  const put = (mat: FixtureMaterial, x0: number, z0: number, x1: number, z1: number, y0: number, y1: number) => {
    ;(g[mat] ??= []).push({
      center: [ix0 + (x0 + x1) / 2, (y0 + y1) / 2, iz0 + (z0 + z1) / 2],
      size: [x1 - x0, y1 - y0, z1 - z0],
    })
  }
  /** caixa encostada na face `side`: [a0, a1] ao longo da parede, [d0, d1] a partir da face */
  const onWall = (mat: FixtureMaterial, side: Side, a0: number, a1: number, d0: number, d1: number, y0: number, y1: number) => {
    if (side === 'n') put(mat, a0, d0, a1, d1, y0, y1)
    else if (side === 's') put(mat, a0, id - d1, a1, id - d0, y0, y1)
    else if (side === 'w') put(mat, d0, a0, d1, a1, y0, y1)
    else put(mat, iw - d1, a0, iw - d0, a1, y0, y1)
  }
  return { g, iw, id, put, onWall }
}

type BathSpec = {
  /** parede do box (faixa de 0,85 m) e trecho do vidro fixo ao longo dela */
  shower: Side
  glass: [number, number]
  /** bancada suspensa: parede e trecho */
  vanity: Side
  vanityAt: [number, number]
  /** bacia: parede e posição do eixo ao longo dela */
  toilet: Side
  toiletAt: number
}

const BATHS: Record<string, BathSpec> = {
  'banho-ripada': { shower: 's', glass: [0.6, 1.68], vanity: 'w', vanityAt: [0.1, 0.9], toilet: 'e', toiletAt: 0.8 },
  'banho-casal': { shower: 's', glass: [0.7, 1.94], vanity: 'n', vanityAt: [0.45, 1.85], toilet: 'e', toiletAt: 1.3 },
  'banho-solteiro': { shower: 'n', glass: [0, 0.9], vanity: 'w', vanityAt: [0.88, 1.52], toilet: 's', toiletAt: 0.35 },
  'banho-espelho': { shower: 'n', glass: [0, 0.9], vanity: 'w', vanityAt: [0.95, 1.75], toilet: 's', toiletAt: 0.35 },
  'banho-servico': { shower: 'e', glass: [0, 1.0], vanity: 'n', vanityAt: [0.3, 0.9], toilet: 's', toiletAt: 0.6 },
}

export function areaFixtures(a: Apartment) {
  const f = footprint(a)
  const half = a.wallThickness / 2
  const byArea: Record<string, Group> = {}

  for (const area of a.areas) {
    const r = room(area.rect, f, half)
    const bath = BATHS[area.name]
    if (bath) {
      // vidro fixo do box (2,0 m de altura), bancada branca suspensa com tampo e espelho, bacia suspensa
      r.onWall('vidro', bath.shower, bath.glass[0], bath.glass[1], 0.85, 0.86, 0, 2.0)
      const [v0, v1] = bath.vanityAt
      r.onWall('laca', bath.vanity, v0, v1, 0, 0.48, 0.4, 0.84)
      r.onWall('quartzo', bath.vanity, v0 - 0.01, v1 + 0.01, 0, 0.5, 0.84, 0.87)
      r.onWall('espelho', bath.vanity, v0 + 0.05, v1 - 0.05, 0, 0.01, 1.1, 1.9)
      r.onWall('ceramica', bath.toilet, bath.toiletAt - 0.185, bath.toiletAt + 0.185, 0, 0.56, 0.06, 0.42)
    } else if (area.name === 'servico') {
      // lavanderia na parede oeste: gabinete com tanque, lava e seca, armário alto
      r.onWall('laca', 'w', 1.1, 2.3, 0, 0.6, 0, 0.86)
      r.onWall('lacaCinza', 'w', 2.3, 2.9, 0, 0.6, 0.02, 0.86)
      r.onWall('quartzo', 'w', 1.1, 2.9, 0, 0.62, 0.86, 0.9)
      r.onWall('laca', 'w', 1.1, 2.9, 0, 0.35, 1.6, 2.3)
    } else if (area.name === 'despensa') {
      r.onWall('laca', 'e', 0.05, r.id - 0.05, 0, 0.42, 0, 2.3)
      r.onWall('laca', 'n', 0.45, r.iw - 0.42, 0, 0.42, 0, 2.3)
    } else if (area.name === 'closet-casal') {
      // marcenaria em U, livrando as portas (norte, leste e oeste)
      r.onWall('laca', 's', 0.85, r.iw, 0, 0.55, 0, 2.4)
      r.onWall('laca', 'e', 1.35, r.id - 0.55, 0, 0.55, 0, 2.4)
      r.onWall('laca', 'n', 1.0, r.iw, 0, 0.55, 0, 2.4)
    }
    if (Object.keys(r.g).length) byArea[area.name] = r.g
  }

  const byMaterial: Group = {}
  for (const g of Object.values(byArea)) {
    for (const [mat, boxes] of Object.entries(g) as Array<[FixtureMaterial, Box[]]>) (byMaterial[mat] ??= []).push(...boxes)
  }
  return { byArea, byMaterial }
}
