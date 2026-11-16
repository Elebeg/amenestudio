import Link from 'next/link'
import styles from './Header.module.css'

const links = [
  { href: '/#casa', label: 'Casa' },
  { href: '/#projetos', label: 'Projetos' },
  { href: '/#processo', label: 'Processo' },
  { href: '/#estudio', label: 'Estúdio' },
  { href: '/#contato', label: 'Contato' },
]

export function Header() {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo} aria-label="Amene, página inicial">
        AMENE
      </Link>
      <nav className={styles.nav} aria-label="Principal">
        <ul>
          {links.map((l) => (
            <li key={l.href}>
              <a href={l.href}>{l.label}</a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
