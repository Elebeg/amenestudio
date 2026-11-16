import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacidade' }

export default function PrivacidadePage() {
  return (
    <main style={{ maxWidth: '40rem', margin: '0 auto', padding: '8rem 1.5rem 4rem' }}>
      <h1>Privacidade</h1>
      <p>Este site não coleta dados pessoais e não utiliza cookies de rastreamento.</p>
      <p>
        O formulário de contato apenas monta uma mensagem e abre o WhatsApp no seu dispositivo.
        Nenhuma informação é enviada ou armazenada em nossos servidores.
      </p>
      <p>
        Usamos o Vercel Analytics para medir acessos de forma agregada e anônima, sem cookies.
      </p>
    </main>
  )
}
