import * as THREE from 'three'
import type { Side } from './layout'

/**
 * Materiais PBR da maquete. Criados uma única vez (singleton) e compartilhados
 * por todos os cômodos. As geometrias recebem UV em METROS (ver `metricUV` em
 * parts.tsx), então o `repeat` de cada textura é 1 / tamanho do ladrilho em metros.
 */

export type Lighting = 'manha' | 'noite'

// ── texturas procedurais (sem DOM: DataTexture) ─────────────────────────────

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function dataTexture(size: number, fill: (x: number, y: number) => [number, number, number], srgb: boolean) {
  const data = new Uint8Array(size * size * 4)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = fill(x, y)
      const i = (y * size + x) * 4
      data[i] = r
      data[i + 1] = g
      data[i + 2] = b
      data[i + 3] = 255
    }
  }
  const t = new THREE.DataTexture(data, size, size)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.magFilter = THREE.LinearFilter
  t.minFilter = THREE.LinearMipmapLinearFilter
  t.generateMipmaps = true
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  t.needsUpdate = true
  return t
}

/** Ruído de valor com repetição perfeita (tileable). */
function valueNoise(size: number, cells: number, seed: number) {
  const rand = rng(seed)
  const grid = Array.from({ length: cells * cells }, () => rand())
  const at = (i: number, j: number) => grid[((j + cells) % cells) * cells + ((i + cells) % cells)]
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (x: number, y: number) => {
    const fx = (x / size) * cells
    const fy = (y / size) * cells
    const i = Math.floor(fx)
    const j = Math.floor(fy)
    const u = smooth(fx - i)
    const v = smooth(fy - j)
    const a = at(i, j) + (at(i + 1, j) - at(i, j)) * u
    const b = at(i, j + 1) + (at(i + 1, j + 1) - at(i, j + 1)) * u
    return a + (b - a) * v
  }
}

/** Tecido: bouclê / linho — grão fino com laços. */
function fabricBump(seed: number) {
  const n1 = valueNoise(128, 64, seed)
  const n2 = valueNoise(128, 16, seed + 7)
  return dataTexture(
    128,
    (x, y) => {
      const v = Math.round((n1(x, y) * 0.7 + n2(x, y) * 0.3) * 255)
      return [v, v, v]
    },
    false,
  )
}

/** Mármore com veios finos (cor), tileable. */
function marbleMap(base: [number, number, number], vein: [number, number, number], seed: number) {
  const size = 256
  const n = valueNoise(size, 4, seed)
  const m = valueNoise(size, 16, seed + 3)
  const f = valueNoise(size, 64, seed + 5)
  return dataTexture(
    size,
    (x, y) => {
      const turb = n(x, y) * 2.2 + m(x, y) * 0.6
      const s = Math.abs(Math.sin(((x * 2 + y) / size) * Math.PI * 2 + turb * Math.PI))
      const k = Math.min(1, Math.pow(1 - s, 14) * 0.85 + Math.pow(1 - s, 3) * 0.12)
      const shade = (m(x, y) - 0.5) * 0.18 + (f(x, y) - 0.5) * 0.06
      return [0, 1, 2].map((c) => Math.max(0, Math.min(255, Math.round((base[c] + (vein[c] - base[c]) * k) * (1 + shade))))) as [
        number,
        number,
        number,
      ]
    },
    true,
  )
}

/** Porcelanato de grande formato: rejunte fino nas bordas do ladrilho. */
function tileMap() {
  const size = 256
  const n = valueNoise(size, 16, 11)
  return dataTexture(
    size,
    (x, y) => {
      const grout = x < 2 || y < 2
      const v = grout ? 196 : 228 + Math.round((n(x, y) - 0.5) * 8)
      return [v, v - 3, v - 8]
    },
    true,
  )
}

