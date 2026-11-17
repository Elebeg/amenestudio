import { Casa } from '@/components/sections/Casa'
import { Manifesto } from '@/components/sections/Manifesto'
import { ProjetosDestaque } from '@/components/sections/ProjetosDestaque'
import { Processo } from '@/components/sections/Processo'
import { Estudio } from '@/components/sections/Estudio'
import { Contato } from '@/components/sections/Contato'

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
