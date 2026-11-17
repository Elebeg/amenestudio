import type { Metadata } from 'next'
import { site } from '@/config/site'
import { Casa } from '@/components/sections/Casa'
import { Manifesto } from '@/components/sections/Manifesto'
import { ProjetosDestaque } from '@/components/sections/ProjetosDestaque'
import { Processo } from '@/components/sections/Processo'
import { Estudio } from '@/components/sections/Estudio'
import { Contato } from '@/components/sections/Contato'

export const metadata: Metadata = {
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: site.name,
    title: `${site.name} · Arquitetura e interiores`,
    description: site.description,
    url: '/',
  },
}

export default function Home() {
  return (
    <main>
      <Casa />
      <Manifesto />
      <ProjetosDestaque />
      <Processo />
      <Estudio />
      <Contato />
    </main>
  )
}