/** Parede de seixos do lavabo: discos achatados com altura arredondada. */
function pebbleBump() {
  const size = 256
  const rand = rng(29)
  const h = new Float32Array(size * size)
  for (let k = 0; k < 520; k++) {
    const cx = rand() * size
    const cy = rand() * size
    const rx = 5 + rand() * 9
    const ry = rx * (0.55 + rand() * 0.35)
    const rot = rand() * Math.PI
    const c = Math.cos(rot)
    const s = Math.sin(rot)
    const r = Math.ceil(rx)
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const u = (dx * c + dy * s) / rx
        const v = (-dx * s + dy * c) / ry
        const d = u * u + v * v
        if (d >= 1) continue
        const px = (Math.floor(cx + dx) + size) % size
        const py = (Math.floor(cy + dy) + size) % size
        const val = Math.sqrt(1 - d)
        if (val > h[py * size + px]) h[py * size + px] = val
      }
    }
  }
  return dataTexture(
    size,
    (x, y) => {
      const v = Math.round(h[y * size + x] * 255)
      return [v, v, v]
    },
    false,
  )
}

// ── texturas de foto ────────────────────────────────────────────────────────

function photo(url: string, tileU: number, tileV: number, srgb = true, wrap: THREE.Wrapping = THREE.MirroredRepeatWrapping) {
  const t = new THREE.TextureLoader().load(url)
  t.wrapS = t.wrapT = wrap
  t.repeat.set(1 / tileU, 1 / tileV)
  t.anisotropy = 8
  if (srgb) t.colorSpace = THREE.SRGBColorSpace
  return t
}

/**
 * Foto com saturação reduzida (a textura de pedra tem pedras alaranjadas na borda que,
 * repetidas, formam colunas de manchas). Carrega a imagem e reprocessa num canvas.
 */
function photoMuted(url: string, tileU: number, tileV: number, keep: number) {
  const t = new THREE.Texture()
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(1 / tileU, 1 / tileV)
  t.anisotropy = 8
  t.colorSpace = THREE.SRGBColorSpace
  new THREE.ImageLoader().load(url, (img) => {
    const c = document.createElement('canvas')
    c.width = img.width
    c.height = img.height
    const g = c.getContext('2d')
    if (!g) return
    g.drawImage(img, 0, 0)
    const d = g.getImageData(0, 0, c.width, c.height)
    const px = d.data
    for (let i = 0; i < px.length; i += 4) {
      const l = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114
      // mantém um leve tom quente (bege) em vez de cinza puro
      px[i] = Math.min(255, l + (px[i] - l) * keep + 4)
      px[i + 1] = l + (px[i + 1] - l) * keep + 1
      px[i + 2] = Math.max(0, l + (px[i + 2] - l) * keep - 4)
    }
    g.putImageData(d, 0, 0)
    t.image = c
    t.needsUpdate = true
  })
  return t
}

function repeated(t: THREE.Texture, tile: number) {
  const c = t.clone()
  c.repeat.set(1 / tile, 1 / tile)
  c.needsUpdate = true
  return c
}

// ── materiais ───────────────────────────────────────────────────────────────

