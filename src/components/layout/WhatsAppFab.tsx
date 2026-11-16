import { site } from '@/config/site'
import styles from './WhatsAppFab.module.css'

export function WhatsAppFab({ visible }: { visible: boolean }) {
  const number = site.whatsapp.number
  if (!number) return null
  return (
    <a
      href={`https://wa.me/${number}`}
      className={`${styles.fab} ${visible ? '' : styles.hidden}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar pelo WhatsApp"
      tabIndex={visible ? 0 : -1}
    >
      WhatsApp
    </a>
  )
}
