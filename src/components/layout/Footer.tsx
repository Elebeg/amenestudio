import Link from 'next/link'
import { site } from '@/config/site'
import styles from './Footer.module.css'

export function Footer() {
  const { address, instagram, cnpj, cau } = site
  return (
    <footer className={styles.footer}>
      <div className={styles.row}>
        <address>
          {address.street}
          <br />
          {address.city} - {address.state}, {address.postalCode}
        </address>
        <p className={styles.legal}>
          <a href={instagram.url} target="_blank" rel="noopener noreferrer">
            @{instagram.handle}
          </a>
        </p>
        <p className={styles.legal}>
          {cnpj && <>CNPJ {cnpj}<br /></>}
          {cau && <>CAU {cau}<br /></>}
          <Link href="/privacidade">Privacidade</Link>
        </p>
      </div>
    </footer>
  )
}
