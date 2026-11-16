import { track as vercelTrack } from '@vercel/analytics'

export type TrackEvent = 'lead_whatsapp' | 'click_instagram' | 'click_whatsapp_fab'

export function track(event: TrackEvent, props?: Record<string, string>): void {
  try {
    vercelTrack(event, props)
  } catch {
    // analytics nunca deve quebrar a interação
  }
}
