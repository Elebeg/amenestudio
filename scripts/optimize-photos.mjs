import sharp from 'sharp'
import { readdir, mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { photoId, targetSize } from './lib/photo-plan.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const srcDir = process.env.PHOTOS_SRC ?? path.join(root, 'folders')
const outDir = path.join(root, 'public/projetos/apartamento-pedra')
const jsonPath = path.join(root, 'src/content/projetos/apartamento-pedra/photos.generated.json')

await mkdir(outDir, { recursive: true })
await mkdir(path.dirname(jsonPath), { recursive: true })

const files = (await readdir(srcDir)).filter((f) => /\.jpe?g$/i.test(f))
const entries = []
for (const file of files) {
  const id = photoId(file)
  const input = path.join(srcDir, file)
  const oriented = await sharp(input).rotate().toBuffer({ resolveWithObject: true })
  const { width, height } = targetSize(oriented.info.width, oriented.info.height)
  const out = await sharp(oriented.data).resize(width, height).webp({ quality: 80 }).toBuffer()
  await writeFile(path.join(outDir, `${id}.webp`), out)
  const blur = await sharp(oriented.data).resize(16).webp({ quality: 50 }).toBuffer()
  entries.push({
    id,
    src: `/projetos/apartamento-pedra/${id}.webp`,
    width,
    height,
    blurDataURL: `data:image/webp;base64,${blur.toString('base64')}`,
  })
  console.log(id, width, height, Math.round(out.length / 1024) + 'KB')
}
entries.sort((a, b) => a.id.localeCompare(b.id))
await writeFile(jsonPath, JSON.stringify(entries, null, 2) + '\n')
console.log(`${entries.length} fotos`)
