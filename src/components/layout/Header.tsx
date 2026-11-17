'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import styles from './Header.module.css'

const links = [
  { href: '/#casa', label: 'Casa' },
  { href: '/#projetos', label: 'Projetos' },
  { href: '/#processo', label: 'Processo' },
  { href: '/#estudio', label: 'Estúdio' },
  { href: '/#contato', label: 'Contato' },
]

const SCROLL_THRESHOLD = 24

export function Header() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > SCROLL_THRESHOLD)
    update()
    window.addEventListener('scroll', update, { passive: true })
    return () => window.removeEventListener('scroll', update)
  }, [])

  return (
    <header className={styles.header} data-scrolled={scrolled ? 'true' : 'false'}>
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
