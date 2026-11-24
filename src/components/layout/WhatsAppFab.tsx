'use client'

import { usePathname } from 'next/navigation'
import { site } from '@/config/site'
import { track } from '@/lib/analytics'
import { useIntroPhase } from '@/components/intro/introStore'
import styles from './WhatsAppFab.module.css'

/**
 * Botão flutuante do WhatsApp. Fora da home ele já vem visível no HTML (não depende de JS);
 * na home espera a abertura terminar (`done`).
 */
export function WhatsAppFab({ visible }: { visible: boolean }) {
  const home = usePathname() === '/'
  const phase = useIntroPhase()
  const introDone = !home || phase === 'done'
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
      onClick={() => track('click_whatsapp_fab')}
    >
      WhatsApp
    </a>
  )
}
