import { describe, it, expect } from 'vitest'
import { site } from '@/config/site'

describe('site config', () => {
  it('whatsapp number is null or digits only with country code', () => {
    const n = site.whatsapp.number
    expect(n === null || /^55\d{10,11}$/.test(n)).toBe(true)
  })
  it('instagram url matches handle', () =>
    expect(site.instagram.url).toBe(`https://www.instagram.com/${site.instagram.handle}/`))
})
