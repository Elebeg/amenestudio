import Link from 'next/link'

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: '100svh',
        display: 'grid',
        alignContent: 'center',
        justifyItems: 'start',
        gap: '1.5rem',
        padding: '8rem clamp(1.25rem, 4vw, 4rem) 4rem',
      }}
    >
      <p style={{ margin: 0, fontSize: '0.75rem', letterSpacing: '0.24em', textTransform: 'uppercase', color: 'var(--accent)' }}>
        Erro 404
      </p>
      <h1 style={{ margin: 0, fontSize: 'clamp(2.5rem, 8vw, 7rem)', lineHeight: 1 }}>
        Esta página não foi encontrada
      </h1>
      <p style={{ margin: 0, maxWidth: '36rem', lineHeight: 1.7, color: 'var(--muted)' }}>
        O endereço pode ter mudado ou o projeto não está mais disponível.
      </p>
      <Link
        href="/"
        style={{
          color: 'var(--fg)',
          textDecoration: 'none',
          fontSize: '0.85rem',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          borderBottom: '1px solid var(--accent)',
          padding: '1rem 0',
        }}
      >
        Voltar para a página inicial
      </Link>
    </main>
  )
}