function createMaterials() {
  const S = (p: THREE.MeshStandardMaterialParameters & { name: string }) => new THREE.MeshStandardMaterial(p)

  const stoneTile = 1.0
  const fabric = fabricBump(5)
  const fine = fabricBump(17)

  const m = {
    // envoltória
    gesso: S({ name: 'gesso', color: 0xece7df, roughness: 0.95 }),
    corte: S({ name: 'corte', color: 0x8c8172, roughness: 1 }),
    base: S({ name: 'base', color: 0xbdb3a5, roughness: 1 }),
    porcelanato: S({ name: 'porcelanato', map: repeated(tileMap(), 1.2), roughness: 0.4, envMapIntensity: 0.5 }),
    vinilico: S({ name: 'vinilico', map: photo('/textures/wood.webp', 1.2, 4.8), color: 0xf4e6d0, roughness: 0.62 }),
    rodape: S({ name: 'rodape', color: 0xf3f0ea, roughness: 0.6 }),
    vidro: S({
      name: 'vidro',
      color: 0xdfe8e8,
      roughness: 0.05,
      metalness: 0,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
    caixilho: S({ name: 'caixilho', color: 0x3a3632, roughness: 0.45, metalness: 0.6 }),

    // pedra e madeira
    pedra: S({
      name: 'pedra',
      // RepeatWrapping: o espelhamento criava simetrias ("olhos") muito visíveis na pedra
      map: photoMuted('/textures/stone.webp', stoneTile, stoneTile * (1215 / 1024), 0.35),
      bumpMap: photo('/textures/stone-bump.webp', stoneTile, stoneTile * (1215 / 1024), false, THREE.RepeatWrapping),
      bumpScale: 0.9,
      roughness: 0.9,
    }),
    freijo: S({ name: 'freijo', map: photo('/textures/wood.webp', 0.6, 2.4), roughness: 0.58 }),
    freijoEscuro: S({ name: 'freijoEscuro', map: photo('/textures/wood-dark.webp', 0.6, 2.4), roughness: 0.55 }),

    // tecidos
    boucle: S({ name: 'boucle', color: 0xebe4d8, roughness: 1, bumpMap: repeated(fabric, 0.12), bumpScale: 2.2 }),
    linho: S({ name: 'linho', color: 0xf4f1eb, roughness: 1, bumpMap: repeated(fine, 0.08), bumpScale: 0.8 }),
    linhoBege: S({ name: 'linhoBege', color: 0xc8bba7, roughness: 1, bumpMap: repeated(fine, 0.08), bumpScale: 1 }),
    estofado: S({ name: 'estofado', color: 0xe3d8c8, roughness: 1, bumpMap: repeated(fabric, 0.1), bumpScale: 1.2 }),
    taupe: S({ name: 'taupe', color: 0x9f9182, roughness: 1, bumpMap: repeated(fine, 0.06), bumpScale: 1.2 }),
    cinzaManta: S({ name: 'cinzaManta', color: 0x938e86, roughness: 1, bumpMap: repeated(fine, 0.06), bumpScale: 1.2 }),
    terracota: S({ name: 'terracota', color: 0xb4532a, roughness: 0.95, bumpMap: repeated(fabric, 0.1), bumpScale: 1.5 }),
    salvia: S({ name: 'salvia', color: 0x8d9e96, roughness: 0.9, bumpMap: repeated(fine, 0.06), bumpScale: 1 }),
    tapete: S({ name: 'tapete', color: 0xd3ccc1, roughness: 1, bumpMap: repeated(fabric, 0.06), bumpScale: 1.5 }),
    couro: S({ name: 'couro', color: 0x8a5634, roughness: 0.5 }),
    voile: S({
      name: 'voile',
      color: 0xf6f1e8,
      roughness: 1,
      transparent: true,
      opacity: 0.58,
      side: THREE.DoubleSide,
      depthWrite: false,
      emissive: 0xfff1de,
      emissiveIntensity: 0.08,
    }),

    // pedras polidas e metais
    marmoreVerde: S({ name: 'marmoreVerde', map: repeated(marbleMap([46, 92, 76], [196, 214, 200], 3), 0.9), roughness: 0.12 }),
    marmoreEscuro: S({ name: 'marmoreEscuro', map: repeated(marbleMap([28, 34, 31], [120, 128, 118], 9), 0.7), roughness: 0.14 }),
    pedraBege: S({ name: 'pedraBege', color: 0xd8c2ad, roughness: 0.75, bumpMap: repeated(fine, 0.05), bumpScale: 1.2 }),
    seixos: S({ name: 'seixos', color: 0xefe2d2, roughness: 0.85, bumpMap: repeated(pebbleBump(), 0.6), bumpScale: 6 }),
    inox: S({ name: 'inox', color: 0xd9d6d0, metalness: 1, roughness: 0.25 }),
    metalEscuro: S({ name: 'metalEscuro', color: 0x2b2a28, metalness: 0.6, roughness: 0.35 }),
    latao: S({ name: 'latao', color: 0xc9a36a, metalness: 1, roughness: 0.3 }),
    espelho: S({ name: 'espelho', color: 0xdfe6e6, metalness: 1, roughness: 0.03 }),

    // marcenaria e louças
    laca: S({ name: 'laca', color: 0xf2f0eb, roughness: 0.45 }),
    lacaCinza: S({ name: 'lacaCinza', color: 0xe2e1dc, roughness: 0.5 }),
    quartzo: S({ name: 'quartzo', color: 0xf5f4f1, roughness: 0.22 }),
    ceramica: S({ name: 'ceramica', color: 0xf1ece4, roughness: 0.4 }),
    cubaTaupe: S({ name: 'cubaTaupe', color: 0x8c7b70, roughness: 0.55 }),
    vasoTerracota: S({ name: 'vasoTerracota', color: 0xc77a52, roughness: 0.8 }),
    tela: S({ name: 'tela', color: 0x0b0b0c, roughness: 0.12, metalness: 0.3 }),
    vidroEscuro: S({ name: 'vidroEscuro', color: 0x151514, roughness: 0.08, metalness: 0.2 }),
    folha: S({ name: 'folha', color: 0x557145, roughness: 0.75 }),

    // luminárias: emissivo muda com manhã/noite
    palha: S({ name: 'palha', color: 0xcfa86f, roughness: 0.9, bumpMap: repeated(fine, 0.03), bumpScale: 2, emissive: 0xffb36b, emissiveIntensity: 0 }),
    luz: S({ name: 'luz', color: 0xfff4e4, roughness: 0.6, emissive: 0xffd6a0, emissiveIntensity: 0 }),
  }
  return m
}

export type Materials = ReturnType<typeof createMaterials>
let cache: Materials | null = null

export function getMaterials(): Materials {
  if (!cache) cache = createMaterials()
  return cache
}

/** Materiais de uma parede externa: parede, tampa de corte, rodapé, caixilho e vidro. */
export type WallMaterials = Record<'wall' | 'cap' | 'board' | 'frame' | 'glass', THREE.MeshStandardMaterial>

/** Materiais-base de onde saem os clones mutáveis de cada instância. */
export type MutableBase = Pick<Materials, 'gesso' | 'corte' | 'rodape' | 'caixilho' | 'vidro' | 'luz' | 'palha' | 'voile'>

/**
 * Materiais MUTÁVEIS de uma instância de ApartmentModel. Duas maquetes montadas ao mesmo
 * tempo (ex.: abertura + seção da casa) não podem compartilhá-los, porque:
 *  - o WallFader (Task 10) altera opacity/transparent/depthWrite das paredes `wall-${side}*`;
 *  - `applyLighting` altera os emissivos de luz, palha e voile.
 * Texturas e geometrias continuam compartilhadas, já que `clone()` reaproveita as texturas.
 * A opacidade original de cada material de parede fica em `userData.baseOpacity`,
 * e o fader deve MULTIPLICAR esse valor (o vidro já começa em 0,18).
 */
export type InstanceMaterials = {
  walls: Record<Side, WallMaterials>
  luz: THREE.MeshStandardMaterial
  palha: THREE.MeshStandardMaterial
  voile: THREE.MeshStandardMaterial
  dispose: () => void
}

const SIDES: Side[] = ['n', 's', 'e', 'w']

export function createInstanceMaterials(base: MutableBase): InstanceMaterials {
  const all: THREE.Material[] = []
  const clone = (src: THREE.MeshStandardMaterial, name: string) => {
    const c = src.clone()
    c.name = name
    c.userData = { ...c.userData, baseOpacity: src.opacity }
    all.push(c)
    return c
  }
  const walls = Object.fromEntries(
    SIDES.map((side) => [
      side,
      {
        wall: clone(base.gesso, `wall-${side}`),
        cap: clone(base.corte, `wall-${side}-corte`),
        board: clone(base.rodape, `wall-${side}-rodape`),
        frame: clone(base.caixilho, `wall-${side}-caixilho`),
        glass: clone(base.vidro, `wall-${side}-vidro`),
      },
    ]),
  ) as Record<Side, WallMaterials>
  return {
    walls,
    luz: clone(base.luz, 'luz'),
    palha: clone(base.palha, 'palha'),
    voile: clone(base.voile, 'voile'),
    dispose: () => all.forEach((m) => m.dispose()),
  }
}

/** Ajustes de material que dependem do clima de luz (as luzes em si vêm da Task 10). */
export function applyLighting(m: Pick<InstanceMaterials, 'luz' | 'palha' | 'voile'>, lighting: Lighting) {
  const night = lighting === 'noite'
  m.luz.emissiveIntensity = night ? 2.4 : 0
  m.palha.emissiveIntensity = night ? 0.55 : 0
  m.voile.emissiveIntensity = night ? 0.02 : 0.08
  m.voile.opacity = night ? 0.75 : 0.58
}
