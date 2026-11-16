import { describe, it, expect } from 'vitest'
import { photoId, targetSize } from '../../scripts/lib/photo-plan.mjs'

describe('photo-plan', () => {
  it('photoId remove -HDR e extensão', () => {
    expect(photoId('IMG_4592-HDR.jpg')).toBe('IMG_4592')
    expect(photoId('IMG_4759.jpg')).toBe('IMG_4759')
  })
  it('targetSize limita a maior aresta e nunca amplia', () => {
    expect(targetSize(6240, 4160)).toEqual({ width: 2400, height: 1600 })
    expect(targetSize(4160, 6240)).toEqual({ width: 1600, height: 2400 })
    expect(targetSize(1200, 800)).toEqual({ width: 1200, height: 800 })
  })
})
