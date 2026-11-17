import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

export const OG_SIZE = { width: 1200, height: 630 }

/** Lê a foto de /public e entrega JPEG 1200x630 como data URL (ImageResponse não decodifica webp). */
async function coverDataUrl(src: string): Promise<string> {
  const file = path.join(process.cwd(), 'public', src)
  const buf = await sharp(await readFile(file))
    .resize(OG_SIZE.width, OG_SIZE.height, { fit: 'cover', position: 'attention' })
    .jpeg({ quality: 80 })
    .toBuffer()
  return `data:image/jpeg;base64,${buf.toString('base64')}`
}

export async function renderOg(coverSrc: string, subtitle?: string) {
  const bg = await coverDataUrl(coverSrc)
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bg} width={OG_SIZE.width} height={OG_SIZE.height} alt="" style={{ position: 'absolute', inset: 0 }} />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 64,
            color: '#fff',
            background: 'linear-gradient(to top, rgba(28,25,22,0.75), rgba(28,25,22,0) 60%)',
          }}
        >
          {subtitle ? <div style={{ fontSize: 40, marginBottom: 12 }}>{subtitle}</div> : null}
          <div style={{ fontSize: 64, letterSpacing: 24 }}>AMENE</div>
        </div>
      </div>
    ),
    OG_SIZE,
  )
}
