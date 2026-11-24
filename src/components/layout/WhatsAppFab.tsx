'use client'

import { site } from '@/config/site'
import { useIntroPhase } from '@/components/intro/introStore'
import styles from './WhatsAppFab.module.css'

/** Botão flutuante do WhatsApp: só aparece depois da abertura (`done`). */
export function WhatsAppFab({ visible }: { visible: boolean }) {
  const introDone = useIntroPhase() === 'done'
  const number = site.whatsapp.number
  if (!number) return null
  const show = visible && introDone
  return (
    <a
      href={`https://wa.me/${number}`}
      className={`${styles.fab} ${show ? '' : styles.hidden}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar pelo WhatsApp"
      aria-hidden={show ? undefined : true}
      tabIndex={show ? 0 : -1}
    >
      WhatsApp
    </a>
  )
}
