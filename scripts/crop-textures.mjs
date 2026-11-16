import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = process.env.PHOTOS_SRC ?? path.join(root, 'folders')
const outDir = path.join(root, 'public/textures')
const input = path.join(srcDir, 'IMG_4759.jpg')
await mkdir(outDir, { recursive: true })

// Coordenadas no espaço original (6160x4107, após rotação EXIF)
const region = (x1, y1, x2, y2) => ({ left: x1, top: y1, width: x2 - x1, height: y2 - y1 })
const base = () => sharp(input).rotate()

const stone = region(1240, 360, 2420, 1760)
await base().extract(stone).resize({ width: 1024 }).webp({ quality: 82 }).toFile(path.join(outDir, 'stone.webp'))
await base().extract(stone).resize({ width: 1024 }).greyscale().normalize().webp({ quality: 82 }).toFile(path.join(outDir, 'stone-bump.webp'))
await base().extract(region(60, 500, 520, 3400)).resize(512, 2048, { fit: 'fill' }).webp({ quality: 82 }).toFile(path.join(outDir, 'wood.webp'))
await base().extract(region(60, 500, 520, 3400)).resize(512, 2048, { fit: 'fill' }).modulate({ brightness: 0.55 }).webp({ quality: 82 }).toFile(path.join(outDir, 'wood-dark.webp'))
console.log('texturas ok')
